import { useState, useRef, useCallback, useEffect } from 'react';
import { checkMultipleCameras, stopStream } from '@/lib/cameraUtils';

export type FacingMode = 'user' | 'environment';

export function useCamera(initialFacingMode: FacingMode = 'environment') {
    const [facingMode, setFacingMode] = useState<FacingMode>(initialFacingMode);
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        checkMultipleCameras().then(setHasMultipleCameras);
    }, []);

    const stopCamera = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            stopStream(videoRef.current.srcObject as MediaStream);
            videoRef.current.srcObject = null;
        }
    }, []);

    const startCamera = useCallback(async (mode: FacingMode = facingMode) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: mode }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            return stream;
        } catch (err) {
            console.error("Error accessing camera:", err);
            throw err;
        }
    }, [facingMode]);

    const flipCamera = useCallback(async () => {
        stopCamera();
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newMode);
        return startCamera(newMode);
    }, [facingMode, startCamera, stopCamera]);

    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

    return {
        videoRef,
        facingMode,
        setFacingMode,
        hasMultipleCameras,
        startCamera,
        stopCamera,
        flipCamera
    };
}
