import React from 'react';
import styles from '../contribute.module.css';

interface FilmstripProps {
    photos: string[];
}

export const Filmstrip = ({ photos }: FilmstripProps) => {
    if (photos.length === 0) return null;

    return (
        <div className={styles.filmstrip}>
            {photos.map((photo, i) => (
                <div key={i} className={styles.filmstripItem}>
                    <img src={photo} alt="Captured" className={styles.filmstripImg} />
                </div>
            ))}
        </div>
    );
};
