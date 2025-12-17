'use client';

import React from 'react';
import Link from 'next/link';
import PaperBackground from '@/components/PaperBackground';
import styles from './events.module.css';

// Type definition for an event
interface Event {
    id: string;
    name: string;
    date: string;
    coverImage: string;
    formattedDate: string;
}

// Hardcoded single event as requested
const EVENTS: Event[] = [
    {
        id: '1',
        name: "Kok's Wedding",
        date: '2023-10-14',
        formattedDate: 'October 14, 2023',
        // Using the same image from the existing event page details
        coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDg69gGD12xuf6pNQeB5PRSlY4n_NW-UaY9LZxBqYNpyjbKd8txI7EMm5ncxRtvioIPIVAgBUFlPkmQ0AmkNhB2XLO42rVL1pbXpgf9kRKcBivS3hiNdH2XFgwlLngsQhyRYMQeHtR2LwhBGUArQYtBjJa0g4yWgOeA6uNXTsFbTUpy9iAUG15sXIMUcCetjFtlPwslOtT_t2weU4wmGmPnGXaUQC1wdaMY5qUWIu0w8StR0WRWtklwfpf8ZKWtA12QDXYn1RD34MK4'
    }
];

function IconBack() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
    );
}

export default function EventsPage() {
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
                </header>

                <section className={styles.titleSection}>
                    <h1 className={styles.pageTitle}>My Events</h1>
                    <p className={styles.pageSubtitle}>Memories you've collected</p>
                </section>

                <main className={styles.grid}>
                    {EVENTS.map((event) => (
                        <Link href="/event" key={event.id} className={styles.card}>
                            <div
                                className={styles.cardBackground}
                                style={{ backgroundImage: `url('${event.coverImage}')` }}
                                aria-hidden="true"
                            />
                            <div className={styles.cardOverlay} />
                            <div className={styles.cardContent}>
                                <span className={styles.eventDate}>{event.formattedDate}</span>
                                <h2 className={styles.eventName}>{event.name}</h2>
                            </div>
                        </Link>
                    ))}
                </main>
            </div>
        </PaperBackground>
    );
}
