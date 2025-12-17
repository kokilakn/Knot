'use client';
import { Button } from '@/components/ui';
import styles from './LoginForm.module.css';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/dashboard');
  };

  return (
    <form className={styles.form} autoComplete="off" onSubmit={handleSubmit}>
      <div className={styles.fieldGroup}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={styles.input}
          placeholder=" "
        />
        <label htmlFor="email" className={styles.label}>Email Address</label>
      </div>
      <div className={styles.fieldGroup}>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={styles.input}
          placeholder=" "
        />
        <label htmlFor="password" className={styles.label}>Password</label>
      </div>
      <div className={styles.actionRow}>
        <Button type="submit" variant="primary" color="logo" size="lg" fullWidth>
          Sign In
        </Button>
      </div>
    </form>
  );
}
