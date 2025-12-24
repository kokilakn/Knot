import sharp from 'sharp';

/**
 * Optimizes an image for storage by resizing and applying lossy compression.
 * @param buffer The original image buffer
 * @param format The desired format (default: jpeg)
 * @returns Optimized buffer
 */
export async function optimizeImage(
    buffer: Buffer,
    format: 'jpeg' | 'webp' = 'jpeg'
): Promise<Buffer> {
    try {
        let pipeline = sharp(buffer)
            .rotate() // Auto-rotate based on EXIF
            .resize({
                width: 2048,
                height: 2048,
                fit: 'inside',
                withoutEnlargement: true
            });

        if (format === 'webp') {
            pipeline = pipeline.webp({ quality: 80 });
        } else {
            pipeline = pipeline.jpeg({ quality: 80, progressive: true });
        }

        return await pipeline.toBuffer();
    } catch (error) {
        console.error('Image optimization failed:', error);
        // Fallback to original buffer if optimization fails
        return buffer;
    }
}
