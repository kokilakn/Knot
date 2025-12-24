/**
 * Event-related API actions
 */

export async function fetchEvent(eventId: string) {
    const res = await fetch(`/api/events/${eventId}`);
    if (!res.ok) throw new Error('Failed to fetch event');
    return res.json();
}

export async function fetchEventPhotos(eventId: string) {
    const res = await fetch(`/api/events/${eventId}/photos`);
    if (!res.ok) throw new Error('Failed to fetch photos');
    return res.json();
}

import { optimizeForUpload } from './imageUtils';

export async function uploadPhotos(eventId: string, files: File[] | Blob[]) {
    const formData = new FormData();

    // Optimize each file in the browser before appending to FormData
    const optimizedFiles = await Promise.all(
        files.map(file => optimizeForUpload(file))
    );

    optimizedFiles.forEach((blob, index) => {
        const originalFile = files[index] as File;
        let name = originalFile.name || `photo_${Date.now()}_${index}.jpg`;

        // Ensure extension is .jpg as optimizeForUpload returns JPEG
        if (name.toLowerCase().endsWith('.heic') || name.toLowerCase().endsWith('.heif') || name.toLowerCase().endsWith('.png')) {
            name = name.substring(0, name.lastIndexOf('.')) + '.jpg';
        } else if (!name.toLowerCase().endsWith('.jpg') && !name.toLowerCase().endsWith('.jpeg')) {
            name = name + '.jpg';
        }

        formData.append('photos', blob, name);
    });

    const res = await fetch(`/api/events/${eventId}/photos`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
    }
    return res.json();
}
