'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import styles from '../event.module.css';
import PaperBackground from '@/components/PaperBackground';
import ActionCard from '@/components/dashboard/ActionCard';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import QRCodeModal from '@/components/shared/QRCodeModal';

interface EventData {
    eventId: string;
    code: string;
    name: string;
    eventDate: string;
    notes: string | null;
    coverPageUrl: string | null;
}

// Helper Icons locally defined
function IconBack() {
    return <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_back</span>;
}

function IconShare() {
    return <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>ios_share</span>;
}

function IconGallery() {
    return <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>photo_library</span>;
}

function IconFace() {
    return <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>face</span>;
}

function IconAdd() {
    return <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>add_a_photo</span>;
}

export default function EventPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.eventId as string;

    const [event, setEvent] = useState<EventData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showQRModal, setShowQRModal] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await fetch(`/api/events/${eventId}`);
                const data = await res.json();

                if (res.ok) {
                    setEvent(data.event);
                } else {
                    setError(data.error || 'Event not found');
                }
            } catch {
                setError('Failed to load event');
            } finally {
                setLoading(false);
            }
        };

        if (eventId) {
            fetchEvent();
        }
    }, [eventId]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <PaperBackground>
                <div className={styles.container}>
                    <header className={styles.header}>
                        <div className={styles.headerLeft}>
                            <Link href="/events" className={styles.iconBtn} aria-label="Go back">
                                <IconBack />
                            </Link>
                            <div className={styles.logo}>Knot</div>
                        </div>
                    </header>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                        <p style={{ color: 'var(--text-subtle)' }}>Loading...</p>
                    </div>
                </div>
            </PaperBackground>
        );
    }

    if (error || !event) {
        return (
            <PaperBackground>
                <div className={styles.container}>
                    <header className={styles.header}>
                        <div className={styles.headerLeft}>
                            <Link href="/events" className={styles.iconBtn} aria-label="Go back">
                                <IconBack />
                            </Link>
                            <div className={styles.logo}>Knot</div>
                        </div>
                    </header>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', gap: '1rem' }}>
                        <p style={{ color: '#dc3545' }}>{error || 'Event not found'}</p>
                        <Link href="/events" style={{ color: 'var(--color-primary-dark)' }}>View your events</Link>
                    </div>
                </div>
            </PaperBackground>
        );
    }

    const coverImage = event.coverPageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDg69gGD12xuf6pNQeB5PRSlY4n_NW-UaY9LZxBqYNpyjbKd8txI7EMm5ncxRtvioIPIVAgBUFlPkmQ0AmkNhB2XLO42rVL1pbXpgf9kRKcBivS3hiNdH2XFgwlLngsQhyRYMQeHtR2LwhBGUArQYtBjJa0g4yWgOeA6uNXTsFbTUpy9iAUG15sXIMUcCetjFtlPwslOtT_t2weU4wmGmPnGXaUQC1wdaMY5qUWIu0w8StR0WRWtklwfpf8ZKWtA12QDXYn1RD34MK4';

    return (
        <PaperBackground>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <Link href="/events" className={styles.iconBtn} aria-label="Go back">
                            <IconBack />
                        </Link>
                        <div className={styles.logo}>Knot</div>
                    </div>
                    <button
                        className={styles.iconBtn}
                        aria-label="Share"
                        onClick={() => setShowQRModal(true)}
                    >
                        <IconShare />
                    </button>
                </header>

                <div
                    className={styles.backgroundOverlay}
                    style={{ backgroundImage: `url("${coverImage}")` }}
                />

                <section className={styles.eventHeader}>
                    <p className={styles.eventSubtitle}>{formatDate(event.eventDate)}</p>
                    <h1 className={styles.eventTitle}>{event.name}</h1>
                </section>

                <main className={styles.main}>
                    <ActionCard
                        icon={<IconGallery />}
                        title="View Event Gallery"
                        description="Browse the full collection of moments."
                        onClick={() => router.push(`/event/${eventId}/gallery`)}
                    />
                    <ActionCard
                        icon={<IconFace />}
                        title="Find My Photos"
                        description="Scan your face to discover your moments."
                        onClick={() => router.push(`/event/${eventId}/find-face`)}
                    />
                    <ActionCard
                        icon={<IconAdd />}
                        title="Contribute to Event"
                        description="Upload images or use your camera."
                        onClick={() => router.push(`/event/${eventId}/contribute`)}
                    />
                </main>

                <QRCodeModal
                    isOpen={showQRModal}
                    onClose={() => setShowQRModal(false)}
                    eventCode={event.code}
                    eventName={event.name}
                />
            </div>
        </PaperBackground>
    );
}
