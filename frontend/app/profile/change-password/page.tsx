'use client';

import PaperBackground from '@/components/PaperBackground';
import { Button } from '@/components/ui';
import styles from './change-password.module.css';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

function IconBack() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export default function ChangePasswordPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        setIsLoading(false);
        router.push('/profile');
    };

    return (
        <PaperBackground>
            <div className={styles.container}>
                <header className={styles.header}>
                    <Link href="/profile" className={styles.iconBtn} aria-label="Back">
                        <IconBack />
                    </Link>
                </header>

                <main className={styles.animateFadeIn}>
                    <h1 className={styles.pageTitle}>Security</h1>
                    <p className={styles.pageSubtitle}>Update your password to keep your account safe.</p>

                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.fieldGroup}>
                            <input
                                id="current-password"
                                type="password"
                                className={styles.input}
                                placeholder=" "
                                required
                            />
                            <label className={styles.label} htmlFor="current-password">Current Password</label>
                        </div>

                        <div className={styles.fieldGroup}>
                            <input
                                id="new-password"
                                type="password"
                                className={styles.input}
                                placeholder=" "
                                required
                            />
                            <label className={styles.label} htmlFor="new-password">New Password</label>
                        </div>

                        <div className={styles.fieldGroup}>
                            <input
                                id="confirm-password"
                                type="password"
                                className={styles.input}
                                placeholder=" "
                                required
                            />
                            <label className={styles.label} htmlFor="confirm-password">Confirm New Password</label>
                        </div>

                        <div className={styles.footer}>
                            <Button
                                type="submit"
                                variant="primary"
                                color="logo"
                                size="lg"
                                fullWidth
                                disabled={isLoading}
                            >
                                {isLoading ? 'Updating...' : 'Update Password'}
                            </Button>
                        </div>
                    </form>
                </main>
            </div>
        </PaperBackground>
    );
}
