'use client';

import React, { useEffect, useState, useCallback } from 'react';
import styles from './PhotoModal.module.css';
import { Spinner } from '@/components/ui';
import { getPhotoUrl } from '@/hooks/usePhotoUrl';
import { downloadPhotos } from '@/lib/downloadUtils';

export interface PhotoDetail {
    id: string;
    link: string;
    uploaderId?: string | null;
    createdAt?: string;
}

interface PhotoModalProps {
    isOpen: boolean;
    photo: PhotoDetail | null;
    photos?: PhotoDetail[]; // Full list for navigation
    currentIndex?: number;
    onClose: () => void;
    onNavigate?: (index: number) => void; // Callback when navigating
    onDelete?: (photoId: string) => Promise<void>;
    canDelete?: boolean;
}

function IconClose() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconDownload() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconDelete() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconChevron({ direction }: { direction: 'left' | 'right' }) {
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d={direction === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
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
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const canNavigate = photos.length > 1 && onNavigate;
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < photos.length - 1;

    const handlePrev = useCallback(() => {
        if (hasPrev && onNavigate) {
            onNavigate(currentIndex - 1);
        }
    }, [hasPrev, currentIndex, onNavigate]);

    const handleNext = useCallback(() => {
        if (hasNext && onNavigate) {
            onNavigate(currentIndex + 1);
        }
    }, [hasNext, currentIndex, onNavigate]);

    // Touch gesture handlers for swipe navigation
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && hasNext) {
            handleNext();
        } else if (isRightSwipe && hasPrev) {
            handlePrev();
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft' && hasPrev) handlePrev();
            if (e.key === 'ArrowRight' && hasNext) handleNext();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose, hasPrev, hasNext, handlePrev, handleNext]);

    if (!isOpen || !photo) return null;

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            await downloadPhotos([getPhotoUrl(photo.link)]);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download photo');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDelete = async () => {
        if (!onDelete || !canDelete) return;
        if (!confirm('Are you sure you want to delete this photo?')) return;

        setIsDeleting(true);
        try {
            await onDelete(photo.id);
            onClose();
        } catch (error) {
            console.error('Delete failed:', error);
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

                {/* Navigation buttons */}
                {canNavigate && hasPrev && (
                    <button className={`${styles.navBtn} ${styles.navPrev}`} onClick={handlePrev} aria-label="Previous">
                        <IconChevron direction="left" />
                    </button>
                )}
                {canNavigate && hasNext && (
                    <button className={`${styles.navBtn} ${styles.navNext}`} onClick={handleNext} aria-label="Next">
                        <IconChevron direction="right" />
                    </button>
                )}

                <div
                    className={styles.imageContainer}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getPhotoUrl(photo.link)} alt="Photo" className={styles.image} />
                </div>

                {/* Photo counter */}
                {canNavigate && (
                    <div className={styles.counter}>
                        {currentIndex + 1} / {photos.length}
                    </div>
                )}

                <div className={styles.actions}>
                    <button
                        className={styles.actionBtn}
                        onClick={handleDownload}
                        disabled={isDownloading}
                    >
                        {isDownloading ? <Spinner size="sm" color="paper" /> : <IconDownload />}
                        <span>Download</span>
                    </button>

                    {canDelete && onDelete && (
                        <button
                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Spinner size="sm" color="paper" /> : <IconDelete />}
                            <span>Delete</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

