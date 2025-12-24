import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events, eventParticipants } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { getSession, generateEventCode } from "@/lib/session";
import { storage } from "@/lib/storage";

// GET: Fetch events for current user (created by or participating in)
export async function GET() {
    try {
        const user = await getSession();

        if (!user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        // Get events where user is creator
        const createdEvents = await db.select().from(events).where(eq(events.userId, user.id));

        // Get events where user is participant
        const participatingEventIds = await db.select({ eventId: eventParticipants.eventId })
            .from(eventParticipants)
            .where(eq(eventParticipants.userId, user.id));

        const participantEventIdList = participatingEventIds.map(p => p.eventId);

        // Get full event details for participated events
        let participatedEvents: typeof createdEvents = [];
        if (participantEventIdList.length > 0) {
            participatedEvents = await db.select().from(events)
                .where(or(...participantEventIdList.map(id => eq(events.eventId, id))));
        }

        // Combine and deduplicate
        const allEventsMap = new Map<string, typeof createdEvents[0]>();
        [...createdEvents, ...participatedEvents].forEach(event => {
            allEventsMap.set(event.eventId, event);
        });

        const allEvents = Array.from(allEventsMap.values());

        return NextResponse.json({ events: allEvents });
    } catch (error) {
        console.error("Get events error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST: Create new event
export async function POST(request: NextRequest) {
    try {
        const user = await getSession();

        if (!user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        let name: string, eventDate: string, notes: string | null = null, coverPageUrl: string | null = null;
        let coverFile: File | null = null;

        const contentType = request.headers.get("content-type") || "";
        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            name = formData.get("name") as string;
            eventDate = formData.get("eventDate") as string;
            notes = formData.get("notes") as string || null;
            const fileEntry = formData.get("coverPhoto");
            if (fileEntry && fileEntry instanceof File && fileEntry.size > 0) {
                coverFile = fileEntry;
            }
        } else {
            const body = await request.json();
            name = body.name;
            eventDate = body.eventDate;
            notes = body.notes || null;
            coverPageUrl = body.coverPageUrl || null;
        }

        if (!name || !eventDate) {
            return NextResponse.json(
                { error: "Name and date are required" },
                { status: 400 }
            );
        }

        // Generate unique 10-character code
        let code = generateEventCode();
        let codeExists = true;
        let attempts = 0;

        while (codeExists && attempts < 10) {
            const existing = await db.select().from(events).where(eq(events.code, code)).limit(1);
            if (existing.length === 0) {
                codeExists = false;
            } else {
                code = generateEventCode();
                attempts++;
            }
        }

        if (codeExists) {
            return NextResponse.json(
                { error: "Failed to generate unique event code" },
                { status: 500 }
            );
        }

        // Handle File Save
        if (coverFile) {
            try {
                const buffer = Buffer.from(await coverFile.arrayBuffer());
                // Use code as filename prefix, preserve extension
                const ext = coverFile.name.split('.').pop() || 'jpg';
                const filename = `coverphotos/${code}.${ext}`;

                // Upload via storage service
                coverPageUrl = await storage.upload(buffer, filename, coverFile.type);
            } catch (err) {
                console.error("Error saving cover photo to R2:", err);
            }
        }

        // Create the event
        const newEvent = await db.insert(events).values({
            name,
            code,
            eventDate: new Date(eventDate),
            userId: user.id,
            notes: notes,
            coverPageUrl: coverPageUrl,
        }).returning();

        // Auto-add creator to event participants
        await db.insert(eventParticipants).values({
            eventId: newEvent[0].eventId,
            userId: user.id,
        });

        return NextResponse.json({ event: newEvent[0] }, { status: 201 });
    } catch (error) {
        console.error("Create event error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
