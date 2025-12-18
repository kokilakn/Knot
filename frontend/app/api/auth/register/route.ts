import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { setSession } from "@/lib/session";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, name } = body;

        if (!email || !password || !name) {
            return NextResponse.json(
                { error: "Email, password, and name are required" },
                { status: 400 }
            );
        }

        // Check if user already exists (case-insensitive)
        const existingUser = await db.select().from(users).where(sql`lower(${users.email}) = ${email.toLowerCase()}`).limit(1);

        if (existingUser.length > 0) {
            return NextResponse.json(
                { error: "An account with this email already exists" },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = await db.insert(users).values({
            email: email.toLowerCase(),
            password: hashedPassword,
            name,
        }).returning({
            id: users.id,
            email: users.email,
            name: users.name,
            avatarUrl: users.avatarUrl,
        });

        // Set session cookie
        await setSession(newUser[0].id);

        return NextResponse.json({
            user: newUser[0],
        }, { status: 201 });
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
