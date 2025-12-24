import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import StorageProvider from './StorageProvider.js';

class R2StorageProvider extends StorageProvider {
    constructor() {
        super();
        this.client = new S3Client({
            region: "auto",
            endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
            },
        });
        this.bucket = process.env.R2_BUCKET_NAME || "knot";
    }

    async getFile(urlOrPath) {
        let key = urlOrPath;

        // If it starts with /api/photos/, extract the part after it
        if (urlOrPath.startsWith('/api/photos/')) {
            key = urlOrPath.replace('/api/photos/', '');
        } else if (urlOrPath.startsWith('http')) {
            // Fallback for full URLs if any legacy code provides them
            try {
                const urlObj = new URL(urlOrPath);
                key = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
                // If the URL is our proxy URL, it might have /api/photos/ prefix
                if (key.startsWith('api/photos/')) {
                    key = key.replace('api/photos/', '');
                }
            } catch (e) {
                // use as is
            }
        }

        console.log(`[R2Storage] Fetching key "${key}" from bucket "${this.bucket}"`);

        try {
            const command = new GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });

            const response = await this.client.send(command);

            if (!response.Body) {
                throw new Error('Response body is empty');
            }

            // Convert Stream to Buffer
            const chunks = [];
            for await (const chunk of response.Body) {
                chunks.push(chunk);
            }
            return Buffer.concat(chunks);

        } catch (error) {
            console.error(`[R2Storage] Error getting file from R2:`, error);
            throw error;
        }
    }

    async upload(file, path, contentType) {
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

    async delete(pathOrUrl) {
        let key = pathOrUrl;

        // If it starts with /api/photos/, extract the part after it
        if (pathOrUrl.startsWith('/api/photos/')) {
            key = pathOrUrl.replace('/api/photos/', '');
        } else if (pathOrUrl.startsWith('http')) {
            try {
                const urlObj = new URL(pathOrUrl);
                key = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
                if (key.startsWith('api/photos/')) {
                    key = key.replace('api/photos/', '');
                }
            } catch (e) {
                // use as is
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

export default R2StorageProvider;
