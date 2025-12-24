'use client';

import PaperBackground from '@/components/PaperBackground';
import ActionCard from '@/components/dashboard/ActionCard';
import { Spinner } from '@/components/ui';
import { PageTransition } from '@/components/shared/PageTransition';
import styles from './dashboard.module.css';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/lib/UserContext';
import { useEffect, useState } from 'react';

// ... (icons and helpers stay the same, I will use a StartLine valid for the returns)

function IconPlus() {
  // ...
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

// Generate a DiceBear avatar URL from email
// Generate a DiceBear avatar URL from email
function generateAvatarUrl(email: string): string {
  const seed = encodeURIComponent(email);
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=5F6F82&textColor=F6F3EF`;
}

// Get greeting based on time of day
// Get greeting based on time of day
function getGreeting(name?: string): string {
  const hour = new Date().getHours();
  let timeGreeting = '';
  if (hour < 12) timeGreeting = 'Good morning';
  else if (hour < 17) timeGreeting = 'Good afternoon';
  else timeGreeting = 'Good evening';

  return name ? `Hello, ${name}` : timeGreeting;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [eventsCount, setEventsCount] = useState<number | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    const fetchEventsCount = async () => {
      try {
        const res = await fetch('/api/events');
        if (res.ok) {
          const data = await res.json();
          setEventsCount(data.events?.length || 0);
        }
      } catch {
        // Silently fail, will show default
      } finally {
        setEventsLoading(false);
      }
    };

    if (user) {
      fetchEventsCount();
    }
  }, [user]);

  // Show nothing while loading/redirecting
  if (loading || !user) {
    return (
      <div className={styles.container} style={{ justifyContent: 'center', alignItems: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Spinner size="lg" color="accent" />
        <p style={{ color: 'var(--text-subtle)' }}>Loading...</p>
      </div>
    );
  }

  const avatarUrl = user.avatarUrl || generateAvatarUrl(user.email);
  const eventsDescription = eventsLoading
    ? 'Loading...'
    : eventsCount === 0
      ? 'No events yet'
      : `${eventsCount} event${eventsCount === 1 ? '' : 's'} • Ongoing`;

  return (
    <PaperBackground>
      <PageTransition>
        <div className={styles.container}>
          <header className={styles.header}>
            <h1 className={styles.logo}>Knot</h1>
            <div className={styles.headerActions}>
              <Link href="/profile" className={styles.avatar}>
                <img
                  src={avatarUrl}
                  alt="User avatar"
                />
              </Link>
            </div>
          </header>

          <section className={`${styles.greeting} animate-fade-in animate-delay-1`}>
            <p className={styles.greetingTime}>{getGreeting(user?.name?.split(' ')[0])}</p>
            <h2 className={styles.greetingMessage}>
              Find yourself in<br />
              <span className={styles.greetingHighlight}>every photo.</span>
            </h2>
          </section>

          <main className={styles.main}>
            <div className="animate-fade-in animate-delay-2">
              <ActionCard
                icon={<IconPlus />}
                title="Create an Event"
                description="Start a new shared album"
                onClick={() => router.push('/create-event')}
              />
            </div>
            <div className="animate-fade-in animate-delay-3">
              <ActionCard
                icon={<IconQR />}
                title="Join an Event"
                description="Scan or enter a code"
                onClick={() => router.push('/join-event')}
              />
            </div>
            <div className="animate-fade-in animate-delay-4">
              <ActionCard
                icon={<IconAlbum />}
                title="My Events"
                description={eventsDescription}
                onClick={() => router.push('/events')}
              />
            </div>
          </main>
        </div>
      </PageTransition>
    </PaperBackground>
  );
}

