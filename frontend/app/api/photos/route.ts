import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import heicConvert from 'heic-convert';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const link = searchParams.get('link');

    if (!link) {
        return new NextResponse("Link is required", { status: 400 });
    }

    try {
        // Construct path - security note: in production, you'd want to validate this path
        const absolutePath = path.join(process.cwd(), "public", link);

        // Check if file exists
        try {
            await fs.access(absolutePath);
        } catch {
            return new NextResponse("File not found", { status: 404 });
        }

        const lowerPath = absolutePath.toLowerCase();
        if (lowerPath.endsWith('.heic') || lowerPath.endsWith('.heif')) {
            const inputBuffer = await fs.readFile(absolutePath);
            const outputBuffer = await heicConvert({
                buffer: inputBuffer,
                format: 'JPEG',
                quality: 0.9 // Slightly lower for faster preview
            });

            return new NextResponse(outputBuffer, {
                headers: {
                    'Content-Type': 'image/jpeg',
                    'Cache-Control': 'public, max-age=31536000, immutable'
                }
            });
        }

        // For other files, just pipe them through or let the browser handle them directly
        // But since we are here, we might as well serve them
        const fileBuffer = await fs.readFile(absolutePath);
        const ext = path.extname(lowerPath);
        const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        });

    } catch (error: any) {
        console.error("Photo proxy error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
