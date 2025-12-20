/**
 * Camera Utilities
 */

export async function checkMultipleCameras(): Promise<boolean> {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        return videoDevices.length > 1;
    } catch {
        return false;
    }
}

export function stopStream(stream: MediaStream | null) {
    if (!stream) return;
    stream.getTracks().forEach(track => track.stop());
}
