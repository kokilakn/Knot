'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './find-face.module.css';
import PaperBackground from '@/components/PaperBackground';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function FindFacePage() {
    const [mode, setMode] = useState<'intro' | 'camera' | 'searching'>('intro');
    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleBack = () => {
        if (mode === 'camera') {
            stopCamera();
            setMode('intro');
        } else if (mode === 'searching') {
            setMode('intro');
        } else {
            // let Link handle navigation
        }
    };

    const handleCapture = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0);
            stopCamera();
            setMode('searching');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setMode('searching');
        }
    };

    useEffect(() => {
        return () => stopCamera();
    }, []);

    // Mock searching result
    useEffect(() => {
        if (mode === 'searching') {
            const timer = setTimeout(() => {
                alert("Face search simulation complete! (No backend connected)");
                setMode('intro');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [mode]);

    return (
        <PaperBackground>
            <div className={styles.container}>
                <header className={styles.header}>
                    {mode === 'intro' ? (
                        <Link href="/event" className={styles.iconBtn} aria-label="Back to Event">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </Link>
                    ) : (
                        <button onClick={handleBack} className={styles.iconBtn} aria-label="Back">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                    )}
                    <h1 className={styles.title}>Find Your Face</h1>
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
                            <div className={`${styles.illustration} animate-spin`}>
                                <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>hourglass_empty</span>
                            </div>
                            <h2>Scanning Gallery...</h2>
                            <p>This looks for matches with your face.</p>
                        </div>
                    )}
                </div>
            </div>
        </PaperBackground>
    );
}
