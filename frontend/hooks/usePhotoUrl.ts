import { isHeic } from '@/lib/imageUtils';

export function usePhotoUrl(link: string | undefined) {
    if (!link) return '';

    // If it's a HEIC/HEIF, route it through our proxy
    if (isHeic(link)) {
        return `/api/photos?link=${encodeURIComponent(link)}`;
    }

    // Otherwise, serve normally from public
    return link;
}

export function getPhotoUrl(link: string | undefined) {
    if (!link) return '';
    return link;
}
