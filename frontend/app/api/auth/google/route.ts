import { NextRequest, NextResponse } from "next/server";

// GET: Redirect to Google OAuth
export async function GET(request: NextRequest) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
    const redirectUri = `${baseUrl}/api/auth/callback/google`;

    if (!clientId) {
        return NextResponse.redirect(new URL('/login?error=google_not_configured', request.url));
    }

    const scope = encodeURIComponent('openid email profile');
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

    return NextResponse.redirect(googleAuthUrl);
}
