'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import styles from './QRCodeModal.module.css';

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventCode: string;
    eventName: string;
}

function IconClose() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconCopy() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    );
}

export default function QRCodeModal({ isOpen, onClose, eventCode, eventName }: QRCodeModalProps) {
    const [qrDataUrl, setQrDataUrl] = useState<string>('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen && eventCode) {
            // Generate QR code with full URL
            const url = `${window.location.origin}/event/${eventCode}`;
            QRCode.toDataURL(url, {
                width: 280,
                margin: 2,
                color: {
                    dark: '#2c1810',
                    light: '#faf6f0',
                },
            }).then(setQrDataUrl).catch(console.error);
        }
    }, [isOpen, eventCode]);

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

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                    <IconClose />
                </button>

                <h2 className={styles.title}>Share Event</h2>
                <p className={styles.eventName}>{eventName}</p>

                <div className={styles.qrContainer}>
                    {qrDataUrl ? (
                        <img src={qrDataUrl} alt="QR Code" className={styles.qrImage} />
                    ) : (
                        <div className={styles.qrPlaceholder}>Generating...</div>
                    )}
                </div>

                <p className={styles.instruction}>Scan QR code or enter code manually:</p>

                <div className={styles.codeContainer}>
                    <span className={styles.code}>{eventCode}</span>
                    <button className={styles.copyBtn} onClick={handleCopy} title="Copy code">
                        <IconCopy />
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
