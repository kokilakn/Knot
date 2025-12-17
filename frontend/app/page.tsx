'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import PaperBackground from '@/components/PaperBackground';

interface HealthResponse {
  status: string;
  timestamp: string;
}

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calls the backend health check endpoint
   * This demonstrates the frontend-backend communication
   */
  const checkBackendHealth = async () => {
    setLoading(true);
    setError(null);
    setHealth(null);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBaseUrl}/api/health`);

      if (!response.ok) {
        throw new Error(`Backend returned status ${response.status}`);
      }

      const data: HealthResponse = await response.json();
      setHealth(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect to backend'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PaperBackground>
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Header Section */}
          <header className={styles.header}>
            <h1 className={styles.title}>Knot</h1>
            <p className={styles.tagline}>Find Yourself in Every Photo</p>
          </header>

          {/* Description Section */}
          <section className={styles.description}>
            <p>
              Welcome to Knot, your intelligent photo organization companion.
              Organize your photo library and discover moments with face recognition.
            </p>
          </section>

          {/* Health Check Section */}
          <section className={styles.healthCheck}>
            <h2>Backend Status</h2>
            <button
              onClick={checkBackendHealth}
              disabled={loading}
              className={styles.button}
            >
              {loading ? 'Checking...' : 'Check Backend Health'}
            </button>

            {/* Status Display */}
            {health && (
              <div className={styles.success}>
                <p>✓ Backend is running</p>
                <p>Status: {health.status}</p>
                <p>Time: {new Date(health.timestamp).toLocaleString()}</p>
              </div>
            )}

            {error && <div className={styles.error}>✗ Error: {error}</div>}
          </section>

          {/* Future Features Preview */}
          <section className={styles.features}>
            <h2>Coming Soon</h2>
            <ul>
              <li>Face recognition and tagging</li>
              <li>Photo search by face</li>
              <li>Album organization</li>
              <li>Cloud storage integration</li>
            </ul>
          </section>
        </div>
      </main>
    </PaperBackground>
  );
}
