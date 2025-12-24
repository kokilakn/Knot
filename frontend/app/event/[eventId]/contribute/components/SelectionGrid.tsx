import React from 'react';
import styles from '../contribute.module.css';
import { IconUpload, IconCamera } from '@/components/shared/Icons';
import CameraIcon from '@mui/icons-material/Camera';

interface SelectionGridProps {
    onUploadClick: () => void;
    onCameraClick: () => void;
}

export const SelectionGrid = ({ onUploadClick, onCameraClick }: SelectionGridProps) => (
    <div className={styles.selectionGrid}>
        <button className={styles.optionCard} onClick={onUploadClick}>
            <span className={styles.optionIcon}><IconUpload /></span>
            <span className={styles.optionLabel}>Upload Photos</span>
        </button>
        <button className={styles.optionCard} onClick={onCameraClick}>
            <span className={styles.optionIcon}><IconCamera /></span>
            <span className={styles.optionLabel}>Use Camera</span>
        </button>
    </div>
);
