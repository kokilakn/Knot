'use client';

import PaperBackground from '@/components/PaperBackground';
import { Button } from '@/components/ui';
import { PageTransition } from '@/components/shared/PageTransition';
import styles from './create-event.module.css';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Icons
function IconBack() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconMore() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12h.01M12 12h.01M19 12h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconCalendar() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5" />
            <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    );
}

function IconAddPhoto() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" fill="currentColor" />
            <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12 11v6M9 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function IconRemove() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

export default function CreateEventPage() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [photo, setPhoto] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [dateValue, setDateValue] = useState('');
    const [isDateFocused, setIsDateFocused] = useState(false);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddPhotoClick = () => {
        if (photo) return;
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0]) {
            const newPhotoUrl = URL.createObjectURL(files[0]);
            setPhoto(newPhotoUrl);
            setFile(files[0]);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemovePhoto = () => {
        if (photo) URL.revokeObjectURL(photo);
        setPhoto(null);
        setFile(null);
    };

    const openDatePicker = () => {
        const input = document.getElementById('event-date') as HTMLInputElement | null;
        if (!input) return;
        try {
            if (typeof (input as any).showPicker === 'function') {
                (input as any).showPicker();
            } else {
                input.focus();
            }
        } catch (error) {
            input.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!title.trim()) {
            setError('Please enter a title');
            setLoading(false);
            return;
        }

        if (!dateValue) {
            setError('Please select a date');
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('name', title.trim());
            formData.append('eventDate', dateValue);
            formData.append('notes', notes.trim());
            if (file) {
                formData.append('coverPhoto', file);
            }

            const res = await fetch('/api/events', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                router.push(`/event/${data.event.code}`);
            } else {
                setError(data.error || 'Failed to create event');
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PaperBackground>
            <PageTransition>
                <div className={styles.container}>
                    {/* Header */}
                    <header className={styles.header}>
                        <div className={styles.headerLeft}>
                            <Link href="/dashboard" className={styles.iconBtn} aria-label="Back">
                                <IconBack />
                            </Link>
                            <span className={styles.headerTitle}>Knot</span>
                        </div>
                        <button className={styles.iconBtn} aria-label="More options" style={{ opacity: 0, cursor: 'default' }}>
                            <IconMore />
                        </button>
                    </header>

                    {/* Main Content */}
                    <main className={styles.main}>
                        <div className={`${styles.titleSection} animate-fade-in`}>
                            <h1 className={styles.pageTitle}>New<br />Event</h1>
                            <p className={styles.pageSubtitle}>Start a new chapter in your story.</p>
                        </div>

                        <form className={styles.form} onSubmit={handleSubmit}>
                            {error && <div className={styles.error}>{error}</div>}

                            {/* Title Input - Floating Label */}
                            <div className={`${styles.fieldGroup} animate-fade-in animate-delay-1`}>
                                <input
                                    id="event-name"
                                    type="text"
                                    className={styles.input}
                                    placeholder=" "
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                                <label className={styles.label} htmlFor="event-name">Title</label>
                            </div>

                            <div className={`${styles.fieldGroup} animate-fade-in animate-delay-2`}>
                                <div
                                    className={styles.inputWrapper}
                                    onClick={openDatePicker}
                                    style={{ cursor: 'pointer' }}
                                    data-has-value={!!dateValue}
                                >
                                    <input
                                        id="event-date"
                                        type="date"
                                        className={styles.inputDate}
                                        style={{ color: (dateValue || isDateFocused) ? 'var(--text-primary)' : 'transparent' }}
                                        value={dateValue}
                                        onChange={(e) => setDateValue(e.target.value)}
                                        onFocus={() => setIsDateFocused(true)}
                                        onBlur={() => setIsDateFocused(false)}
                                        required
                                    />
                                    <div className={styles.calendarIcon}>
                                        <IconCalendar />
                                    </div>
                                </div>
                                <label className={styles.label} htmlFor="event-date">Date</label>
                            </div>

                            {/* Notes Input - Textarea with Label (Simulated floating or static) */}
                            <div className={`${styles.fieldGroup} animate-fade-in animate-delay-3`}>
                                <textarea
                                    id="event-desc"
                                    className={styles.textarea}
                                    placeholder=" "
                                    rows={4}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                ></textarea>
                                <label className={styles.label} htmlFor="event-desc">Notes <span style={{ textTransform: 'none', fontStyle: 'italic', opacity: 0.7 }}>(Optional)</span></label>
                            </div>

                            {/* Cover Photo Selection */}
                            <div className={`${styles.fieldGroup} animate-fade-in animate-delay-4`}>
                                <label className={styles.labelFixed} style={{ position: 'relative', marginBottom: '8px', display: 'block', top: 'auto', left: 'auto' }}>Cover Photo</label>
                                <div className={styles.photoRow}>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />

                                    {!photo && (
                                        <button type="button" className={styles.addBtn} onClick={handleAddPhotoClick}>
                                            <div className={styles.addBtnIcon}><IconAddPhoto /></div>
                                            <span className={styles.addBtnText}>Add</span>
                                        </button>
                                    )}

                                    {photo && (
                                        <div className={styles.photoOption}>
                                            <img
                                                src={photo}
                                                alt="Cover preview"
                                                className={styles.photoImg}
                                            />
                                            <div
                                                className={styles.removeOverlay}
                                                onClick={handleRemovePhoto}
                                                title="Remove photo"
                                                role="button"
                                            >
                                                <IconRemove />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className={`${styles.footer} animate-fade-in animate-delay-4`}>
                                <Button type="submit" variant="primary" color="logo" size="lg" fullWidth disabled={loading}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {loading ? 'Creating...' : 'Create Event'} {!loading && <IconArrowRight />}
                                    </span>
                                </Button>
                            </div>

                        </form>
                    </main>
                </div>
            </PageTransition>
        </PaperBackground>
    );
}

