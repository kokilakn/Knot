import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { setSession } from "@/lib/session";

interface GoogleTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    id_token?: string;
}

interface GoogleUserInfo {
    id: string;
    email: string;
    name: string;
    picture?: string;
}

// GET: Handle Google OAuth callback
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL('/login?error=google_cancelled', request.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/login?error=no_code', request.url));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
    const redirectUri = `${baseUrl}/api/auth/callback/google`;

    if (!clientId || !clientSecret) {
        return NextResponse.redirect(new URL('/login?error=google_not_configured', request.url));
    }

    try {
        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        if (!tokenResponse.ok) {
            console.error('Token exchange failed:', await tokenResponse.text());
            return NextResponse.redirect(new URL('/login?error=token_exchange_failed', request.url));
        }

        const tokens: GoogleTokenResponse = await tokenResponse.json();

        // Get user info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
            },
        });

        if (!userInfoResponse.ok) {
            console.error('Failed to get user info:', await userInfoResponse.text());
            return NextResponse.redirect(new URL('/login?error=user_info_failed', request.url));
        }

        const googleUser: GoogleUserInfo = await userInfoResponse.json();

        // Check if user exists with this OAuth ID
        let user = await db.select().from(users).where(eq(users.oauthId, googleUser.id)).limit(1);

        if (user.length === 0) {
            // Check if user exists with this email (maybe registered with password before) - case insensitive
            user = await db.select().from(users).where(sql`lower(${users.email}) = ${googleUser.email.toLowerCase()}`).limit(1);

            if (user.length > 0) {
                // Update existing user with OAuth ID and avatar
                await db.update(users)
                    .set({
                        oauthId: googleUser.id,
                        avatarUrl: googleUser.picture || user[0].avatarUrl,
                        name: googleUser.name || user[0].name,
                        updatedAt: new Date(),
                    })
                    .where(eq(users.id, user[0].id));
            } else {
                // Create new user
                const newUser = await db.insert(users).values({
                    email: googleUser.email.toLowerCase(),
                    name: googleUser.name,
                    oauthId: googleUser.id,
                    avatarUrl: googleUser.picture || null,
                }).returning();
                user = newUser;
            }
        } else {
            // Update avatar URL if changed
            if (googleUser.picture && googleUser.picture !== user[0].avatarUrl) {
                await db.update(users)
                    .set({
                        avatarUrl: googleUser.picture,
                        updatedAt: new Date(),
                    })
                    .where(eq(users.id, user[0].id));
            }
        }

        // Set session
        await setSession(user[0].id);

        // Redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (error) {
        console.error('Google OAuth error:', error);
        return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
    }
}
