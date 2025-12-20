'use client';

function IconShare() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7a2.5 2.5 0 0 0 0-1.39l7.02-4.11A2.99 2.99 0 1 0 14 5c0 .23.03.45.08.67L7.06 9.78a3 3 0 1 0 0 4.44l7.02 4.11c-.05.22-.08.44-.08.67a3 3 0 1 0 3-2.89z" fill="currentColor" />
        </svg>
    );
}

import { useEffect, useState, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import styles from './QRCodeModal.module.css';
import { getPhotoUrl } from '@/hooks/usePhotoUrl';

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventCode: string;
    eventName: string;
    coverPhotoUrl?: string | null;
}

function IconClose() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export default function QRCodeModal({ isOpen, onClose, eventCode, eventName, coverPhotoUrl }: QRCodeModalProps) {
    const [qrImageUrl, setQrImageUrl] = useState<string>('');
    const [inviteCardUrl, setInviteCardUrl] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const inviteCanvasRef = useRef<HTMLCanvasElement>(null);

    // Generate QR Code for display
    const generateQRWithLogo = useCallback(async () => {
        if (!canvasRef.current || !eventCode) return;

        const url = `${window.location.origin}/event/${eventCode}`;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = 320;
        canvas.width = size;
        canvas.height = size;

        await QRCode.toCanvas(canvas, url, {
            width: size,
            margin: 1,
            color: {
                dark: '#1C1C1C',
                light: '#F7F5F2',
            },
            errorCorrectionLevel: 'H',
        });
        const reservedSize = size * 0.44;
        const centerX = size / 2;
        const centerY = size / 2;
        const padding = 8;
        const borderThickness = 8;
        const borderOuterSize = reservedSize - (padding * 2);
        const strokePos = borderOuterSize - borderThickness;
        const photoSize = borderOuterSize - (borderThickness * 2) - (padding * 2);

        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.rect(centerX - reservedSize / 2, centerY - reservedSize / 2, reservedSize, reservedSize);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#F7F5F2';
        ctx.fillRect(centerX - reservedSize / 2, centerY - reservedSize / 2, reservedSize, reservedSize);

        if (coverPhotoUrl) {
            try {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.src = getPhotoUrl(coverPhotoUrl);
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                });

                ctx.strokeStyle = '#1C1C1C';
                ctx.lineWidth = borderThickness;
                ctx.strokeRect(centerX - strokePos / 2, centerY - strokePos / 2, strokePos, strokePos);

                ctx.save();
                ctx.beginPath();
                ctx.rect(centerX - photoSize / 2, centerY - photoSize / 2, photoSize, photoSize);
                ctx.clip();

                const aspect = img.width / img.height;
                let drawW, drawH;
                if (aspect > 1) {
                    drawH = photoSize;
                    drawW = photoSize * aspect;
                } else {
                    drawW = photoSize;
                    drawH = photoSize / aspect;
                }
                ctx.drawImage(img, centerX - drawW / 2, centerY - drawH / 2, drawW, drawH);
                ctx.restore();
            } catch (err) {
                console.warn("Could not load cover photo for QR center, falling back to K", err);
                ctx.strokeStyle = '#1C1C1C';
                ctx.lineWidth = borderThickness;
                ctx.strokeRect(centerX - strokePos / 2, centerY - strokePos / 2, strokePos, strokePos);

                ctx.font = `bold ${photoSize * 0.8}px 'Cormorant Garamond', serif`;
                ctx.fillStyle = '#1C1C1C';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('K', centerX, centerY + 2);
            }
        } else {
            ctx.strokeStyle = '#1C1C1C';
            ctx.lineWidth = borderThickness;
            ctx.strokeRect(centerX - strokePos / 2, centerY - strokePos / 2, strokePos, strokePos);

            ctx.font = `bold ${photoSize * 0.8}px 'Cormorant Garamond', serif`;
            ctx.fillStyle = '#1C1C1C';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('K', centerX, centerY + 2);
        }

        const imageUrl = canvas.toDataURL('image/png');
        setQrImageUrl(imageUrl);
        return imageUrl;
    }, [eventCode, coverPhotoUrl]);

    // Pre-generate beautiful invite card for instant sharing
    const generateInviteCard = useCallback(async (qrDataUrl: string) => {
        if (!inviteCanvasRef.current || !eventCode) return;

        const canvas = inviteCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Card dimensions (optimized for social sharing)
        const width = 600;
        const height = 900;
        canvas.width = width;
        canvas.height = height;

        // Background gradient (subtle paper)
        const bgGradient = ctx.createLinearGradient(0, 0, width, height);
        bgGradient.addColorStop(0, '#F7F5F2');
        bgGradient.addColorStop(1, '#E4DED7');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        // Decorative border
        ctx.strokeStyle = '#1C1C1C';
        ctx.lineWidth = 3;
        ctx.strokeRect(20, 20, width - 40, height - 40);

        // Inner decorative line
        ctx.strokeStyle = 'rgba(28, 28, 28, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(30, 30, width - 60, height - 60);

        // Decorative corner flourishes
        ctx.strokeStyle = '#1C1C1C';
        ctx.lineWidth = 2;

        // Top left
        ctx.beginPath();
        ctx.moveTo(40, 60);
        ctx.lineTo(40, 40);
        ctx.lineTo(60, 40);
        ctx.stroke();

        // Top right
        ctx.beginPath();
        ctx.moveTo(width - 60, 40);
        ctx.lineTo(width - 40, 40);
        ctx.lineTo(width - 40, 60);
        ctx.stroke();

        // Bottom left
        ctx.beginPath();
        ctx.moveTo(40, height - 60);
        ctx.lineTo(40, height - 40);
        ctx.lineTo(60, height - 40);
        ctx.stroke();

        // Bottom right
        ctx.beginPath();
        ctx.moveTo(width - 60, height - 40);
        ctx.lineTo(width - 40, height - 40);
        ctx.lineTo(width - 40, height - 60);
        ctx.stroke();

        // Header text - "You're Invited!"
        ctx.font = 'italic 24px "Cormorant Garamond", serif';
        ctx.fillStyle = '#334351';
        ctx.textAlign = 'center';
        ctx.fillText("✨ You're Invited! ✨", width / 2, 80);

        let contentY = 130;

        // Draw cover photo if available
        if (coverPhotoUrl) {
            try {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.src = getPhotoUrl(coverPhotoUrl);
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                });

                const photoSize = 120;
                const photoY = 100;

                ctx.save();
                ctx.beginPath();
                ctx.arc(width / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
                ctx.clip();

                // Draw image centered and scaled to cover
                const aspect = img.width / img.height;
                let drawW, drawH;
                if (aspect > 1) {
                    drawH = photoSize;
                    drawW = photoSize * aspect;
                } else {
                    drawW = photoSize;
                    drawH = photoSize / aspect;
                }
                ctx.drawImage(img, width / 2 - drawW / 2, photoY + photoSize / 2 - drawH / 2, drawW, drawH);
                ctx.restore();

                // Gold border around photo
                ctx.strokeStyle = '#334351';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(width / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
                ctx.stroke();

                contentY = 260;
            } catch (err) {
                console.warn("Error loading cover photo for invite card", err);
            }
        }

        // Event name (main title)
        ctx.font = 'bold 36px "Cormorant Garamond", serif';
        ctx.fillStyle = '#1C1C1C';

        // Word wrap for long event names
        const maxWidth = width - 100;
        const words = eventName.split(' ');
        let line = '';
        let y = contentY;
        const lineHeight = 44;

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && i > 0) {
                ctx.fillText(line.trim(), width / 2, y);
                line = words[i] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line.trim(), width / 2, y);

        // Decorative divider
        const dividerY = y + 40;
        ctx.strokeStyle = '#334351';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(150, dividerY);
        ctx.lineTo(width / 2 - 20, dividerY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(width / 2 + 20, dividerY);
        ctx.lineTo(width - 150, dividerY);
        ctx.stroke();

        // Heart or star in center of divider
        ctx.font = '16px serif';
        ctx.fillStyle = '#334351';
        ctx.fillText('✦', width / 2, dividerY + 5);

        // Cute message
        ctx.font = 'italic 18px "Cormorant Garamond", serif';
        ctx.fillStyle = '#4A4A4A';
        ctx.fillText('Join us for a moment to remember!', width / 2, dividerY + 50);

        // QR Code section
        const qrSize = 220;
        const qrY = dividerY + 90;

        // QR code background with shadow effect
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(width / 2 - qrSize / 2 - 15, qrY - 15, qrSize + 30, qrSize + 30);
        ctx.shadowColor = 'transparent';

        // Draw QR code
        if (qrDataUrl) {
            const qrImg = new Image();
            qrImg.src = qrDataUrl;
            await new Promise((resolve) => {
                qrImg.onload = resolve;
                qrImg.onerror = resolve;
            });
            ctx.drawImage(qrImg, width / 2 - qrSize / 2, qrY, qrSize, qrSize);
        }

        // "Scan to join" text
        ctx.font = '14px "Montserrat", sans-serif';
        ctx.fillStyle = '#7A7A7A';
        ctx.fillText('Scan to join the event', width / 2, qrY + qrSize + 40);

        // Divider before code
        const codeY = qrY + qrSize + 80;
        ctx.strokeStyle = 'rgba(28, 28, 28, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(100, codeY - 15);
        ctx.lineTo(width - 100, codeY - 15);
        ctx.stroke();

        // "Or use code" text
        ctx.font = 'italic 14px "Cormorant Garamond", serif';
        ctx.fillStyle = '#7A7A7A';
        ctx.fillText('or use this code', width / 2, codeY + 10);

        // Event code box
        const codeBoxY = codeY + 30;
        ctx.fillStyle = 'rgba(28, 28, 28, 0.06)';
        ctx.fillRect(width / 2 - 130, codeBoxY, 260, 50);
        ctx.strokeStyle = '#334351';
        ctx.lineWidth = 1;
        ctx.strokeRect(width / 2 - 130, codeBoxY, 260, 50);

        // Event code
        ctx.font = 'bold 28px "Montserrat", monospace';
        ctx.fillStyle = '#1C1C1C';
        ctx.fillText(eventCode, width / 2, codeBoxY + 34);

        // Event URL
        const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/event/${eventCode}`;
        ctx.font = '12px "Montserrat", sans-serif';
        ctx.fillStyle = '#7A7A7A';
        ctx.fillText(url, width / 2, codeBoxY + 75);

        // Bottom branding section
        const brandY = height - 70;

        // Decorative line
        ctx.strokeStyle = 'rgba(28, 28, 28, 0.2)';
        ctx.beginPath();
        ctx.moveTo(150, brandY - 30);
        ctx.lineTo(width - 150, brandY - 30);
        ctx.stroke();

        // Tagline
        ctx.font = 'italic 14px "Cormorant Garamond", serif';
        ctx.fillStyle = '#7A7A7A';
        ctx.fillText('Capture moments. Share memories.', width / 2, brandY);

        // Knot branding
        ctx.font = 'bold 20px "Cormorant Garamond", serif';
        ctx.fillStyle = '#1C1C1C';
        ctx.fillText('Knot', width / 2, brandY + 30);

        // Small heart decorations
        ctx.font = '12px serif';
        ctx.fillStyle = '#334351';
        ctx.fillText('💫', width / 2 - 50, brandY + 30);
        ctx.fillText('💫', width / 2 + 50, brandY + 30);

        const inviteUrl = canvas.toDataURL('image/png');
        setInviteCardUrl(inviteUrl);
        return inviteUrl;
    }, [eventCode, eventName, coverPhotoUrl]);

    // Generate both QR and invite card when modal opens
    useEffect(() => {
        if (isOpen && eventCode) {
            setIsGenerating(true);
            generateQRWithLogo().then((qrUrl) => {
                if (qrUrl) {
                    generateInviteCard(qrUrl).then(() => {
                        setIsGenerating(false);
                    });
                }
            });
        }
    }, [isOpen, eventCode, generateQRWithLogo, generateInviteCard]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(eventCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (!isOpen) return null;

    const handleShare = async () => {
        if (!inviteCardUrl) {
            console.warn('Invite card not ready yet');
            return;
        }

        const shareText = `✨ You're invited to "${eventName}"!\n\n📸 Join us to capture and share special moments together.\n\n🎟️ Event Code: ${eventCode}\n🔗 ${window.location.origin}/event/${eventCode}\n\n— Powered by Knot`;

        if (navigator.share) {
            try {
                // Convert data URL to blob for sharing
                const res = await fetch(inviteCardUrl);
                const blob = await res.blob();
                const file = new File([blob], `knot-invite-${eventCode}.png`, { type: 'image/png' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `Join "${eventName}" on Knot`,
                        text: shareText
                    });
                    return;
                }
            } catch (err) {
                console.warn("File share failed, falling back to text", err);
            }

            // Fallback to text-only share
            try {
                await navigator.share({
                    title: `Join "${eventName}" on Knot`,
                    text: shareText
                });
            } catch (err) {
                console.warn("Text share also failed", err);
            }
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                    <IconClose />
                </button>

                {/* Hidden canvases for generation */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <canvas ref={inviteCanvasRef} style={{ display: 'none' }} />

                <h2 className={styles.title}>Share Event</h2>
                <p className={styles.eventName}>{eventName}</p>

                <div className={styles.qrContainer}>
                    {qrImageUrl ? (
                        <div className={styles.qrWrapper}>
                            <img src={qrImageUrl} alt="QR Code" className={styles.qrImage} />
                        </div>
                    ) : (
                        <div className={styles.qrPlaceholder}>Generating QR Code...</div>
                    )}
                </div>

                <p className={styles.instruction}>Scan QR code or use code:</p>

                <div className={styles.codeSection}>
                    <div className={styles.codeBox}>
                        <span className={styles.codeLabel}>ENTRY CODE</span>
                        <span className={styles.code}>{eventCode}</span>
                    </div>

                    <div className={styles.actionButtons}>
                        <button
                            className={styles.shareBtn}
                            onClick={handleShare}
                            disabled={isGenerating}
                        >
                            <IconShare />
                            <span>{isGenerating ? 'Preparing...' : 'Share Invite'}</span>
                        </button>
                        <button className={styles.copyBtn} onClick={handleCopy}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                                {copied ? 'check' : 'content_copy'}
                            </span>
                            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                        </button>
                    </div>
                </div>

                <p className={styles.branding}>Powered by <span className={styles.brandName}>Knot</span></p>
            </div>
        </div>
    );
}
