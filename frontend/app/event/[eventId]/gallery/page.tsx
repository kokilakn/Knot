'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './gallery.module.css';
import { Spinner } from '@/components/ui';
import PaperBackground from '@/components/PaperBackground';
import PhotoModal from '@/components/shared/PhotoModal';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useUser } from '@/lib/UserContext';
import { getPhotoUrl } from '@/hooks/usePhotoUrl';
import { downloadPhotos } from '@/lib/downloadUtils';

interface PhotoDetail {
    id: string;
    link: string;
    uploaderId: string | null;
    createdAt: string;
}

export default function GalleryPage() {
    const params = useParams();
    const eventId = params.eventId as string;
    const { user } = useUser();
    const [photoDetails, setPhotoDetails] = useState<PhotoDetail[]>([]);
    const [eventName, setEventName] = useState('Event');
    const [eventCreatorId, setEventCreatorId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState<PhotoDetail | null>(null);

    // Multi-select state
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDragging, setIsDragging] = useState(false);
    const [dragType, setDragType] = useState<'select' | 'unselect'>('select');
    const dragProcessedRef = useRef<Set<string>>(new Set());

    const fetchData = useCallback(async () => {
        try {
            const eventRes = await fetch(`/api/events/${eventId}`);
            const eventData = await eventRes.json();
            if (eventRes.ok) {
                setEventName(eventData.event.name);
            }

            const photosRes = await fetch(`/api/events/${eventId}/photos`);
            const photosData = await photosRes.json();
            if (photosRes.ok) {
                setPhotoDetails(photosData.photoDetails || []);
                setEventCreatorId(photosData.eventCreatorId || null);
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        if (!eventId) return;
        fetchData();
    }, [eventId, fetchData]);

    const canDeletePhoto = (photo: PhotoDetail): boolean => {
        if (!user) return false;
        if (eventCreatorId === user.id) return true;
        if (photo.uploaderId === user.id) return true;
        return false;
    };

    const handleDeletePhoto = async (photoId: string) => {
        const res = await fetch(`/api/events/${eventId}/photos`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photoIds: [photoId] }),
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Delete failed');
        }
        setPhotoDetails(prev => prev.filter(p => p.id !== photoId));
    };

    const toggleSelect = (id: string, forceState?: boolean) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            const currentState = next.has(id);
            const newState = forceState !== undefined ? forceState : !currentState;

            if (newState) next.add(id);
            else next.delete(id);
            return next;
        });
    };

    const handlePointerDown = (id: string, currentlySelected: boolean) => {
        if (!isSelectMode) return;
        setIsDragging(true);
        const nextState = !currentlySelected;
        setDragType(nextState ? 'select' : 'unselect');
        dragProcessedRef.current = new Set([id]);
        toggleSelect(id, nextState);
    };

    const handlePointerEnter = (id: string) => {
        if (!isDragging || dragProcessedRef.current.has(id)) return;
        dragProcessedRef.current.add(id);
        toggleSelect(id, dragType === 'select');
    };

    useEffect(() => {
        const handleGlobalPointerUp = () => {
            setIsDragging(false);
            dragProcessedRef.current.clear();
        };
        window.addEventListener('pointerup', handleGlobalPointerUp);
        return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
    }, []);

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        const confirmMsg = `Are you sure you want to delete ${selectedIds.size} photos?`;
        if (!confirm(confirmMsg)) return;

        const idsArray = Array.from(selectedIds);
        try {
            const res = await fetch(`/api/events/${eventId}/photos`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photoIds: idsArray }),
            });

            if (!res.ok) throw new Error('Bulk delete failed');

            setPhotoDetails(prev => prev.filter(p => !selectedIds.has(p.id)));
            setSelectedIds(new Set());
            setIsSelectMode(false);
        } catch (error) {
            console.error(error);
            alert('Failed to delete some photos. You may not have permission for all of them.');
        }
    };

    const handleBulkDownload = async () => {
        if (selectedIds.size === 0) return;
        const selectedPhotos = photoDetails.filter(p => selectedIds.has(p.id));
        const photoUrls = selectedPhotos.map(p => getPhotoUrl(p.link));
        const filename = `${eventName.replace(/\s+/g, '-').toLowerCase()}-knot-photos.zip`;
        await downloadPhotos(photoUrls, filename);
    };

    return (
        <PaperBackground>
            <div className={styles.container}>
                <header className={styles.header}>
                    <Link href={`/event/${eventId}`} className={styles.iconBtn} aria-label="Back to Event">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <h1 className={styles.title}>
                        {isSelectMode ? 'Select Photos' : `${eventName} – Gallery`}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {!loading && photoDetails.length > 0 && (
                            <button
                                className={`${styles.selectBtn} ${isSelectMode ? styles.active : ''}`}
                                onClick={() => {
                                    setIsSelectMode(!isSelectMode);
                                    if (isSelectMode) setSelectedIds(new Set());
                                }}
                            >
                                {isSelectMode ? 'Cancel' : 'Select'}
                            </button>
                        )}
                        {!loading && photoDetails.length > 0 && !isSelectMode && (
                            <span className={styles.countBadge}>{photoDetails.length}</span>
                        )}
                    </div>
                </header>

                <div className={styles.grid}>
                    {loading && (
                        <div className={styles.loadingContainer}>
                            <Spinner size="lg" color="accent" />
                            <p className={styles.message}>Loading photos...</p>
                        </div>
                    )}
                    {!loading && photoDetails.length === 0 && <p className={styles.message}>No photos yet.</p>}
                    {photoDetails.map((photo) => {
                        const isSelected = selectedIds.has(photo.id);
                        return (
                            <div
                                key={photo.id}
                                className={`${styles.imageCard} ${isSelected ? styles.selected : ''} ${isSelectMode ? styles.selecting : ''}`}
                                onClick={() => {
                                    if (!isSelectMode) {
                                        setSelectedPhoto(photo);
                                    }
                                }}
                                onPointerDown={() => {
                                    if (isSelectMode) {
                                        handlePointerDown(photo.id, isSelected);
                                    }
                                }}
                                onPointerEnter={() => handlePointerEnter(photo.id)}
                            >
                                {isSelectMode && <div className={styles.selectionOverlay} />}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={getPhotoUrl(photo.link)} alt="Gallery item" className={styles.image} loading="lazy" />
                            </div>
                        );
                    })}
                </div>

                {isSelectMode && selectedIds.size > 0 && (
                    <div className={styles.bulkActionsBar}>
                        <span className={styles.selectionInfo}>{selectedIds.size} selected</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className={`${styles.bulkBtn} ${styles.bulkBtnDownload}`} onClick={handleBulkDownload}>
                                <span className="material-symbols-outlined">download</span>
                                <span>Download</span>
                            </button>
                            <button className={`${styles.bulkBtn} ${styles.bulkBtnDelete}`} onClick={handleBulkDelete}>
                                <span className="material-symbols-outlined">delete</span>
                                <span>Delete</span>
                            </button>
                        </div>
                    </div>
                )}

                <PhotoModal
                    isOpen={!!selectedPhoto}
                    photo={selectedPhoto}
                    photos={photoDetails}
                    currentIndex={selectedPhoto ? photoDetails.findIndex(p => p.id === selectedPhoto.id) : 0}
                    onClose={() => setSelectedPhoto(null)}
                    onNavigate={(index) => setSelectedPhoto(photoDetails[index])}
                    onDelete={handleDeletePhoto}
                    canDelete={selectedPhoto ? canDeletePhoto(selectedPhoto) : false}
                />
            </div>
        </PaperBackground>
    );
}

