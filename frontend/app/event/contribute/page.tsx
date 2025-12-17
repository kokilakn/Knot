'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './contribute.module.css';
import PaperBackground from '@/components/PaperBackground';
import Link from 'next/link';

export default function ContributePage() {
    const [mode, setMode] = useState<'select' | 'camera'>('select');
    const [isCapturing, setIsCapturing] = useState(false);
    const [intervalSecs, setIntervalSecs] = useState(5);
    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

    // Camera setup
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
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

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
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

    const capturePhoto = useCallback(() => {
        if (!videoRef.current) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0);
            // In a real app, we'd send this blob/dataUrl to a server
            // const dataUrl = canvas.toDataURL('image/jpeg');
            console.log("Captured photo at " + new Date().toLocaleTimeString());

            // Visual feedback could be added here
            const flash = document.createElement('div');
            flash.style.position = 'fixed';
            flash.style.inset = '0';
            flash.style.backgroundColor = 'white';
            flash.style.opacity = '0.8';
            flash.style.zIndex = '100';
            flash.style.transition = 'opacity 0.5s';
            document.body.appendChild(flash);
            requestAnimationFrame(() => flash.style.opacity = '0');
            setTimeout(() => flash.remove(), 500);
        }
    }, []);

    // Interval logic
    useEffect(() => {
        if (isCapturing) {
            intervalIdRef.current = setInterval(capturePhoto, intervalSecs * 1000);
        } else {
            if (intervalIdRef.current) clearInterval(intervalIdRef.current);
        }

        return () => {
            if (intervalIdRef.current) clearInterval(intervalIdRef.current);
        };
    }, [isCapturing, intervalSecs, capturePhoto]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            alert(`Selected ${e.target.files.length} files. Upload logic would go here.`);
        }
    };

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
                        <Link href="/event" className={styles.iconBtn} aria-label="Back to Event">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </Link>
                    )}
                    <h1 className={styles.title}>
                        {mode === 'camera' ? 'Auto-Capture' : 'Contribute'}
                    </h1>
                </header>

                <div className={styles.content}>
                    {mode === 'select' ? (
                        <div className={styles.selectionGrid}>
                            <button className={styles.optionCard} onClick={() => fileInputRef.current?.click()}>
                                <span className={`${styles.optionIcon} material-symbols-outlined`}>upload_file</span>
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
                                <span className={`${styles.optionIcon} material-symbols-outlined`}>photo_camera</span>
                                <span className={styles.optionLabel}>Use Camera</span>
                            </button>
                        </div>
                    ) : (
                        <div className={styles.cameraContainer}>
                            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                            <video ref={videoRef} autoPlay playsInline className={styles.video} muted />

                            <div className={styles.overlay}>
                                <div className={styles.setting}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>timer</span>
                                    <span>Interval: {intervalSecs}s</span>
                                    <input
                                        type="range"
                                        min="1"
                                        max="60"
                                        value={intervalSecs}
                                        onChange={(e) => setIntervalSecs(parseInt(e.target.value))}
                                        disabled={isCapturing}
                                        style={{ width: '60px' }}
                                    />
                                </div>
                                <button
                                    className={`${styles.captureBtn} ${isCapturing ? styles.recording : ''}`}
                                    onClick={() => setIsCapturing(!isCapturing)}
                                    aria-label={isCapturing ? "Stop Capturing" : "Start Capturing"}
                                />
                                <span style={{ color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                                    {isCapturing ? 'Capturing...' : 'Tap to Start'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PaperBackground>
    );
}
