'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './find-face.module.css';
import PaperBackground from '@/components/PaperBackground';
import Link from 'next/link';
import { Button, Spinner } from '@/components/ui';
import { useParams } from 'next/navigation';
import { compressImage } from '@/lib/imageUtils';
import { MATCH_TIERS } from '@/lib/constants';
import PhotoModal, { PhotoDetail } from '@/components/shared/PhotoModal';
import { getPhotoUrl } from '@/hooks/usePhotoUrl';
import { downloadPhotos } from '@/lib/downloadUtils';
import { useUser } from '@/lib/UserContext';

interface Match {
    id: string;
    link: string;
    distance: number;
    uploaderId?: string;
    eventCreatorId?: string;
}

interface TieredMatches {
    best: Match[];
    good: Match[];
    other: Match[];
}

function categorizeMatches(matches: Match[]): TieredMatches {
    const best: Match[] = [];
    const good: Match[] = [];
    const other: Match[] = [];

    for (const match of matches) {
        if (match.distance <= MATCH_TIERS.BEST.maxDistance) {
            best.push(match);
        } else if (match.distance <= MATCH_TIERS.GOOD.maxDistance) {
            good.push(match);
        } else if (match.distance <= MATCH_TIERS.OTHER.maxDistance) {
            other.push(match);
        }
    }

    return { best, good, other };
}

