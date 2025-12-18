import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { setSession } from "@/lib/session";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // Find user by email (case-insensitive)
        const userResult = await db.select().from(users).where(sql`lower(${users.email}) = ${email.toLowerCase()}`).limit(1);

        if (userResult.length === 0) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        const user = userResult[0];

        // Check if user has a password (not OAuth-only)
        if (!user.password) {
            return NextResponse.json(
                { error: "Please sign in with Google" },
                { status: 401 }
            );
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Set session cookie
        await setSession(user.id);

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatarUrl: user.avatarUrl,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
