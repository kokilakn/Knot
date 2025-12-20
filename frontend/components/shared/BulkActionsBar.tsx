import React from 'react';
import styles from './BulkActionsBar.module.css';
import { IconDownload, IconDelete } from './Icons';

interface BulkActionsBarProps {
    count: number;
    canDelete: boolean;
    onDownload: () => void;
    onDelete: () => void;
}

export const BulkActionsBar = ({ count, canDelete, onDownload, onDelete }: BulkActionsBarProps) => {
    if (count === 0) return null;

    return (
        <div className={styles.container}>
            <span className={styles.info}>{count} selected</span>
            <div className={styles.actions}>
                <button className={`${styles.btn} ${styles.download}`} onClick={onDownload}>
                    <IconDownload /><span>Download</span>
                </button>
                {canDelete && (
                    <button className={`${styles.btn} ${styles.delete}`} onClick={onDelete}>
                        <IconDelete /><span>Delete</span>
                    </button>
                )}
            </div>
        </div>
    );
};
