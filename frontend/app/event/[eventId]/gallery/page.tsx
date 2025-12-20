'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './gallery.module.css';
import PaperBackground from '@/components/PaperBackground';
import PhotoModal from '@/components/shared/PhotoModal';
import { useUser } from '@/lib/UserContext';
import { useParams } from 'next/navigation';
import { getPhotoUrl } from '@/hooks/usePhotoUrl';
import { downloadPhotos } from '@/lib/downloadUtils';
import { canDeletePhoto, deletePhotos } from '@/lib/photoActions';
import { useSelection } from '@/hooks/useSelection';
import { fetchEvent, fetchEventPhotos } from '@/lib/eventActions';
import { PageHeader } from '@/components/shared/PageHeader';
import { GalleryGrid } from './components/GalleryGrid';
import { BulkActionsBar } from '@/components/shared/BulkActionsBar';

interface PhotoDetail {
    id: string;
    link: string;
    uploaderId: string | null;
    createdAt: string;
}

export default function GalleryPage() {
    const { eventId } = useParams() as { eventId: string };
    const { user } = useUser();

    const [photoDetails, setPhotoDetails] = useState<PhotoDetail[]>([]);
    const [eventName, setEventName] = useState('Event');
    const [eventCreatorId, setEventCreatorId] = useState<string | null>(null);
    const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState<PhotoDetail | null>(null);

    const {
        isSelectMode, setIsSelectMode, selectedIds, resetSelection,
        handlePointerDown, handlePointerEnter
    } = useSelection();

    const fetchData = useCallback(async () => {
        try {
            const [eData, pData] = await Promise.all([fetchEvent(eventId), fetchEventPhotos(eventId)]);
            setEventName(eData.event.name);
            setCoverPhotoUrl(eData.event.coverPageUrl || null);
            setPhotoDetails(pData.photoDetails || []);
            setEventCreatorId(pData.eventCreatorId || null);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => { if (eventId) fetchData(); }, [eventId, fetchData]);

    const handleBulkDelete = async () => {
        if (!selectedIds.size || !confirm(`Delete ${selectedIds.size} photos?`)) return;
        try {
            await deletePhotos(eventId, Array.from(selectedIds));
            setPhotoDetails(prev => prev.filter(p => !selectedIds.has(p.id)));
            resetSelection();
            setIsSelectMode(false);
        } catch {
            alert('Failed to delete some photos.');
        }
    };

    const handleSingleDelete = async (photoId: string) => {
        await deletePhotos(eventId, [photoId]);
        setPhotoDetails(prev => prev.filter(p => p.id !== photoId));
    };

    const checkCanDelete = useCallback((photo: PhotoDetail) => canDeletePhoto(
        photo, user?.id, eventCreatorId
    ), [eventCreatorId, user]);

    const canDeleteSelected = useMemo(() => {
        return Array.from(photoDetails)
            .filter(p => selectedIds.has(p.id))
            .every(checkCanDelete);
    }, [photoDetails, selectedIds, checkCanDelete]);

    const handleBulkDownload = async () => {
        const urls = photoDetails.filter(p => selectedIds.has(p.id)).map(p => getPhotoUrl(p.link));
        const filename = `${eventName.replace(/\s+/g, '-').toLowerCase()}-knot-photos.zip`;
        await downloadPhotos(urls, filename);
    };

    const headerActions = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!loading && photoDetails.length > 0 && (
                <button
                    className={`${styles.selectBtn} ${isSelectMode ? styles.active : ''}`}
                    onClick={() => { setIsSelectMode(!isSelectMode); if (isSelectMode) resetSelection(); }}
                >
                    {isSelectMode ? 'Cancel' : 'Select'}
                </button>
            )}
            {!loading && photoDetails.length > 0 && !isSelectMode && (
                <span className={styles.countBadge}>{photoDetails.length}</span>
            )}
        </div>
    );

    return (
        <PaperBackground coverPhotoUrl={coverPhotoUrl}>
            <div className={styles.container}>
                <PageHeader
                    title={isSelectMode ? 'Select Photos' : `${eventName} – Gallery`}
                    backHref={`/event/${eventId}`}
                    actions={headerActions}
                    className={styles.header}
                />

                <GalleryGrid
                    loading={loading}
                    photos={photoDetails}
                    selectedIds={selectedIds}
                    isSelectMode={isSelectMode}
                    eventId={eventId}
                    onPhotoClick={setSelectedPhoto}
                    onPointerDown={handlePointerDown}
                    onPointerEnter={handlePointerEnter}
                />

                {isSelectMode && (
                    <BulkActionsBar
                        count={selectedIds.size}
                        canDelete={canDeleteSelected}
                        onDownload={handleBulkDownload}
                        onDelete={handleBulkDelete}
                    />
                )}

                <PhotoModal
                    isOpen={!!selectedPhoto}
                    photo={selectedPhoto}
                    photos={photoDetails}
                    currentIndex={selectedPhoto ? photoDetails.findIndex(p => p.id === selectedPhoto.id) : 0}
                    onClose={() => setSelectedPhoto(null)}
                    onNavigate={(index) => setSelectedPhoto(photoDetails[index])}
                    onDelete={handleSingleDelete}
                    canDelete={selectedPhoto ? checkCanDelete(selectedPhoto) : false}
                />
            </div>
        </PaperBackground>
    );
}
