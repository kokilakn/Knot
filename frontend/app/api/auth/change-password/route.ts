import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: "Current password and new password are required" },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: "New password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // Get user with password
        const userResult = await db.select().from(users).where(eq(users.id, session.id)).limit(1);

        if (userResult.length === 0) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const user = userResult[0];

        // Check if user has a password (not OAuth-only)
        if (!user.password) {
            return NextResponse.json(
                { error: "Cannot change password for accounts signed in with Google. Please use Google to sign in." },
                { status: 400 }
            );
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return NextResponse.json(
                { error: "Current password is incorrect" },
                { status: 401 }
            );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await db.update(users)
            .set({
                password: hashedPassword,
                updatedAt: new Date(),
            })
            .where(eq(users.id, session.id));

        return NextResponse.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        console.error("Change password error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
