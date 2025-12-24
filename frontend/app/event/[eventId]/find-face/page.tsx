'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './find-face.module.css';
import PaperBackground from '@/components/PaperBackground';
import PhotoModal from '@/components/shared/PhotoModal';
import { PageTransition } from '@/components/shared/PageTransition';
import { useParams } from 'next/navigation';
import { Spinner } from '@/components/ui';
import { useUser } from '@/lib/UserContext';
import { getPhotoUrl } from '@/hooks/usePhotoUrl';
import { downloadPhotos } from '@/lib/downloadUtils';
import { canDeletePhoto, deletePhotos } from '@/lib/photoActions';
import { useCamera } from '@/hooks/useCamera';
import { useSelection } from '@/hooks/useSelection';
import { fetchEvent } from '@/lib/eventActions';
import { PageHeader } from '@/components/shared/PageHeader';
import { captureVideoFrame, blobToBase64 } from '@/lib/imageUtils';
import { MatchTier } from './components/MatchTier';
import { BulkActionsBar } from '@/components/shared/BulkActionsBar';
import { IconClose } from '@/components/shared/Icons';
import { FaceIntro } from './components/FaceIntro';

interface StatusModalProps {
    type: 'error' | 'no-matches' | 'searching';
    onClose: () => void;
    onRetry?: () => void;
}

const StatusModal = ({ type, onClose, onRetry }: StatusModalProps) => (
    <div className={styles.modalOverlay} onClick={onClose}>
        <div className={`${styles.modalContent} paper-texture`} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={onClose}><IconClose /></button>
            {type === 'searching' && (
                <div className={styles.modalBody}>
                    <Spinner size="lg" color="accent" />
                    <h2>Finding your photos</h2>
                    <p>We're scanning the event for matches...</p>
                </div>
            )}
            {type === 'no-matches' && (
                <div className={styles.modalBody}>
                    <span className={`material-symbols-outlined ${styles.modalIcon}`}>person_off</span>
                    <h2>No matches found</h2>
                    <p>We couldn't find any photos of you in this event yet. Photos might still be uploading!</p>
                    <button className={styles.modalBtn} onClick={onRetry || onClose}>Try Another Photo</button>
                </div>
            )}
            {type === 'error' && (
                <div className={styles.modalBody}>
                    <span className={`material-symbols-outlined ${styles.modalIcon} ${styles.error}`}>error</span>
                    <h2>Search failed</h2>
                    <p>Ensure your face is clearly visible and try again.</p>
                    <button className={styles.modalBtn} onClick={onRetry || onClose}>Try Again</button>
                </div>
            )}
        </div>
    </div>
);

interface Match {
    id: string;
    link: string;
    distance: number;
    uploaderId?: string | null;
    eventCreatorId?: string | null;
}

interface TieredMatches {
    excellent: Match[];
    good: Match[];
    possible: Match[];
}

const EXCELLENT_THRESHOLD = 0.38;
const GOOD_THRESHOLD = 0.44;
const POSSIBLE_THRESHOLD = 0.48;

