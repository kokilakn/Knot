'use client';
import { Button } from '@/components/ui';
import styles from './LoginForm.module.css';

export default function LoginForm() {
  return (
    <form className={styles.form} autoComplete="off" onSubmit={e => e.preventDefault()}>
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
