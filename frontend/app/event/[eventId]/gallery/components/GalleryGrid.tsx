import React from 'react';
import Link from 'next/link';
import styles from '../gallery.module.css';
import { Spinner } from '@/components/ui';
import { getPhotoUrl } from '@/hooks/usePhotoUrl';

interface PhotoDetail {
    id: string;
    link: string;
    uploaderId: string | null;
    createdAt: string;
}

interface GalleryGridProps {
    loading: boolean;
    photos: PhotoDetail[];
    selectedIds: Set<string>;
    isSelectMode: boolean;
    eventId: string;
    onPhotoClick: (photo: PhotoDetail) => void;
    onPointerDown: (id: string, selected: boolean) => void;
    onPointerEnter: (id: string) => void;
}

export const GalleryGrid = ({
    loading,
    photos,
    selectedIds,
    isSelectMode,
    eventId,
    onPhotoClick,
    onPointerDown,
    onPointerEnter
}: GalleryGridProps) => {
    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Spinner size="lg" color="accent" />
                <p className={styles.message}>Loading photos...</p>
            </div>
        );
    }

    if (photos.length === 0) {
        return (
            <div className={styles.emptyState}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                    photo_library
                </span>
                <p className={styles.message}>No photos in this event yet.</p>
                <Link href={`/event/${eventId}/contribute`} className={styles.emptyLink}>
                    Be the first to contribute
                </Link>
            </div>
        );
    }

    return (
        <div className={styles.grid}>
            {photos.map((photo) => {
                const isSelected = selectedIds.has(photo.id);
                return (
                    <div
                        key={photo.id}
                        className={`${styles.imageCard} ${isSelected ? styles.selected : ''} ${isSelectMode ? styles.selecting : ''}`}
                        onClick={() => !isSelectMode && onPhotoClick(photo)}
                        onPointerDown={() => isSelectMode && onPointerDown(photo.id, isSelected)}
                        onPointerEnter={() => onPointerEnter(photo.id)}
                    >
                        {isSelectMode && <div className={styles.selectionOverlay} />}
                        <img src={getPhotoUrl(photo.link)} alt="Gallery item" className={styles.image} loading="lazy" />
                    </div>
                );
            })}
        </div>
    );
};