export default function FindFacePage() {
    const { eventId } = useParams() as { eventId: string };
    const { user } = useUser();
    const [mode, setMode] = useState<'intro' | 'camera' | 'results'>('intro');
    const [eventName, setEventName] = useState('Event');
    const [eventCreatorId, setEventCreatorId] = useState<string | null>(null);
    const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
    const [tieredMatches, setTieredMatches] = useState<TieredMatches>({ excellent: [], good: [], possible: [] });
    const [allPhotos, setAllPhotos] = useState<Match[]>([]);
    const [isScrolled, setIsScrolled] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<Match | null>(null);
    const [searchStatus, setSearchStatus] = useState<'none' | 'searching' | 'no-matches' | 'error'>('none');

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const { videoRef, startCamera, stopCamera } = useCamera('user');
    const {
        isSelectMode, setIsSelectMode, selectedIds, setSelectedIds, resetSelection,
        handlePointerDown, handlePointerEnter
    } = useSelection();

    useEffect(() => {
        if (eventId) {
            // Fetch both event details and photos to be sure about creator ID
            fetchEvent(eventId).then(data => {
                setEventName(data.event.name);
                setCoverPhotoUrl(data.event.coverPageUrl || null);
                const creatorId = data.event.userId || data.event.user_id;
                if (creatorId) setEventCreatorId(creatorId.toLowerCase());
            }).catch(console.error);
        }
    }, [eventId]);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const performSearch = async (imageSource: string | Blob) => {
        setSearchStatus('searching');
        setMode('results');
        resetSelection();
        setIsSelectMode(false);
        try {
            let blob: Blob;
            if (typeof imageSource === 'string') {
                const res = await fetch(imageSource);
                blob = await res.blob();
            } else {
                blob = imageSource;
            }

            const base64Image = await blobToBase64(blob);

            const res = await fetch(`/api/faces/match`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: base64Image,
                    eventId: eventId
                })
            });

            if (!res.ok) {
                setSearchStatus('error');
                return;
            }
            const data = await res.json();
            const matches: Match[] = data.matches || [];

            // Fix: Filter allPhotos to only include what's in the tiers
            const filteredMatches = matches.filter(m => m.distance < POSSIBLE_THRESHOLD);
            setAllPhotos(filteredMatches);

            if (filteredMatches.length === 0) {
                setSearchStatus('no-matches');
            } else {
                setSearchStatus('none');
                // Update eventCreatorId if missing from state but present in matches
                if (!eventCreatorId && filteredMatches[0].eventCreatorId) {
                    setEventCreatorId(filteredMatches[0].eventCreatorId);
                }
            }

            setTieredMatches({
                excellent: filteredMatches.filter(m => m.distance < EXCELLENT_THRESHOLD),
                good: filteredMatches.filter(m => m.distance >= EXCELLENT_THRESHOLD && m.distance < GOOD_THRESHOLD),
                possible: filteredMatches.filter(m => m.distance >= GOOD_THRESHOLD && m.distance < POSSIBLE_THRESHOLD),
            });
        } catch (err) {
            console.error(err);
            setSearchStatus('error');
        }
    };

    const capturePhoto = async () => {
        if (!videoRef.current) return;
        const blob = await captureVideoFrame(videoRef.current);
        if (blob) performSearch(blob);
        stopCamera();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) performSearch(file);
    };


    const handleBulkDownload = async () => {
        const urls = allPhotos.filter(p => selectedIds.has(p.id)).map(p => getPhotoUrl(p.link));
        await downloadPhotos(urls, `${eventName.replace(/\s+/g, '-').toLowerCase()}-matches.zip`);
    };

    const handleBulkDelete = async () => {
        if (!selectedIds.size || !confirm(`Delete ${selectedIds.size} photos?`)) return;
        try {
            await deletePhotos(eventId, Array.from(selectedIds));
            const remaining = allPhotos.filter(p => !selectedIds.has(p.id));
            setAllPhotos(remaining);
            setTieredMatches({
                excellent: remaining.filter(m => m.distance < EXCELLENT_THRESHOLD),
                good: remaining.filter(m => m.distance >= EXCELLENT_THRESHOLD && m.distance < GOOD_THRESHOLD),
                possible: remaining.filter(m => m.distance >= GOOD_THRESHOLD && m.distance < POSSIBLE_THRESHOLD),
            });
            resetSelection();
            setIsSelectMode(false);
        } catch {
            alert('Failed to delete photos');
        }
    };

    const checkCanDelete = useCallback((photo: Match) => {
        return canDeletePhoto(photo, user?.id, eventCreatorId);
    }, [eventCreatorId, user]);

    const canDeleteSelected = useMemo(() => {
        if (!user?.id || selectedIds.size === 0) return false;

        const selectedPhotos = allPhotos.filter(p => selectedIds.has(p.id));
        if (selectedPhotos.length === 0) return false;

        return selectedPhotos.every(checkCanDelete);
    }, [allPhotos, selectedIds, checkCanDelete, user?.id]);

    const handleToggleAll = useCallback((ids: string[], select: boolean) => {
        setSelectedIds((prev: Set<string>) => {
            const next = new Set(prev);
            ids.forEach(id => {
                if (select) next.add(id);
                else next.delete(id);
            });
            return next;
        });
    }, [setSelectedIds]);

    const headerActions = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {mode === 'results' && searchStatus === 'none' && allPhotos.length > 0 && (
                <button
                    className={`${styles.selectBtn} ${isSelectMode ? styles.active : ''}`}
                    onClick={() => { setIsSelectMode(!isSelectMode); if (isSelectMode) resetSelection(); }}
                >
                    {isSelectMode ? 'Cancel' : 'Select'}
                </button>
            )}
        </div>
    );

    return (
        <>
            <PaperBackground coverPhotoUrl={coverPhotoUrl}>
                <PageTransition>
                    <div className={styles.container}>
                        <PageHeader
                            title={isSelectMode ? 'Select Photos' : (mode === 'results' ? 'My Photos' : 'Find My Photos')}
                            backHref={mode === 'intro' ? `/event/${eventId}` : undefined}
                            onBack={mode !== 'intro' ? () => { stopCamera(); setMode('intro'); setAllPhotos([]); setSearchStatus('none'); resetSelection(); setIsSelectMode(false); } : undefined}
                            actions={headerActions}
                            scrolled={isScrolled}
                            className={styles.header}
                        />

                        <main className={styles.content}>
                            {mode === 'results' && allPhotos.length > 0 && (
                                <div className={styles.resultsContext}>
                                    <p>We found <strong>{allPhotos.length}</strong> photo{allPhotos.length === 1 ? '' : 's'} of you in {eventName}.</p>
                                    <div className={styles.resultsActions}>
                                        <button className={styles.newSearchBtn} onClick={() => { setMode('intro'); resetSelection(); setIsSelectMode(false); }}>
                                            <span className="material-symbols-outlined">refresh</span>
                                            Search Again
                                        </button>
                                    </div>
                                </div>
                            )}
                            {mode === 'intro' && (
                                <FaceIntro
                                    onUploadClick={() => fileInputRef.current?.click()}
                                    onCameraClick={() => { setMode('camera'); setTimeout(() => startCamera().catch(() => setMode('intro')), 100); }}
                                />
                            )}

                            {mode === 'camera' && (
                                <div className={styles.cameraContainer}>
                                    <video ref={videoRef} autoPlay playsInline muted className={styles.video} />
                                    <div className={styles.overlay}><button className={styles.captureBtn} onClick={capturePhoto} /></div>
                                </div>
                            )}

                            {mode === 'results' && allPhotos.length > 0 && (
                                <div className={styles.resultsContainer}>
                                    <MatchTier title="Excellent Matches" matches={tieredMatches.excellent} selectedIds={selectedIds} isSelectMode={isSelectMode} onPhotoClick={setSelectedPhoto} onPointerDown={handlePointerDown} onPointerEnter={handlePointerEnter} onToggleAll={handleToggleAll} />
                                    <MatchTier title="Good Matches" matches={tieredMatches.good} selectedIds={selectedIds} isSelectMode={isSelectMode} onPhotoClick={setSelectedPhoto} onPointerDown={handlePointerDown} onPointerEnter={handlePointerEnter} onToggleAll={handleToggleAll} />
                                    <MatchTier title="Possible Matches" matches={tieredMatches.possible} selectedIds={selectedIds} isSelectMode={isSelectMode} onPhotoClick={setSelectedPhoto} onPointerDown={handlePointerDown} onPointerEnter={handlePointerEnter} onToggleAll={handleToggleAll} />
                                </div>
                            )}
                        </main>

                        <input type="file" ref={fileInputRef} className={styles.hiddenInput} onChange={handleFileUpload} accept="image/*" />
                    </div>
                </PageTransition>
            </PaperBackground>

            {searchStatus !== 'none' && (
                <StatusModal
                    type={searchStatus as any}
                    onClose={() => {
                        setSearchStatus('none');
                        if (searchStatus !== 'searching' && allPhotos.length === 0) {
                            setMode('intro');
                            resetSelection();
                            setIsSelectMode(false);
                        }
                    }}
                    onRetry={() => {
                        setSearchStatus('none');
                        setMode('intro');
                        resetSelection();
                        setIsSelectMode(false);
                        setTimeout(() => fileInputRef.current?.click(), 100);
                    }}
                />
            )}

            {isSelectMode && (
                <BulkActionsBar
                    count={selectedIds.size}
                    canDelete={canDeleteSelected}
                    onDownload={handleBulkDownload}
                    onDelete={handleBulkDelete}
                />
            )}

            <PhotoModal
                isOpen={!!selectedPhoto} photo={selectedPhoto} photos={allPhotos}
                currentIndex={selectedPhoto ? allPhotos.findIndex(p => p.id === selectedPhoto.id) : 0}
                onClose={() => setSelectedPhoto(null)} onNavigate={(index) => setSelectedPhoto(allPhotos[index])}
                onDelete={async (id) => {
                    await deletePhotos(eventId, [id]);
                    const remaining = allPhotos.filter(p => p.id !== id); // Fix: p.id !== id instead of !selectedIds.has(p.id) for single delete
                    setAllPhotos(remaining);
                    setTieredMatches({
                        excellent: remaining.filter(m => m.distance < EXCELLENT_THRESHOLD),
                        good: remaining.filter(m => m.distance >= EXCELLENT_THRESHOLD && m.distance < GOOD_THRESHOLD),
                        possible: remaining.filter(m => m.distance >= GOOD_THRESHOLD && m.distance < POSSIBLE_THRESHOLD),
                    });
                }}
                canDelete={selectedPhoto ? checkCanDelete(selectedPhoto) : false}
            />
        </>
    );
}
