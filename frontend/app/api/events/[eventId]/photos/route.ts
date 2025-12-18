import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events, photos } from "@/db/schema";
import { eq, or, desc } from "drizzle-orm";
import { getSession } from "@/lib/session";
import path from "path";
import { promises as fs } from "fs";

// Helper to find event
async function findEvent(idOrCode: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);

    if (isUuid) {
        return db.select().from(events).where(
            or(eq(events.eventId, idOrCode), eq(events.code, idOrCode.toUpperCase()))
        ).limit(1);
    } else {
        return db.select().from(events).where(eq(events.code, idOrCode.toUpperCase())).limit(1);
    }
}

// GET: List photos for an event
export async function GET(
    _request: NextRequest,
    context: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await context.params;

        // We allow public access to gallery if they have the link/ID? 
        // Or restrict to participants? For now, let's restrict to authenticated users at least?
        // The user requirements didn't specify strict privacy, but let's at least check auth.
        // Actually, guests might need to see it too. Let's just check event exists.

        const event = await findEvent(eventId);

        if (event.length === 0) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // Fetch photos for this event from the database
        const eventPhotos = await db.select().from(photos)
            .where(eq(photos.eventId, event[0].eventId))
            .orderBy(desc(photos.createdAt));

        return NextResponse.json({
            photos: eventPhotos.map(p => p.link)
        });

    } catch (error) {
        console.error("Get photos error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST: Upload photos
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ eventId: string }> }
) {
    try {
        const user = await getSession();
        // If we want guests to contribute, we might relax this, but let's assume auth required for now (or guest session).
        // Since we have guest login, user should be present.

        if (!user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { eventId } = await context.params;
        const event = await findEvent(eventId);

        if (event.length === 0) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const code = event[0].code;
        const formData = await request.formData();
        const files = formData.getAll("photos") as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No photos uploaded" }, { status: 400 });
        }

        const uploadDir = path.join(process.cwd(), "public", "uploads", "events", code);
        await fs.mkdir(uploadDir, { recursive: true });

        const savedPaths: string[] = [];

        for (const file of files) {
            if (!(file instanceof File)) continue;

            const buffer = Buffer.from(await file.arrayBuffer());
            // unique filename
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 1000);
            const ext = file.name.split('.').pop() || 'jpg';
            const filename = `photo_${timestamp}_${random}.${ext}`;
            const link = `/uploads/events/${code}/${filename}`;

            await fs.writeFile(path.join(uploadDir, filename), buffer);

            // Insert into database
            await db.insert(photos).values({
                link: link,
                eventId: event[0].eventId,
            });

            // Trigger background processing (await to ensure it's sent, but continues loop)
            try {
                const processRes = await fetch('http://localhost:5000/api/faces/process', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ link, eventId: event[0].eventId })
                });
                const processData = await processRes.json();
                console.log(`Face processing triggered for ${link}:`, processData);
            } catch (err) {
                console.error(`Face processing trigger failed for ${link}:`, err);
            }

            savedPaths.push(link);
        }

        return NextResponse.json({ success: true, photos: savedPaths });

    } catch (error) {
        console.error("Upload photos error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
