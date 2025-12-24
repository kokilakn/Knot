import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import "server-only";

const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "knot";

export async function GET(
    _request: NextRequest,
    { params }: { params: { key: string[] } }
) {
    try {
        const key = params.key.join("/");

        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        const response = await s3Client.send(command);

        if (!response.Body) {
            return new NextResponse("Not Found", { status: 404 });
        }

        // Convert ReadableStream to Buffer/Blob
        // In Next.js App Router, we can return the response body directly if it's a stream
        const body = response.Body as any;

        return new NextResponse(body, {
            headers: {
                "Content-Type": response.ContentType || "image/jpeg",
                "Cache-Control": "public, max-age=31536000, immutable",
                "Content-Length": response.ContentLength?.toString() || "",
            },
        });

    } catch (error: any) {
        console.error("[PhotoProxy] Error fetching from R2:", error);
        if (error.name === "NoSuchKey") {
            return new NextResponse("Not Found", { status: 404 });
        }
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
