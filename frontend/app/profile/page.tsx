'use client';

import PaperBackground from '@/components/PaperBackground';
import styles from './profile.module.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function IconBack() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconChevronRight() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function IconLock() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    );
}

function IconLogout() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export default function ProfilePage() {
    const router = useRouter();

    const handleLogout = () => {
        // Implement logout logic here
        router.push('/login');
    };

    return (
        <PaperBackground>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <Link href="/dashboard" className={styles.iconBtn} aria-label="Back">
                            <IconBack />
                        </Link>
                        <span className={styles.logo}>Knot</span>
                    </div>
                </header>

                <main>
                    <section className={styles.profileHero}>
                        <div className={styles.avatarLarge}>
                            <img
                                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=240&h=240&fit=crop&crop=face"
                                alt="User avatar"
                            />
                        </div>
                        <h1 className={styles.userName}>Kokila Reddy</h1>
                        <p className={styles.userEmail}>kokila.reddy@example.com</p>
                    </section>

                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Security</h2>
                        <Link href="/profile/change-password" className={styles.menuItem}>
                            <div className={styles.menuItemContent}>
                                <div className={styles.menuItemIcon}><IconLock /></div>
                                <span className={styles.menuItemText}>Update Password</span>
                            </div>
                            <IconChevronRight />
                        </Link>
                    </div>

                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Account</h2>
                        <button
                            className={`${styles.menuItem} ${styles.logoutBtn}`}
                            onClick={handleLogout}
                        >
                            <div className={styles.menuItemContent}>
                                <div className={styles.menuItemIcon}><IconLogout /></div>
                                <span className={styles.menuItemText}>Logout</span>
                            </div>
                            <IconChevronRight />
                        </button>
                    </div>
                </main>
            </div>
        </PaperBackground>
    );
}
