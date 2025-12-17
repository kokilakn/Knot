import React from 'react';
import styles from '../styles/paperBackground.module.css';

export default function PaperBackground({ children }: { children: React.ReactNode }) {
  return <div className={styles.paperBackground}>{children}</div>;
}
