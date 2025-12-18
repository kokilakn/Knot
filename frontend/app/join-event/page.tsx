'use client';

import PaperBackground from '@/components/PaperBackground';
import { Button } from '@/components/ui';
import styles from './join-event.module.css';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useUser } from '@/lib/UserContext';

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

// Extract event code from QR scan result (handles URL or plain code)
function extractEventCode(scannedText: string): string {
    // If it's a URL, try to extract the event code from it
    try {
        const url = new URL(scannedText);
        // Check for /event/CODE pattern
        const pathMatch = url.pathname.match(/\/event\/([A-Z0-9]{10})/i);
        if (pathMatch) {
            return pathMatch[1].toUpperCase();
        }
        // Check for ?code=CODE parameter
        const codeParam = url.searchParams.get('code');
        if (codeParam) {
            return codeParam.toUpperCase();
        }
    } catch {
        // Not a URL, treat as plain code
    }

    // If it looks like a 10-character alphanumeric code, return it
    const codeMatch = scannedText.match(/^[A-Z0-9]{10}$/i);
    if (codeMatch) {
        return scannedText.toUpperCase();
    }

    // Fallback: return as-is (will likely fail validation)
    return scannedText.toUpperCase();
}

export default function JoinEventPage() {
    const router = useRouter();
    const { user } = useUser();
    const [eventCode, setEventCode] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const autoSubmitRef = useRef(false);

    useEffect(() => {
        if (isScanning) {
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
                        // Extract just the code from the scanned result
                        const code = extractEventCode(decodedText);
                        setEventCode(code);
                        autoSubmitRef.current = true;
                        stopScanning();
                    },
                    () => {
                        // Ignore frequent read errors
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

    // Auto-submit when QR code is scanned
    useEffect(() => {
        if (autoSubmitRef.current && eventCode) {
            autoSubmitRef.current = false;
            handleJoin();
        }
    }, [eventCode]);

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

    const handleJoin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError('');

        if (!eventCode.trim()) {
            setError('Please enter an event code');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/events/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: eventCode.trim() }),
            });

            const data = await res.json();

            if (res.ok) {
                router.push(`/event/${data.event.code}`);
            } else {
                setError(data.error || 'Failed to join event');
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
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
                        <button
                            onClick={() => user ? router.push('/dashboard') : router.push('/login')}
                            className={styles.iconBtn}
                            aria-label="Back"
                        >
                            <IconBack />
                        </button>
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
                            {error && <div className={styles.error}>{error}</div>}

                            <div className={`${styles.fieldGroup} animate-fade-in animate-delay-3`}>
                                <input
                                    id="event-code"
                                    type="text"
                                    className={styles.input}
                                    placeholder=" "
                                    value={eventCode}
                                    onChange={(e) => setEventCode(e.target.value.toUpperCase())}
                                    maxLength={10}
                                    style={{ letterSpacing: '0.1em', textTransform: 'uppercase' }}
                                />
                                <label className={styles.label} htmlFor="event-code">Event Code (10 characters)</label>
                            </div>

                            {/* Submit Button */}
                            <div className={`${styles.footer} animate-fade-in animate-delay-4`}>
                                <Button type="submit" variant="primary" color="logo" size="lg" fullWidth disabled={!eventCode || loading}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {loading ? 'Joining...' : 'Join Event'} {!loading && <IconArrowRight />}
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

