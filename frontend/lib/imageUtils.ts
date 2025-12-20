/**
 * Image Utilities
 * Centralized image processing functions for compression and manipulation.
 */

import { IMAGE_MAX_WIDTH, IMAGE_QUALITY } from './constants';

/**
 * Compress a base64 data URL image to a smaller size.
 * Used for generating face embeddings (not for storage).
 */
export function compressImage(dataUrl: string, maxWidth = IMAGE_MAX_WIDTH, quality = IMAGE_QUALITY): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            } catch (error) {
                reject(error);
            }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = dataUrl;
    });
}

/**
 * Compress a File object to a Blob.
 * Used for compressing files before sending for embedding generation.
 */
export function compressFile(file: File, maxWidth = IMAGE_MAX_WIDTH, quality = IMAGE_QUALITY): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const dataUrl = e.target?.result as string;
                const compressedDataUrl = await compressImage(dataUrl, maxWidth, quality);

                // Convert data URL to Blob
                const res = await fetch(compressedDataUrl);
                const blob = await res.blob();
                resolve(blob);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Convert a base64 data URL to a Blob
 */
export function dataUrlToBlob(dataUrl: string): Promise<Blob> {
    return fetch(dataUrl).then(res => res.blob());
}

/**
 * Captures a frame from a video element and returns it as a Blob.
 */
export function captureVideoFrame(video: HTMLVideoElement, quality = IMAGE_QUALITY): Promise<Blob | null> {
    return new Promise((resolve) => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d', { alpha: false });
            if (!ctx) {
                resolve(null);
                return;
            }
            ctx.drawImage(video, 0, 0);
            canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
        } catch (err) {
            console.error("Capture failed", err);
            resolve(null);
        }
    });
}
/**
 * Convert a Blob to a base64 string
 */
export function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Checks if a filename or path is HEIC/HEIF.
 */
export function isHeic(path: string | undefined | null): boolean {
    if (!path) return false;
    const lower = path.toLowerCase();
    return lower.endsWith('.heic') || lower.endsWith('.heif');
}