export default function FindFacePage() {
    const params = useParams();
    const eventId = params.eventId as string;
    const [eventName, setEventName] = useState('Event');
    const [mode, setMode] = useState<'intro' | 'camera' | 'searching' | 'results'>('intro');
    const [tieredMatches, setTieredMatches] = useState<TieredMatches>({ best: [], good: [], other: [] });
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<PhotoDetail | null>(null);

    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [eventCreatorId, setEventCreatorId] = useState<string | null>(null);
    const { user } = useUser();
    const [isDragging, setIsDragging] = useState(false);
    const [dragType, setDragType] = useState<'select' | 'unselect'>('select');
    const dragProcessedRef = useRef<Set<string>>(new Set());

    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Check for multiple cameras
    useEffect(() => {
        async function checkCameras() {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(d => d.kind === 'videoinput');
                setHasMultipleCameras(videoDevices.length > 1);
            } catch {
                setHasMultipleCameras(false);
            }
        }
        checkCameras();
    }, []);

    useEffect(() => {
        if (eventId) {
            fetch(`/api/events/${eventId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.event) setEventName(data.event.name);
                })
                .catch(console.error);
        }
    }, [eventId]);

    const startCamera = useCallback(async (mode: 'user' | 'environment' = facingMode) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: mode }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera. Please allow permissions.");
            setMode('intro');
        }
    }, [facingMode]);

    const stopCamera = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    }, []);

    const handleCameraMode = () => {
        setMode('camera');
        setTimeout(() => startCamera(), 100);
    };

    const handleFlipCamera = async () => {
        stopCamera();
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newMode);
        await startCamera(newMode);
    };

    const handleBack = () => {
        if (mode === 'camera') {
            stopCamera();
            setMode('intro');
        } else if (mode === 'searching' || mode === 'results') {
            setMode('intro');
        }
    };

    const handleCapture = async () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0);
            const fullQuality = canvas.toDataURL('image/jpeg', 0.95);
            stopCamera();
            setMode('searching');
            const compressed = await compressImage(fullQuality);
            performSearch(compressed);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = async (event) => {
                const fullQuality = event.target?.result as string;
                setMode('searching');
                const compressed = await compressImage(fullQuality);
                performSearch(compressed);
            };
            reader.readAsDataURL(file);
        }
    };

    const performSearch = async (imageData: string) => {
        try {
            const res = await fetch('/api/faces/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData, eventId: eventId })
            });

            if (res.ok) {
                const data = await res.json();
                console.log(`[FindFace] Received ${data.matches?.length} matches from server`);
                const categorized = categorizeMatches(data.matches || []);
                setTieredMatches(categorized);
                if (data.matches && data.matches.length > 0) {
                    setEventCreatorId(data.matches[0].eventCreatorId || null);
                }
                setMode('results');
            } else {
                const err = await res.json();
                alert(err.error || "Search failed");
                setMode('intro');
            }
        } catch (error) {
            console.error("Search error:", error);
            alert("Could not connect to face recognition service.");
            setMode('intro');
        }
    };

    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

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

    const handleToggleTier = (matches: Match[]) => {
        const allSelected = matches.every(m => selectedIds.has(m.id));
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allSelected) {
                matches.forEach(m => next.delete(m.id));
            } else {
                matches.forEach(m => next.add(m.id));
            }
            return next;
        });
    };

    const handleBulkDownload = async () => {
        if (selectedIds.size === 0) return;
        const selectedPhotos = allMatches.filter(p => selectedIds.has(p.id));
        const photoUrls = selectedPhotos.map(p => getPhotoUrl(p.link));
        const filename = `${eventName.replace(/\s+/g, '-').toLowerCase()}-knot-photos.zip`;
        await downloadPhotos(photoUrls, filename);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        const confirmMsg = `Are you sure you want to delete ${selectedIds.size} photos?`;
        if (!confirm(confirmMsg)) return;

        try {
            const res = await fetch(`/api/events/${eventId}/photos`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photoIds: Array.from(selectedIds) }),
            });

            if (!res.ok) throw new Error('Bulk delete failed');

            // Remove from results UI
            const removeByIds = (matches: Match[]) => matches.filter(m => !selectedIds.has(m.id));
            setTieredMatches(prev => ({
                best: removeByIds(prev.best),
                good: removeByIds(prev.good),
                other: removeByIds(prev.other),
            }));

            setSelectedIds(new Set());
            setIsSelectMode(false);
        } catch (error) {
            console.error(error);
            alert('Failed to delete some photos.');
        }
    };

    const canDeletePhoto = (photo: PhotoDetail | Match): boolean => {
        if (!user) return false;
        // If it's a Match object, it might have uploaderId/eventCreatorId
        const uId = (photo as Match).uploaderId || (photo as PhotoDetail).uploaderId;
        const eCreatorId = (photo as Match).eventCreatorId || eventCreatorId;

        if (eCreatorId === user.id) return true;
        if (uId === user.id) return true;
        return false;
    };

    const canDeleteSelected = () => {
        if (selectedIds.size === 0) return false;
        const selectedPhotos = allMatches.filter(p => selectedIds.has(p.id));
        return selectedPhotos.every(p => canDeletePhoto(p));
    };

    // Flatten all matches for modal navigation
    const allMatches: (PhotoDetail & { uploaderId?: string, eventCreatorId?: string })[] = [
        ...tieredMatches.best,
        ...tieredMatches.good,
        ...tieredMatches.other,
    ].map(m => ({
        id: m.id,
        link: m.link,
        uploaderId: m.uploaderId,
        eventCreatorId: m.eventCreatorId
    }));

    const totalMatches = allMatches.length;

    const renderMatchSection = (title: string, matches: Match[]) => {
        if (matches.length === 0) return null;
        const allTierSelected = matches.every(m => selectedIds.has(m.id));

        return (
            <div className={styles.tierSection}>
                <div className={styles.tierTitle}>
                    <h3>{title}</h3>
                    {isSelectMode && (
                        <div className={styles.tierActions}>
                            <button
                                className={styles.textBtn}
                                onClick={() => handleToggleTier(matches)}
                            >
                                {allTierSelected ? 'Unselect All' : 'Select All'}
                            </button>
                        </div>
                    )}
                </div>
                <div className={styles.resultsGrid}>
                    {matches.map((match) => {
                        const isSelected = selectedIds.has(match.id);
                        return (
                            <div
                                key={match.id}
                                className={`${styles.resultCard} ${isSelected ? styles.selected : ''} ${isSelectMode ? styles.selecting : ''}`}
                                onClick={() => {
                                    if (!isSelectMode) {
                                        setSelectedPhoto({ id: match.id, link: match.link });
                                    }
                                }}
                                onPointerDown={() => {
                                    if (isSelectMode) {
                                        handlePointerDown(match.id, isSelected);
                                    }
                                }}
                                onPointerEnter={() => handlePointerEnter(match.id)}
                            >
                                {isSelectMode && <div className={styles.selectionOverlay} />}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={getPhotoUrl(match.link)} alt="Match" className={styles.resultImg} loading="lazy" />
                                {isSelected && (
                                    <div className={styles.checkBadge}>
                                        <span className="material-symbols-outlined">check_circle</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <PaperBackground>
            <div className={styles.container}>
                <header className={styles.header}>
                    {mode === 'intro' ? (
                        <Link href={`/event/${eventId}`} className={styles.iconBtn} aria-label="Back to Event">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </Link>
                    ) : (
                        <button onClick={handleBack} className={styles.iconBtn} aria-label="Back">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                    )}
                    <h1 className={styles.title}>
                        {isSelectMode ? 'Select Photos' : `${eventName} – Find My Photos`}
                    </h1>
                    {mode === 'results' && totalMatches > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                className={`${styles.selectBtn} ${isSelectMode ? styles.active : ''}`}
                                onClick={() => {
                                    setIsSelectMode(!isSelectMode);
                                    if (isSelectMode) setSelectedIds(new Set());
                                }}
                            >
                                {isSelectMode ? 'Cancel' : 'Select'}
                            </button>
                            {isSelectMode && (
                                <span className={styles.countBadge}>{selectedIds.size}</span>
                            )}
                        </div>
                    )}
                </header>

                <div className={styles.content}>
                    {mode === 'intro' && (
                        <div className={styles.card}>
                            <div className={styles.illustration}>
                                <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>face_retouching_natural</span>
                            </div>
                            <h2>Discover Your Moments</h2>
                            <p className={styles.instruction}>
                                We use facial recognition to find photos of you in the gallery.
                            </p>
                            <div className={styles.buttonGroup}>
                                <Button fullWidth onClick={handleCameraMode} size="lg">
                                    Take a Selfie
                                </Button>
                                <Button fullWidth variant="secondary" onClick={() => fileInputRef.current?.click()}>
                                    Upload Photo
                                </Button>
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    className={styles.hiddenInput}
                                    onChange={handleFileUpload}
                                />
                            </div>
                        </div>
                    )}

                    {mode === 'camera' && (
                        <div className={styles.cameraContainer}>
                            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                            <video ref={videoRef} autoPlay playsInline className={styles.video} muted />
                            <div className={styles.overlay}>
                                {hasMultipleCameras && (
                                    <button className={styles.flipBtn} onClick={handleFlipCamera} aria-label="Flip Camera">
                                        <span className="material-symbols-outlined">flip_camera_ios</span>
                                    </button>
                                )}
                                <button className={styles.captureBtn} onClick={handleCapture} aria-label="Capture" />
                            </div>
                        </div>
                    )}

                    {mode === 'searching' && (
                        <div className={styles.card}>
                            <div className={styles.illustration}>
                                <Spinner size="lg" color="accent" />
                            </div>
                            <h2>Scanning Gallery...</h2>
                            <p>This looks for matches with your face.</p>
                        </div>
                    )}

                    {mode === 'results' && (
                        <div className={styles.resultsContainer}>
                            {totalMatches > 0 ? (
                                <>
                                    <div className={styles.resultsHeader}>
                                        <h2>Your Photos {!isSelectMode && `(${totalMatches})`}</h2>
                                        <Button variant="secondary" size="sm" onClick={() => setMode('intro')}>New Search</Button>
                                    </div>
                                    {renderMatchSection(MATCH_TIERS.BEST.label, tieredMatches.best)}
                                    {renderMatchSection(MATCH_TIERS.GOOD.label, tieredMatches.good)}
                                    {renderMatchSection(MATCH_TIERS.OTHER.label, tieredMatches.other)}
                                </>
                            ) : (
                                <div className={styles.card}>
                                    <div className={styles.illustration}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>person_search</span>
                                    </div>
                                    <h2>No Matches Found</h2>
                                    <p>We couldn&apos;t find any photos of you in this event.</p>
                                    <Button onClick={() => setMode('intro')} style={{ marginTop: '1rem' }}>Try Again</Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Photo Modal for viewing matched photos */}
                <PhotoModal
                    isOpen={!!selectedPhoto}
                    photo={selectedPhoto}
                    photos={allMatches}
                    currentIndex={selectedPhoto ? allMatches.findIndex(p => p.id === selectedPhoto.id) : 0}
                    onClose={() => setSelectedPhoto(null)}
                    onNavigate={(index) => setSelectedPhoto(allMatches[index])}
                />

                {isSelectMode && selectedIds.size > 0 && (
                    <div className={styles.bulkActionsBar}>
                        <span className={styles.selectionInfo}>{selectedIds.size} selected</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className={`${styles.bulkBtn} ${styles.bulkBtnDownload}`} onClick={handleBulkDownload}>
                                <span className="material-symbols-outlined">download</span>
                                <span>Download</span>
                            </button>
                            {canDeleteSelected() && (
                                <button className={`${styles.bulkBtn} ${styles.bulkBtnDelete}`} onClick={handleBulkDelete}>
                                    <span className="material-symbols-outlined">delete</span>
                                    <span>Delete</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </PaperBackground>
    );
}


