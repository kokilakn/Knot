'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './contribute.module.css';
import PaperBackground from '@/components/PaperBackground';
import { useParams } from 'next/navigation';
import { useCamera } from '@/hooks/useCamera';
import { fetchEvent, uploadPhotos } from '@/lib/eventActions';
import { PageHeader } from '@/components/shared/PageHeader';
import { captureVideoFrame } from '@/lib/imageUtils';
import { SelectionGrid } from './components/SelectionGrid';
import { CameraView } from './components/CameraView';
import { IntervalSelector } from './components/IntervalSelector';
import { Filmstrip } from './components/Filmstrip';

export default function ContributePage() {
    const { eventId } = useParams() as { eventId: string };
    const [eventName, setEventName] = useState('Event');
    const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
    const [mode, setMode] = useState<'select' | 'camera'>('select');
    const [isCapturing, setIsCapturing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [intervalSecs, setIntervalSecs] = useState<number | null>(null);
    const [customSecs, setCustomSecs] = useState<string>('');
    const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);

    const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { videoRef, hasMultipleCameras, startCamera, stopCamera, flipCamera } = useCamera('environment');

    useEffect(() => {
        if (eventId) fetchEvent(eventId).then(data => {
            if (data.event) {
                setEventName(data.event.name);
                setCoverPhotoUrl(data.event.coverPageUrl || null);
            }
        }).catch(console.error);
    }, [eventId]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setIsUploading(true);
        try {
            await uploadPhotos(eventId, Array.from(e.target.files));
            alert("Photos uploaded successfully!");
        } catch (error: any) {
            alert(error.message || "Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    const capturePhoto = useCallback(async () => {
        if (!videoRef.current) return;
        const blob = await captureVideoFrame(videoRef.current);
        if (!blob) return;

        setCapturedPhotos(prev => [URL.createObjectURL(blob), ...prev].slice(0, 30));
        setIsUploading(true);
        try {
            await uploadPhotos(eventId, [blob]);
        } catch (err) {
            console.error("Failed to upload capture", err);
        } finally {
            setIsUploading(false);
        }
    }, [eventId, videoRef]);

    useEffect(() => {
        if (isCapturing && intervalSecs !== null) {
            intervalIdRef.current = setInterval(capturePhoto, intervalSecs * 1000);
        } else if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current);
        }
        return () => { if (intervalIdRef.current) clearInterval(intervalIdRef.current); };
    }, [isCapturing, intervalSecs, capturePhoto]);

    const handleBack = () => {
        if (mode === 'camera') {
            stopCamera();
            setIsCapturing(false);
            setMode('select');
        }
    };

    const handleCameraMode = () => {
        setMode('camera');
        setTimeout(() => startCamera().catch(() => {
            alert("Could not access camera.");
            setMode('select');
        }), 100);
    };

    const handleToggleCapture = () => {
        if (isCapturing) {
            setIsCapturing(false);
        } else if (intervalSecs === null) {
            capturePhoto();
        } else {
            setIsCapturing(true);
        }
    };

    const handleSetInterval = (val: number | null) => {
        setIntervalSecs(val);
        setIsCapturing(false);
    };

    const handleSetCustom = (val: string) => {
        setCustomSecs(val);
        setIntervalSecs(val === '' ? null : parseInt(val));
        setIsCapturing(false);
    };

    return (
        <PaperBackground coverPhotoUrl={coverPhotoUrl}>
            <div className={styles.container}>
                <PageHeader
                    title={mode === 'camera' ? 'Auto-Capture' : `${eventName} – Contribute`}
                    backHref={mode === 'select' ? `/event/${eventId}` : undefined}
                    onBack={mode === 'camera' ? handleBack : undefined}
                    className={styles.header}
                />

                <div className={styles.content}>
                    {mode === 'select' ? (
                        <>
                            <SelectionGrid
                                onUploadClick={() => fileInputRef.current?.click()}
                                onCameraClick={handleCameraMode}
                            />
                            <input
                                type="file" multiple accept="image/*" ref={fileInputRef}
                                className={styles.hiddenInput} onChange={handleFileUpload}
                            />
                        </>
                    ) : (
                        <>
                            <CameraView
                                videoRef={videoRef}
                                isCapturing={isCapturing}
                                isUploading={isUploading}
                                hasMultipleCameras={hasMultipleCameras}
                                intervalSecs={intervalSecs}
                                onToggleCapture={handleToggleCapture}
                                onFlip={() => flipCamera().catch(console.error)}
                            />
                            <IntervalSelector
                                intervalSecs={intervalSecs}
                                customSecs={customSecs}
                                onSetInterval={handleSetInterval}
                                onSetCustom={handleSetCustom}
                            />
                            <Filmstrip photos={capturedPhotos} />
                        </>
                    )}
                </div>
            </div>
        </PaperBackground>
    );
}
