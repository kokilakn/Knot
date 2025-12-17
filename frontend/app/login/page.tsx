import PaperBackground from '@/components/PaperBackground';
import GoogleButton from '@/components/shared/GoogleButton';
import LoginForm from '@/components/shared/LoginForm';
import GuestJoin from '@/components/shared/GuestJoin';
import styles from './login.module.css';

export default function LoginPage() {
  return (
    <PaperBackground>
      <div className={styles.centered}>
        <header className={`${styles.header} animate-fade-in`}>
          <h1 className={styles.logo}>Knot</h1>
          <p className={styles.tagline}>Find Yourself in Every Photo</p>
        </header>

        <div className={`${styles.actions} animate-fade-in animate-delay-1`}>
          <GoogleButton />
        </div>

        <div className={`${styles.divider} animate-fade-in animate-delay-2`}>
          <span className={styles.dividerText}>or</span>
        </div>

        <div className={`${styles.formWrapper} animate-fade-in animate-delay-3`}>
          <LoginForm />
        </div>

        <div className={`${styles.guestSection} animate-fade-in animate-delay-3`}>
          <GuestJoin />
        </div>

        <footer className={`${styles.footer} animate-fade-in animate-delay-4`}>
          <a href="#" className={styles.footerLink}>Forgot Password?</a>
          <a href="#" className={styles.footerLink}>Create Account</a>
        </footer>
      </div>
    </PaperBackground>
  );
}
