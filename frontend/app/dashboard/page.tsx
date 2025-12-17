'use client';

import PaperBackground from '@/components/PaperBackground';
import ActionCard from '@/components/dashboard/ActionCard';
import styles from './dashboard.module.css';
import { useRouter } from 'next/navigation';

function IconPlus() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconQR() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 8V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16v2a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 4h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 20h2a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 12h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconAlbum() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z" fill="currentColor" opacity="0.5" />
      <path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4z" fill="currentColor" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconNotification() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconHome() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 12l9-8 9 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 001 1h12a1 1 0 001-1v-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  return (
    <PaperBackground>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.logo}>Knot</h1>
          <div className={styles.headerActions}>
            <button className={styles.iconBtn} aria-label="Notifications">
              <IconNotification />
            </button>
            <div className={styles.avatar}>
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
                alt="User avatar"
              />
            </div>
          </div>
        </header>

        <section className={styles.greeting}>
          <p className={styles.greetingTime}>Good afternoon</p>
          <h2 className={styles.greetingMessage}>
            Find yourself in<br />
            <span className={styles.greetingHighlight}>every photo.</span>
          </h2>
        </section>

        <main className={styles.main}>
          <ActionCard
            icon={<IconPlus />}
            title="Create an Event"
            description="Start a new shared album"
            onClick={() => router.push('/create-event')}
          />
          <ActionCard
            icon={<IconQR />}
            title="Join an Event"
            description="Scan or enter a code"
            onClick={() => router.push('/join-event')}
          />
          <ActionCard
            icon={<IconAlbum />}
            title="My Events"
            description="3 events • Ongoing"
            onClick={() => router.push('/events')}
          />
        </main>

        <nav className={styles.bottomNav} aria-label="Main navigation">
          <div className={styles.navPill}>
            <button className={`${styles.navBtn} ${styles.navBtnActive}`} aria-label="Home">
              <IconHome />
            </button>
            <button className={styles.navBtn} aria-label="Profile">
              <IconProfile />
            </button>
          </div>
        </nav>
      </div>
    </PaperBackground>
  );
}
