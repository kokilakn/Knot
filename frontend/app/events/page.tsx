'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PaperBackground from '@/components/PaperBackground';
import { useUser } from '@/lib/UserContext';
import { Spinner } from '@/components/ui';
import { getPhotoUrl } from '@/hooks/usePhotoUrl';
import styles from './events.module.css';

// Type definition for an event
interface Event {
    eventId: string;
    code: string;
    name: string;
    eventDate: string;
    coverPageUrl: string | null;
}

function IconBack() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
    );
}

function IconAdd() {
    return <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>;
}

export default function EventsPage() {
    const router = useRouter();
    const { user, loading: userLoading } = useUser();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!userLoading && !user) {
            router.push('/login');
        }
    }, [userLoading, user, router]);

    useEffect(() => {
        const fetchEvents = async () => {
            if (!user) return;

            try {
                const res = await fetch('/api/events');
                const data = await res.json();

                if (res.ok) {
                    setEvents(data.events || []);
                } else if (res.status === 401) {
                    router.push('/login');
                } else {
                    setError(data.error || 'Failed to load events');
                }
            } catch {
                setError('Failed to load events');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchEvents();
        }
    }, [user, router]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const defaultCover = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDg69gGD12xuf6pNQeB5PRSlY4n_NW-UaY9LZxBqYNpyjbKd8txI7EMm5ncxRtvioIPIVAgBUFlPkmQ0AmkNhB2XLO42rVL1pbXpgf9kRKcBivS3hiNdH2XFgwlLngsQhyRYMQeHtR2LwhBGUArQYtBjJa0g4yWgOeA6uNXTsFbTUpy9iAUG15sXIMUcCetjFtlPwslOtT_t2weU4wmGmPnGXaUQC1wdaMY5qUWIu0w8StR0WRWtklwfpf8ZKWtA12QDXYn1RD34MK4';

    return (
        <PaperBackground>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <Link href="/dashboard" className={styles.iconBtn} aria-label="Back to Dashboard">
                            <IconBack />
                        </Link>
                        <span className={styles.logo}>Knot</span>
                    </div>
                    <Link href="/create-event" className={styles.createBtn}>
                        <IconAdd />
                        <span>Create Event</span>
                    </Link>
                </header>

                <section className={styles.titleSection}>
                    <h1 className={styles.pageTitle}>My Events</h1>
                    <p className={styles.pageSubtitle}>Memories you've collected</p>
                </section>

                <main className={styles.grid}>
                    {loading && (
                        <div style={{ textAlign: 'center', color: 'var(--text-subtle)', gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem' }}>
                            <Spinner size="lg" color="accent" />
                            <p>Loading events...</p>
                        </div>
                    )}

                    {error && (
                        <p style={{ textAlign: 'center', color: 'var(--color-error)', gridColumn: '1 / -1' }}>
                            {error}
                        </p>
                    )}

                    {!loading && !error && events.length === 0 && (
                        <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '2rem' }}>
                            <p style={{ color: 'var(--text-subtle)', marginBottom: '1rem' }}>
                                No events yet
                            </p>
                            <Link href="/create-event" style={{ color: 'var(--color-primary-dark)' }}>
                                Create your first event
                            </Link>
                        </div>
                    )}

                    {events.map((event) => (
                        <Link href={`/event/${event.code}`} key={event.eventId} className={styles.card}>
                            <div
                                className={styles.cardBackground}
                                style={{ backgroundImage: `url('${getPhotoUrl(event.coverPageUrl || defaultCover)}')` }}
                                aria-hidden="true"
                            />
                            <div className={styles.cardOverlay} />
                            <div className={styles.cardContent}>
                                <span className={styles.eventDate}>{formatDate(event.eventDate)}</span>
                                <h2 className={styles.eventName}>{event.name}</h2>
                            </div>
                        </Link>
                    ))}
                </main>
            </div>
        </PaperBackground>
    );
}

