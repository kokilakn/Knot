'use client';
import { Button, Spinner } from '@/components/ui';
import styles from './LoginForm.module.css';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useUser } from '@/lib/UserContext';

export default function LoginForm() {
  const router = useRouter();
  const { login, register } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (isRegister) {
        if (!name.trim()) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        result = await register(email, password, name);
      } else {
        result = await login(email, password);
      }

      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} autoComplete="off" onSubmit={handleSubmit}>
      {error && <div className={styles.error}>{error}</div>}

      {isRegister && (
        <div className={styles.fieldGroup}>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required={isRegister}
            className={styles.input}
            placeholder=" "
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label htmlFor="name" className={styles.label}>Full Name</label>
        </div>
      )}

      <div className={styles.fieldGroup}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={styles.input}
          placeholder=" "
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label htmlFor="email" className={styles.label}>Email Address</label>
      </div>
      <div className={styles.fieldGroup}>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
          className={styles.input}
          placeholder=" "
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <label htmlFor="password" className={styles.label}>Password</label>
      </div>
      <div className={styles.actionRow}>
        <Button type="submit" variant="primary" color="logo" size="lg" fullWidth disabled={loading}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Spinner size="sm" color="paper" />
              <span>Please wait...</span>
            </div>
          ) : (
            isRegister ? 'Create Account' : 'Sign In'
          )}
        </Button>
      </div>

      <button
        type="button"
        className={styles.toggleBtn}
        onClick={() => {
          setIsRegister(!isRegister);
          setError('');
        }}
      >
        {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
      </button>
    </form>
  );
}

