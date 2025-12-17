'use client';

import React from 'react';
import styles from './event.module.css';
import PaperBackground from '@/components/PaperBackground';
import ActionCard from '@/components/dashboard/ActionCard';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Helper Icons locally defined
/* Top Icons */
function IconBack() {
    return <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_back</span>;
}

function IconShare() {
    return <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>ios_share</span>;
}

/* Action Icons */
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
    const router = useRouter();

    return (
        <PaperBackground>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <Link href="/dashboard" className={styles.iconBtn} aria-label="Go back">
                            <IconBack />
                        </Link>
                        <div className={styles.logo}>Knot</div>
                    </div>
                    <button className={styles.iconBtn} aria-label="Share">
                        <IconShare />
                    </button>
                </header>

                <div
                    className={styles.backgroundOverlay}
                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDg69gGD12xuf6pNQeB5PRSlY4n_NW-UaY9LZxBqYNpyjbKd8txI7EMm5ncxRtvioIPIVAgBUFlPkmQ0AmkNhB2XLO42rVL1pbXpgf9kRKcBivS3hiNdH2XFgwlLngsQhyRYMQeHtR2LwhBGUArQYtBjJa0g4yWgOeA6uNXTsFbTUpy9iAUG15sXIMUcCetjFtlPwslOtT_t2weU4wmGmPnGXaUQC1wdaMY5qUWIu0w8StR0WRWtklwfpf8ZKWtA12QDXYn1RD34MK4")' }}
                />

                <section className={styles.eventHeader}>
                    <p className={styles.eventSubtitle}>October 14, 2023</p>
                    <h1 className={styles.eventTitle}>Kok's Wedding</h1>
                </section>

                <main className={styles.main}>
                    <ActionCard
                        icon={<IconGallery />}
                        title="View Event Gallery"
                        description="Browse the full collection of moments."
                        onClick={() => router.push('/event/gallery')}
                    />
                    <ActionCard
                        icon={<IconFace />}
                        title="Find My Photos"
                        description="Scan your face to discover your moments."
                        onClick={() => router.push('/event/find-face')}
                    />
                    <ActionCard
                        icon={<IconAdd />}
                        title="Contribute to Event"
                        description="Upload images or use your camera."
                        onClick={() => router.push('/event/contribute')}
                    />
                </main>
            </div>
        </PaperBackground>
    );
}
