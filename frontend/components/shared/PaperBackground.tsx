import styles from './PaperBackground.module.css';
import { ReactNode } from 'react';

interface PaperBackgroundProps {
  children: ReactNode;
  className?: string;
}

export default function PaperBackground({ children, className = '' }: PaperBackgroundProps) {
  return (
    <div className={`${styles.paper} ${className}`}>
      {children}
    </div>
  );
}
