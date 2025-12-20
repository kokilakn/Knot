'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './contribute.module.css';
import PaperBackground from '@/components/PaperBackground';
import { Spinner } from '@/components/ui';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ContributePage() {
    const params = useParams();
    const eventId = params.eventId as string;
    const [eventName, setEventName] = useState('Event');
    const [mode, setMode] = useState<'select' | 'camera'>('select');
    const [isCapturing, setIsCapturing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [intervalSecs, setIntervalSecs] = useState<number | null>(null);
    const [customSecs, setCustomSecs] = useState<string>('');
    const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

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

    // Camera setup
    const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
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
            setMode('select');
        }
    };

    const handleFlipCamera = async () => {
        stopCamera();
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newMode);
        await startCamera(newMode);
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const formData = new FormData();
            Array.from(e.target.files).forEach(file => {
                formData.append('photos', file);
            });

            setIsUploading(true);
            try {
                // Optimistic UI updates could go here, but let's wait for server
                const res = await fetch(`/api/events/${eventId}/photos`, {
                    method: 'POST',
                    body: formData,
                });

                if (res.ok) {
                    alert("Photos uploaded successfully!");
                    // In a real app we might redirect to gallery or show them here
                } else {
                    const data = await res.json();
                    alert(data.error || "Upload failed");
                }
            } catch (error) {
                console.error("Upload error", error);
                alert("Upload failed");
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleCameraMode = () => {
        setMode('camera');
        // Give time for render
        setTimeout(startCamera, 100);
    };

    const handleBack = () => {
        if (mode === 'camera') {
            stopCamera();
            setIsCapturing(false);
            setMode('select');
        } else {
            // let Link handle navigation
        }
    };

    const capturePhoto = useCallback(async () => {
        if (!videoRef.current) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0);

            // Convert to file/blob for upload
            canvas.toBlob(async (blob) => {
                if (blob) {
                    const dataUrl = URL.createObjectURL(blob);
                    setCapturedPhotos(prev => [dataUrl, ...prev].slice(0, 30));

                    // Auto-upload
                    const formData = new FormData();
                    formData.append('photos', blob, `capture_${Date.now()}.jpg`);

                    setIsUploading(true);
                    try {
                        await fetch(`/api/events/${eventId}/photos`, {
                            method: 'POST',
                            body: formData,
                        });
                        console.log("Captured photo uploaded");
                    } catch (err) {
                        console.error("Failed to upload capture", err);
                    } finally {
                        setIsUploading(false);
                    }
                }
            }, 'image/jpeg', 0.8);
        }
    }, [eventId]);

    const handleCaptureToggle = () => {
        if (isCapturing) {
            setIsCapturing(false);
        } else {
            if (intervalSecs === null) {
                // Immediate single capture
                capturePhoto();
            } else {
                setIsCapturing(true);
            }
        }
    };

    // Interval logic
    useEffect(() => {
        if (isCapturing && intervalSecs !== null) {
            intervalIdRef.current = setInterval(capturePhoto, intervalSecs * 1000);
        } else {
            if (intervalIdRef.current) clearInterval(intervalIdRef.current);
        }

        return () => {
            if (intervalIdRef.current) clearInterval(intervalIdRef.current);
        };
    }, [isCapturing, intervalSecs, capturePhoto]);

    // Cleanup on unmount
    useEffect(() => {
        return () => stopCamera();
    }, []);

    return (
        <PaperBackground>
            <div className={styles.container}>
                <header className={styles.header}>
                    {mode === 'camera' ? (
                        <button onClick={handleBack} className={styles.iconBtn} aria-label="Back">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                    ) : (
                        <Link href={`/event/${eventId}`} className={styles.iconBtn} aria-label="Back to Event">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </Link>
                    )}
                    <h1 className={styles.title}>
                        {mode === 'camera' ? 'Auto-Capture' : `${eventName} – Contribute`}
                    </h1>
                </header>

                <div className={styles.content}>
                    {mode === 'select' ? (
                        <div className={styles.selectionGrid}>
                            <button className={styles.optionCard} onClick={() => fileInputRef.current?.click()}>
                                <span className={`${styles.optionIcon} material-symbols-outlined`} style={{ fontSize: '3rem' }}>upload_file</span>
                                <span className={styles.optionLabel}>Upload Photos</span>
                            </button>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                ref={fileInputRef}
                                className={styles.hiddenInput}
                                onChange={handleFileUpload}
                            />

                            <button className={styles.optionCard} onClick={handleCameraMode}>
                                <span className={`${styles.optionIcon} material-symbols-outlined`} style={{ fontSize: '3rem' }}>photo_camera</span>
                                <span className={styles.optionLabel}>Use Camera</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className={styles.cameraContainer}>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className={styles.video}
                                    muted
                                    onDoubleClick={handleFlipCamera}
                                />

                                {hasMultipleCameras && (
                                    <div className={styles.flipHint}>
                                        Double-tap to switch
                                    </div>
                                )}

                                <div className={styles.overlay}>
                                    <button
                                        className={`${styles.captureBtn} ${isCapturing ? styles.recording : ''}`}
                                        onClick={handleCaptureToggle}
                                        aria-label={isCapturing ? "Stop Capturing" : "Capture Photo"}
                                    />
                                    <span style={{ color: 'var(--color-paper)', textShadow: '0 1px 2px rgba(28, 28, 28, 0.5)', marginTop: '8px', fontSize: '0.875rem' }}>
                                        {isCapturing ? 'Capturing...' : (intervalSecs === null ? 'Tap to Capture' : 'Tap to Start Auto')}
                                    </span>
                                </div>
                                {isUploading && (
                                    <div className={styles.uploadBadge}>
                                        <Spinner size="sm" color="paper" />
                                        <span>Syncing...</span>
                                    </div>
                                )}
                            </div>

                            <div className={styles.intervalSection}>
                                <div className={styles.intervalLabel}>Auto-Capture Interval:</div>
                                <div className={styles.intervalSelector}>
                                    {[null, 5, 15, 30, 45, 60].map((val) => (
                                        <button
                                            key={val ?? 'no'}
                                            className={`${styles.intervalBtn} ${intervalSecs === val ? styles.active : ''}`}
                                            onClick={() => {
                                                setIntervalSecs(val);
                                                setIsCapturing(false);
                                            }}
                                        >
                                            {val === null ? 'None' : `${val}s`}
                                        </button>
                                    ))}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto', paddingRight: '4px' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Custom</span>
                                        <div className={styles.customInputWrapper}>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                className={styles.customInput}
                                                value={customSecs}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    setCustomSecs(val);
                                                    setIntervalSecs(val === '' ? null : parseInt(val));
                                                    setIsCapturing(false);
                                                }}
                                                placeholder="0"
                                            />
                                            <span className={styles.unit}>s</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {capturedPhotos.length > 0 && (
                                <div className={styles.filmstrip}>
                                    {capturedPhotos.map((photo, i) => (
                                        <div key={i} className={styles.filmstripItem}>
                                            <img src={photo} alt="Captured" className={styles.filmstripImg} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div >
            </div >
        </PaperBackground >
    );
}
