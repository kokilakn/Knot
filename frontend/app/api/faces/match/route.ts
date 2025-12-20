import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/constants";

/**
 * POST /api/faces/match
 * Proxy to backend face matching service.
 * This keeps the backend URL hidden from the browser.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const response = await fetch(`${BACKEND_URL}/api/faces/match`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Face match proxy error:', error);
        return NextResponse.json(
            { error: 'Failed to connect to face recognition service' },
            { status: 503 }
        );
    }
}
