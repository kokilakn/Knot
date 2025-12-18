'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './find-face.module.css';
import PaperBackground from '@/components/PaperBackground';
import Link from 'next/link';
import { Button, Spinner } from '@/components/ui';
import { useParams } from 'next/navigation';

export default function FindFacePage() {
    const params = useParams();
    const eventId = params.eventId as string;
    const [eventName, setEventName] = useState('Event');
    const [mode, setMode] = useState<'intro' | 'camera' | 'searching' | 'results'>('intro');
    const [matches, setMatches] = useState<{ id: string, link: string, distance: number }[]>([]);
    const [userImage, setUserImage] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera. Please allow permissions.");
            setMode('intro');
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const handleCameraMode = () => {
        setMode('camera');
        setTimeout(startCamera, 100);
    };

    const compressImage = (dataUrl: string, maxWidth = 640): Promise<string> => {
        return new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = dataUrl;
        });
    };

    const handleBack = () => {
        if (mode === 'camera') {
            stopCamera();
            setMode('intro');
        } else if (mode === 'searching' || mode === 'results') {
            setMode('intro');
        } else {
            // This case should be handled by the Link in the header if mode is 'intro'
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
            setUserImage(fullQuality);
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
                setUserImage(fullQuality);
                setMode('searching');
                const compressed = await compressImage(fullQuality);
                performSearch(compressed);
            };
            reader.readAsDataURL(file);
        }
    };

    const performSearch = async (imageData: string) => {
        try {
            const res = await fetch('http://localhost:5000/api/faces/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData, eventId: eventId })
            });

            if (res.ok) {
                const data = await res.json();
                console.log(`[FindFace] Received ${data.matches?.length} matches from server`);
                setMatches(data.matches || []);
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
    }, []);

    // Remove mock searching result

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
                    <h1 className={styles.title}>{eventName} – Find My Photos</h1>
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
                            {matches.length > 0 ? (
                                <>
                                    <div className={styles.resultsHeader}>
                                        <h2>All Matches Found ({matches.length})</h2>
                                        <Button variant="secondary" size="sm" onClick={() => setMode('intro')}>New Search</Button>
                                    </div>
                                    <div className={styles.resultsGrid}>
                                        {userImage && (
                                            <div className={`${styles.resultCard} ${styles.userEntry}`}>
                                                <img src={userImage} alt="You" className={styles.resultImg} />
                                                <div className={styles.matchScore} style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-paper)' }}>
                                                    Your Photo
                                                </div>
                                            </div>
                                        )}
                                        {matches.map((match) => (
                                            <div key={match.id} className={styles.resultCard}>
                                                <img src={match.link} alt="Match" className={styles.resultImg} />
                                                <div className={styles.matchScore}>
                                                    Match: {Math.round((1 - match.distance) * 100)}%
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className={styles.card}>
                                    <div className={styles.illustration}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>person_search</span>
                                    </div>
                                    <h2>No Matches Found</h2>
                                    <p>We couldn't find any photos of you in this event.</p>
                                    <Button onClick={() => setMode('intro')} style={{ marginTop: '1rem' }}>Try Again</Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </PaperBackground>
    );
}
