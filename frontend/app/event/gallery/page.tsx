'use client';

import React from 'react';
import styles from './gallery.module.css';
import PaperBackground from '@/components/PaperBackground';
import Link from 'next/link';

const sampleImages = [
    'https://picsum.photos/seed/wedding1/400/400',
    'https://picsum.photos/seed/wedding2/400/400',
    'https://picsum.photos/seed/wedding3/400/400',
    'https://picsum.photos/seed/wedding4/400/400',
    'https://picsum.photos/seed/wedding5/400/400',
    'https://picsum.photos/seed/wedding6/400/400',
];

export default function GalleryPage() {
    return (
        <PaperBackground>
            <div className={styles.container}>
                <header className={styles.header}>
                    <Link href="/event" className={styles.iconBtn} aria-label="Back to Event">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <h1 className={styles.title}>Gallery</h1>
                </header>

                <div className={styles.grid}>
                    {sampleImages.map((src, index) => (
                        <div key={index} className={styles.imageCard}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt={`Gallery item ${index + 1}`} className={styles.image} />
                        </div>
                    ))}
                </div>
            </div>
        </PaperBackground>
    );
}
