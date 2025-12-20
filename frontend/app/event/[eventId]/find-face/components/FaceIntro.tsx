import React from 'react';
import styles from '../find-face.module.css';
import { IconUpload, IconCamera } from '@/components/shared/Icons';

interface FaceIntroProps {
    onUploadClick: () => void;
    onCameraClick: () => void;
}

export const FaceIntro = ({ onUploadClick, onCameraClick }: FaceIntroProps) => (
    <div className={`${styles.introCard} paper-texture`}>
        <div className={styles.introHeader}>
            <div className={styles.introIconWrapper}>
                <span className={`material-symbols-outlined ${styles.introIcon}`}>face</span>
            </div>
            <h2>Find Photos of You</h2>
            <p className={styles.introText}>We will scan all photos in this event to find every moment you were captured in.</p>
        </div>
        <div className={styles.introOptions}>
            <button className={styles.optionCard} onClick={onCameraClick}>
                <div className={styles.optionIcon}><IconCamera /></div>
                <div className={styles.optionContent}>
                    <span className={styles.optionLabel}>Camera</span>
                    <span className={styles.optionDesc}>Take a quick selfie</span>
                </div>
            </button>
            <button className={styles.optionCard} onClick={onUploadClick}>
                <div className={styles.optionIcon}><IconUpload /></div>
                <div className={styles.optionContent}>
                    <span className={styles.optionLabel}>Upload</span>
                    <span className={styles.optionDesc}>From your gallery</span>
                </div>
            </button>
        </div>
        <p className={styles.privacyNote}>
            <span className="material-symbols-outlined">lock</span>
            We don't store your face data after the search
        </p>
    </div>
);
