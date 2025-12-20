/**
 * Centralized Photo Actions
 * Contains logic for managing photos across different pages (Gallery, Find My Photos).
 */

export interface PhotoPermissions {
    id: string;
    uploaderId?: string | null;
    eventCreatorId?: string | null;
}

/**
 * Checks if a user has permission to delete a specific photo.
 * User can delete if they are the event creator OR the photo uploader.
 * Handles case-insensitive comparison.
 */
export function canDeletePhoto(
    photo: { uploaderId?: string | null; eventCreatorId?: string | null },
    userId: string | undefined,
    contextEventCreatorId?: string | null
): boolean {
    if (!userId) return false;

    const currentUserId = userId.toLowerCase();

    // 1. Check if user is the Event Creator (checks both photo-specific and context-wide IDs)
    const effectiveEventCreatorId = photo.eventCreatorId || contextEventCreatorId;
    if (effectiveEventCreatorId && effectiveEventCreatorId.toLowerCase() === currentUserId) {
        return true;
    }

    // 2. Check if user is the Uploader
    if (photo.uploaderId && photo.uploaderId.toLowerCase() === currentUserId) {
        return true;
    }

    return false;
}

/**
 * Core delete function to remove photos from an event.
 */
export async function deletePhotos(eventId: string, photoIds: string[]): Promise<void> {
    if (!photoIds.length) return;

    const res = await fetch(`/api/events/${eventId}/photos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoIds }),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete photos');
    }
}
