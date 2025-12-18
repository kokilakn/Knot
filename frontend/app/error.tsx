'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('App error:', error);
    }, [error]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: '1.5rem',
            color: 'var(--text-primary)',
            padding: '2rem',
            textAlign: 'center'
        }}>
            <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)' }}>Something went wrong</h2>
            <p style={{ color: 'var(--text-subtle)' }}>{error.message || "An unexpected error occurred."}</p>
            <Button
                variant="primary"
                onClick={() => reset()}
            >
                Try again
            </Button>
        </div>
    );
}
