'use client';

import PaperBackground from '@/components/PaperBackground';
import { Button, Spinner } from '@/components/ui';
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
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess('Password updated successfully!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                // Redirect after a short delay
                setTimeout(() => {
                    router.push('/profile');
                }, 1500);
            } else {
                setError(data.error || 'Failed to update password');
            }
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PaperBackground>
            <div className={styles.container}>
                <header className={styles.header}>
                    <Link href="/profile" className={styles.iconBtn} aria-label="Back">
                        <IconBack />
                    </Link>
                </header>

                <main className={styles.main}>
                    <div className={styles.animateFadeIn}>
                        <h1 className={styles.pageTitle}>Security</h1>
                        <p className={styles.pageSubtitle}>Update your password to keep your account safe.</p>

                        <form className={styles.form} onSubmit={handleSubmit}>
                            {error && <div className={styles.error}>{error}</div>}
                            {success && <div className={styles.success}>{success}</div>}

                            <div className={styles.fieldGroup}>
                                <input
                                    id="current-password"
                                    type="password"
                                    className={styles.input}
                                    placeholder=" "
                                    required
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
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
                                    minLength={6}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
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
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                                    {isLoading ? (
                                        <>
                                            <Spinner size="sm" color="paper" />
                                            <span>Updating...</span>
                                        </>
                                    ) : (
                                        'Update Password'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </PaperBackground>
    );
}

