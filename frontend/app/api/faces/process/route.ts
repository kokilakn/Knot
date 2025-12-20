import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/constants";

/**
 * POST /api/faces/process
 * Proxy to backend face processing service.
 * This keeps the backend URL hidden from the browser.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const response = await fetch(`${BACKEND_URL}/api/faces/process`, {
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
        console.error('Face process proxy error:', error);
        return NextResponse.json(
            { error: 'Failed to connect to face recognition service' },
            { status: 503 }
        );
    }
}
