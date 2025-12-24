import "server-only";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { StorageProvider } from "../types";

export class R2StorageProvider implements StorageProvider {
    private client: S3Client;
    private bucket: string;

    constructor() {
        const accountId = process.env.R2_ACCOUNT_ID;
        const accessKeyId = process.env.R2_ACCESS_KEY_ID;
        const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

        if (!accountId || !accessKeyId || !secretAccessKey) {
            console.warn("R2 credentials not found. R2StorageProvider might fail.");
        }

        this.client = new S3Client({
            region: "auto",
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: accessKeyId || "",
                secretAccessKey: secretAccessKey || "",
            },
        });

        this.bucket = process.env.R2_BUCKET_NAME || "knot";
    }

    async upload(file: Buffer, path: string, contentType: string): Promise<string> {
        // Ensure path doesn't have leading slash for key
        const key = path.startsWith('/') ? path.slice(1) : path;

        await this.client.send(new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: file,
            ContentType: contentType,
        }));

        // Return a relative URL to our proxy API
        return `/api/photos/${key}`;
    }

    async delete(pathOrUrl: string): Promise<void> {
        let key = pathOrUrl;

        // Extract key from proxy URL path or full URL
        if (pathOrUrl.startsWith('/api/photos/')) {
            key = pathOrUrl.replace('/api/photos/', '');
        } else if (pathOrUrl.startsWith('http')) {
            try {
                const urlObj = new URL(pathOrUrl);
                // pathname includes leading slash, S3 key usually shouldn't
                key = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;

                // If it's our proxy URL, it might have /api/photos/ prefix after the domain
                if (key.startsWith('api/photos/')) {
                    key = key.replace('api/photos/', '');
                }
            } catch (e) {
                // Fallback: use as is
            }
        } else if (pathOrUrl.startsWith('/')) {
            key = pathOrUrl.substring(1);
        }

        try {
            await this.client.send(new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: key,
            }));
        } catch (error) {
            console.error(`[R2Storage] Failed to delete key: ${key}`, error);
            throw error;
        }
    }
}
