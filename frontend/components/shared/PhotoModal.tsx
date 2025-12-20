'use client';

import React, { useEffect, useState, useCallback } from 'react';
import styles from './PhotoModal.module.css';
import { Spinner } from '@/components/ui';
import { getPhotoUrl } from '@/hooks/usePhotoUrl';
import { downloadPhotos } from '@/lib/downloadUtils';
import { useGestures } from '@/hooks/useGestures';
import { IconClose, IconDownload, IconDelete, IconChevron } from './Icons';

export interface PhotoDetail {
    id: string;
    link: string;
    uploaderId?: string | null;
    createdAt?: string;
}

interface PhotoModalProps {
    isOpen: boolean;
    photo: PhotoDetail | null;
    photos?: PhotoDetail[];
    currentIndex?: number;
    onClose: () => void;
    onNavigate?: (index: number) => void;
    onDelete?: (photoId: string) => Promise<void>;
    canDelete?: boolean;
}

export default function PhotoModal({
    isOpen,
    photo,
    photos = [],
    currentIndex = 0,
    onClose,
    onNavigate,
    onDelete,
    canDelete = false
}: PhotoModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const canNavigate = photos.length > 1 && !!onNavigate;
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < photos.length - 1;

    const handlePrev = useCallback(() => {
        if (hasPrev && onNavigate) onNavigate(currentIndex - 1);
    }, [hasPrev, currentIndex, onNavigate]);

    const handleNext = useCallback(() => {
        if (hasNext && onNavigate) onNavigate(currentIndex + 1);
    }, [hasNext, currentIndex, onNavigate]);

    const gestures = useGestures({
        onSwipeLeft: handleNext,
        onSwipeRight: handlePrev
    });

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'ArrowRight') handleNext();
        };
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose, handlePrev, handleNext]);

    if (!isOpen || !photo) return null;

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            await downloadPhotos([getPhotoUrl(photo.link)]);
        } catch {
            alert('Failed to download photo');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDelete = async () => {
        if (!onDelete || !canDelete || !confirm('Delete this photo?')) return;
        setIsDeleting(true);
        try {
            await onDelete(photo.id);
            onClose();
        } catch {
            alert('Failed to delete photo');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                    <IconClose />
                </button>

                {canNavigate && (
                    <>
                        {hasPrev && (
                            <button className={`${styles.navBtn} ${styles.navPrev}`} onClick={handlePrev} aria-label="Previous">
                                <IconChevron direction="left" />
                            </button>
                        )}
                        {hasNext && (
                            <button className={`${styles.navBtn} ${styles.navNext}`} onClick={handleNext} aria-label="Next">
                                <IconChevron direction="right" />
                            </button>
                        )}
                    </>
                )}

                <div className={styles.imageContainer} {...gestures}>
                    <img src={getPhotoUrl(photo.link)} alt="Full view" className={styles.image} />
                </div>

                {canNavigate && <div className={styles.counter}>{currentIndex + 1} / {photos.length}</div>}

                <div className={styles.actions}>
                    <button className={styles.actionBtn} onClick={handleDownload} disabled={isDownloading}>
                        {isDownloading ? <Spinner size="sm" color="paper" /> : <IconDownload />}
                        <span>Download</span>
                    </button>

                    {canDelete && onDelete && (
                        <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? <Spinner size="sm" color="paper" /> : <IconDelete />}
                            <span>Delete</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
