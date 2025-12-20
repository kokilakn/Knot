export function usePhotoUrl(link: string | undefined) {
    if (!link) return '';
    const lower = link.toLowerCase();

    // If it's a HEIC/HEIF, route it through our proxy
    if (lower.endsWith('.heic') || lower.endsWith('.heif')) {
        return `/api/photos?link=${encodeURIComponent(link)}`;
    }

    // Otherwise, serve normally from public
    return link;
}

export function getPhotoUrl(link: string | undefined) {
    if (!link) return '';
    const lower = link.toLowerCase();

    if (lower.endsWith('.heic') || lower.endsWith('.heif')) {
        return `/api/photos?link=${encodeURIComponent(link)}`;
    }

    return link;
}
