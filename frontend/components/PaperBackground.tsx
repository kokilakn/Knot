import React from 'react';
import styles from '../styles/paperBackground.module.css';
import { getPhotoUrl } from '@/hooks/usePhotoUrl';

interface PaperBackgroundProps {
  children: React.ReactNode;
  coverPhotoUrl?: string | null;
}

export default function PaperBackground({ children, coverPhotoUrl }: PaperBackgroundProps) {
  return (
    <div className={styles.paperBackground}>
      {coverPhotoUrl && (
        <div
          className={styles.coverOverlay}
          style={{ backgroundImage: `url("${getPhotoUrl(coverPhotoUrl)}")` }}
        />
      )}
      {children}
    </div>
  );
}
