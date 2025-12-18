import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events, eventParticipants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/session";

// POST: Join an event by code
export async function POST(request: NextRequest) {
    try {
        const user = await getSession();
        const body = await request.json();
        const { code } = body;

        if (!code) {
            return NextResponse.json(
                { error: "Event code is required" },
                { status: 400 }
            );
        }

        // Find event by code
        const eventResult = await db.select().from(events).where(eq(events.code, code.toUpperCase())).limit(1);

        if (eventResult.length === 0) {
            return NextResponse.json(
                { error: "Event not found" },
                { status: 404 }
            );
        }

        const event = eventResult[0];

        // If user is authenticated, handle participant logic
        if (user) {
            // Check if user is already a participant
            const existingParticipant = await db.select()
                .from(eventParticipants)
                .where(and(
                    eq(eventParticipants.eventId, event.eventId),
                    eq(eventParticipants.userId, user.id)
                ))
                .limit(1);

            if (existingParticipant.length === 0) {
                // Add user as participant
                await db.insert(eventParticipants).values({
                    eventId: event.eventId,
                    userId: user.id,
                });
            }
        }

        // Return event for both authenticated and guest users
        return NextResponse.json({ event });
    } catch (error) {
        console.error("Join event error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
