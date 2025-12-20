import React from 'react';
import styles from '../contribute.module.css';
import { Spinner } from '@/components/ui';

interface CameraViewProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    isCapturing: boolean;
    isUploading: boolean;
    hasMultipleCameras: boolean;
    intervalSecs: number | null;
    onToggleCapture: () => void;
    onFlip: () => void;
}

export const CameraView = ({
    videoRef,
    isCapturing,
    isUploading,
    hasMultipleCameras,
    intervalSecs,
    onToggleCapture,
    onFlip
}: CameraViewProps) => (
    <div className={styles.cameraContainer}>
        <video
            ref={videoRef}
            autoPlay
            playsInline
            className={styles.video}
            muted
            onDoubleClick={onFlip}
        />
        {hasMultipleCameras && <div className={styles.flipHint}>Double-tap to switch</div>}
        <div className={styles.overlay}>
            <button
                className={`${styles.captureBtn} ${isCapturing ? styles.recording : ''}`}
                onClick={onToggleCapture}
                aria-label={isCapturing ? "Stop Capturing" : "Capture Photo"}
            />
            <span className={styles.captureHint}>
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
);
