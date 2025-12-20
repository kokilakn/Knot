import heicConvert from 'heic-convert';

/**
 * Converts HEIC/HEIF buffer to JPEG buffer.
 * @param {Buffer | ArrayBuffer} buffer - The input HEIC/HEIF buffer.
 * @param {number} quality - The quality of the output JPEG (0 to 1).
 * @returns {Promise<Buffer>} - The output JPEG buffer.
 */
export async function convertHeicToJpeg(buffer: Buffer | ArrayBuffer, quality = 1): Promise<Buffer> {
    try {
        const outputBuffer = await heicConvert({
            buffer: buffer,
            format: 'JPEG',
            quality: quality
        });
        return outputBuffer;
    } catch (error: any) {
        console.error('HEIC conversion failed:', error);
        throw new Error(`Failed to convert HEIC image: ${error.message}`);
    }
}

/**
 * Checks if a filename or path is HEIC/HEIF.
 * @param {string} path - The filename or path.
 * @returns {boolean}
 */
export function isHeic(path: string | undefined | null): boolean {
    if (!path) return false;
    const lower = path.toLowerCase();
    return lower.endsWith('.heic') || lower.endsWith('.heif');
}
