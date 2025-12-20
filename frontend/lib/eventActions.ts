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

export async function uploadPhotos(eventId: string, files: File[] | Blob[]) {
    const formData = new FormData();
    files.forEach((file, index) => {
        const name = (file as File).name || `photo_${Date.now()}_${index}.jpg`;
        formData.append('photos', file, name);
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
