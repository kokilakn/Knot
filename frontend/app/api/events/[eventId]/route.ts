import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq, or } from "drizzle-orm";

// GET: Fetch event by ID or code
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;



        // Check if input looks like a UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);

        let queryCondition;
        if (isUuid) {
            queryCondition = or(
                eq(events.eventId, eventId),
                eq(events.code, eventId.toUpperCase())
            );
        } else {
            queryCondition = eq(events.code, eventId.toUpperCase());
        }

        // Try to find by event_id first, then by code
        const eventResult = await db.select().from(events)
            .where(queryCondition)
            .limit(1);

        if (eventResult.length === 0) {
            return NextResponse.json(
                { error: "Event not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ event: eventResult[0] });
    } catch (error) {
        console.error("Get event error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
