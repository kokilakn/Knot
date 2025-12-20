import React from 'react';
import styles from '../gallery.module.css';
import { IconDownload, IconDelete } from '@/components/shared/Icons';

interface BulkActionsBarProps {
    count: number;
    canDelete: boolean;
    onDownload: () => void;
    onDelete: () => void;
}

export const BulkActionsBar = ({ count, canDelete, onDownload, onDelete }: BulkActionsBarProps) => {
    if (count === 0) return null;

    return (
        <div className={styles.bulkActionsBar}>
            <span className={styles.selectionInfo}>{count} selected</span>
            <div style={{ display: 'flex', gap: '8px' }}>
                <button className={`${styles.bulkBtn} ${styles.bulkBtnDownload}`} onClick={onDownload}>
                    <IconDownload /><span>Download</span>
                </button>
                {canDelete && (
                    <button className={`${styles.bulkBtn} ${styles.bulkBtnDelete}`} onClick={onDelete}>
                        <IconDelete /><span>Delete</span>
                    </button>
                )}
            </div>
        </div>
    );
};
