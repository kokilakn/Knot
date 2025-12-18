import { cookies } from 'next/headers';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const SESSION_COOKIE_NAME = 'knot_session';

export interface SessionUser {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
}

export async function getSession(): Promise<SessionUser | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
        return null;
    }

    try {
        const userId = sessionCookie.value;
        const user = await db.select({
            id: users.id,
            email: users.email,
            name: users.name,
            avatarUrl: users.avatarUrl,
        }).from(users).where(eq(users.id, userId)).limit(1);

        if (user.length === 0) {
            return null;
        }

        return user[0];
    } catch (error) {
        console.error('Session error:', error);
        return null;
    }
}

export async function setSession(userId: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    });
}

export async function clearSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}

// Generate a 10-character alphanumeric code
export function generateEventCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0/O, 1/I
    let code = '';
    for (let i = 0; i < 10; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
