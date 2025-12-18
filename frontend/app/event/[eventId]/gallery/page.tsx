'use client';

import React, { useEffect, useState } from 'react';
import styles from './gallery.module.css';
import { Spinner } from '@/components/ui';
import PaperBackground from '@/components/PaperBackground';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function GalleryPage() {
    const params = useParams();
    const eventId = params.eventId as string;
    const [photos, setPhotos] = useState<string[]>([]);
    const [eventName, setEventName] = useState('Event');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!eventId) return;

        const fetchData = async () => {
            try {
                // Fetch event details for name
                const eventRes = await fetch(`/api/events/${eventId}`);
                const eventData = await eventRes.json();
                if (eventRes.ok) {
                    setEventName(eventData.event.name);
                }

                // Fetch photos
                const photosRes = await fetch(`/api/events/${eventId}/photos`);
                const photosData = await photosRes.json();
                if (photosRes.ok) {
                    setPhotos(photosData.photos || []);
                }
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [eventId]);

    return (
        <PaperBackground>
            <div className={styles.container}>
                <header className={styles.header}>
                    <Link href={`/event/${eventId}`} className={styles.iconBtn} aria-label="Back to Event">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <h1 className={styles.title}>{eventName} – Gallery</h1>
                </header>

                <div className={styles.grid}>
                    {loading && (
                        <div className={styles.loadingContainer}>
                            <Spinner size="lg" color="accent" />
                            <p className={styles.message}>Loading photos...</p>
                        </div>
                    )}
                    {!loading && photos.length === 0 && <p className={styles.message}>No photos yet.</p>}
                    {photos.map((src, index) => (
                        <div key={index} className={styles.imageCard}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} key={src} alt={`Gallery item ${index + 1}`} className={styles.image} />
                        </div>
                    ))}
                </div>
            </div>
        </PaperBackground>
    );
}
