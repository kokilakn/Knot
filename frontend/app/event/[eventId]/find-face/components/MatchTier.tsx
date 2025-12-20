import React from 'react';
import styles from '../find-face.module.css';
import { getPhotoUrl } from '@/hooks/usePhotoUrl';

interface Match {
    id: string;
    link: string;
    distance: number;
    uploaderId?: string | null;
    eventCreatorId?: string | null;
}

interface MatchTierProps {
    title: string;
    matches: Match[];
    selectedIds: Set<string>;
    isSelectMode: boolean;
    onPhotoClick: (photo: Match) => void;
    onPointerDown: (id: string, selected: boolean) => void;
    onPointerEnter: (id: string) => void;
    onToggleAll: (ids: string[], select: boolean) => void;
}

export const MatchTier = ({
    title,
    matches,
    selectedIds,
    isSelectMode,
    onPhotoClick,
    onPointerDown,
    onPointerEnter,
    onToggleAll
}: MatchTierProps) => {
    if (matches.length === 0) return null;

    return (
        <section className={styles.tierSection}>
            <div className={styles.tierTitle}>
                <h3>{title}</h3>
                {isSelectMode && (
                    <button
                        className={styles.tierBtn}
                        onClick={() => {
                            const allSelected = matches.every(m => selectedIds.has(m.id));
                            onToggleAll(matches.map(m => m.id), !allSelected);
                        }}
                    >
                        {matches.every(m => selectedIds.has(m.id)) ? 'Unselect All' : 'Select All'}
                    </button>
                )}
            </div>
            <div className={styles.resultsGrid}>
                {matches.map((photo) => {
                    const isSelected = selectedIds.has(photo.id);
                    return (
                        <div
                            key={photo.id}
                            className={`${styles.resultCard} ${isSelected ? styles.selected : ''} ${isSelectMode ? styles.selecting : ''}`}
                            onClick={() => !isSelectMode && onPhotoClick(photo)}
                            onPointerDown={() => isSelectMode && onPointerDown(photo.id, isSelected)}
                            onPointerEnter={() => onPointerEnter(photo.id)}
                        >
                            {isSelectMode && <div className={styles.selectionOverlay} />}
                            <img src={getPhotoUrl(photo.link)} alt="Match" className={styles.resultImg} loading="lazy" />
                        </div>
                    );
                })}
            </div>
        </section>
    );
};
