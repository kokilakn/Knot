import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events, photos } from "@/db/schema";
import { eq, or, desc } from "drizzle-orm";
import { getSession } from "@/lib/session";
import path from "path";
import { promises as fs } from "fs";
import { BACKEND_URL } from "@/lib/constants";

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

        const event = await findEvent(eventId);

        if (event.length === 0) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        // Fetch photos for this event from the database
        const eventPhotos = await db.select().from(photos)
            .where(eq(photos.eventId, event[0].eventId))
            .orderBy(desc(photos.createdAt));

        // Return full photo objects for permission checks
        return NextResponse.json({
            photos: eventPhotos.map(p => p.link),
            photoDetails: eventPhotos.map(p => ({
                id: p.id,
                link: p.link,
                uploaderId: p.uploaderId,
                createdAt: p.createdAt,
            })),
            eventCreatorId: event[0].userId,
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

            // Insert into database with uploaderId
            await db.insert(photos).values({
                link: link,
                eventId: event[0].eventId,
                uploaderId: user.id,
            });

            // Fire-and-forget: Trigger background face processing (non-blocking)
            // Using void to explicitly indicate we don't wait for this
            void (async () => {
                try {
                    await fetch(`${BACKEND_URL}/api/faces/process`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ link, eventId: event[0].eventId })
                    });
                    console.log(`Face processing triggered for ${link}`);
                } catch (err) {
                    console.error(`Face processing trigger failed for ${link}:`, err);
                }
            })();

            savedPaths.push(link);
        }

        return NextResponse.json({ success: true, photos: savedPaths });

    } catch (error) {
        console.error("Upload photos error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE: Delete a photo
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ eventId: string }> }
) {
    try {
        const user = await getSession();

        if (!user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { eventId } = await context.params;
        const event = await findEvent(eventId);

        if (event.length === 0) {
            return NextResponse.json({ error: "Event not found" }, { status: 404 });
        }

        const { photoIds } = await request.json();

        if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
            return NextResponse.json({ error: "No photo IDs provided" }, { status: 400 });
        }

        const isEventCreator = event[0].userId === user.id;

        // Fetch photos to check permissions
        const photosToDelete = await db.select().from(photos)
            .where(eq(photos.eventId, event[0].eventId));

        const deletedPhotos: string[] = [];
        const errors: string[] = [];

        for (const photoId of photoIds) {
            const photo = photosToDelete.find(p => p.id === photoId);

            if (!photo) {
                errors.push(`Photo ${photoId} not found`);
                continue;
            }

            // Check permission: Event creator can delete any, uploader can delete their own
            if (!isEventCreator && photo.uploaderId !== user.id) {
                errors.push(`No permission to delete photo ${photoId}`);
                continue;
            }

            // Delete file from filesystem
            try {
                const filePath = path.join(process.cwd(), "public", photo.link);
                await fs.unlink(filePath);
            } catch (err) {
                console.error(`Failed to delete file ${photo.link}:`, err);
            }

            // Delete from database
            await db.delete(photos).where(eq(photos.id, photoId));
            deletedPhotos.push(photoId);
        }

        return NextResponse.json({
            success: true,
            deleted: deletedPhotos,
            errors: errors.length > 0 ? errors : undefined,
        });

    } catch (error) {
        console.error("Delete photos error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

