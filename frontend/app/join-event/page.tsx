'use client';

import PaperBackground from '@/components/PaperBackground';
import { Button } from '@/components/ui';
import styles from './join-event.module.css';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

// Icons
function IconBack() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconQrCode() {
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 3h6v6H3V3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 3h6v6h-6V3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 15h6v6H3v-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 15h2v2h-2v-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 19h2v2h-2v-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 15h2v2h-2v-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 19h2v2h-2v-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconArrowRight() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconClose() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export default function JoinEventPage() {
    const [eventCode, setEventCode] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        if (isScanning) {
            // Give the DOM a moment to render the container
            const timeoutId = setTimeout(() => {
                const html5QrCode = new Html5Qrcode("reader");
                scannerRef.current = html5QrCode;

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
                };

                html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        // Success callback
                        setEventCode(decodedText);
                        stopScanning();
                    },
                    (errorMessage) => {
                        // Error callback (ignore frequent read errors)
                    }
                ).catch((err) => {
                    console.error("Error starting scanner", err);
                    setIsScanning(false);
                });
            }, 100);

            return () => {
                clearTimeout(timeoutId);
                if (scannerRef.current && scannerRef.current.isScanning) {
                    scannerRef.current.stop().catch(console.error);
                }
            };
        }
    }, [isScanning]);

    const stopScanning = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (err) {
                console.error("Failed to stop scanner", err);
            }
        }
        setIsScanning(false);
    };

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Join with code:', eventCode);
        // Add navigation logic here when backend is ready
    };

    return (
        <PaperBackground>
            <div className={styles.container}>
                {/* Scanner Overlay */}
                {isScanning && (
                    <div className={styles.scannerOverlay}>
                        <div className={styles.scannerContent}>
                            <div className={styles.scannerTitle}>Scan QR Code</div>
                            <div id="reader" className={styles.scannerContainer}></div>
                            <button className={styles.closeScannerBtn} onClick={stopScanning}>
                                <IconClose />
                                Close Scanner
                            </button>
                        </div>
                    </div>
                )}

                {/* Header */}
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <Link href="/dashboard" className={styles.iconBtn} aria-label="Back">
                            <IconBack />
                        </Link>
                        <span className={styles.headerTitle}>Knot</span>
                    </div>
                </header>

                {/* Main Content */}
                <main className={styles.main}>
                    <div className={`${styles.titleSection} animate-fade-in`}>
                        <h1 className={styles.pageTitle}>Join<br />Event</h1>
                        <p className={styles.pageSubtitle}>Enter a code or scan to join.</p>
                    </div>

                    <div className={styles.contentContainer}>
                        {/* QR Code Section */}
                        <button
                            className={`${styles.qrSection} animate-fade-in animate-delay-1`}
                            onClick={() => setIsScanning(true)}
                            aria-label="Scan QR Code"
                        >
                            <div className={styles.qrIconCircle}>
                                <IconQrCode />
                            </div>
                            <div>
                                <div className={styles.qrText}>Scan QR Code</div>
                                <div className={styles.qrSubtext}>Use your camera to join instantly</div>
                            </div>
                        </button>

                        <div className={`${styles.divider} animate-fade-in animate-delay-2`}>
                            OR
                        </div>

                        {/* Code Input Section */}
                        <form className={styles.form} onSubmit={handleJoin}>
                            <div className={`${styles.fieldGroup} animate-fade-in animate-delay-3`}>
                                <input
                                    id="event-code"
                                    type="text"
                                    className={styles.input}
                                    placeholder=" "
                                    value={eventCode}
                                    onChange={(e) => setEventCode(e.target.value)}
                                />
                                <label className={styles.label} htmlFor="event-code">Event Code</label>
                            </div>

                            {/* Submit Button */}
                            <div className={`${styles.footer} animate-fade-in animate-delay-4`}>
                                <Button type="submit" variant="primary" color="logo" size="lg" fullWidth disabled={!eventCode}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        Join Event <IconArrowRight />
                                    </span>
                                </Button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </PaperBackground>
    );
}
