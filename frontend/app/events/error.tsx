'use client';

import { useEffect } from 'react';
import styles from './events.module.css';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Events page error:', error);
    }, [error]);

    return (
        <div className={styles.container} style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#dc3545' }}>Something went wrong!</h2>
                <p style={{ marginBottom: '1.5rem', color: 'var(--text-subtle)' }}>{error.message || "Failed to load events."}</p>
                <button
                    onClick={() => reset()}
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: 'var(--color-primary-dark)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '999px',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
