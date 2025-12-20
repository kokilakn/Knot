import React from 'react';
import styles from '../contribute.module.css';

interface IntervalSelectorProps {
    intervalSecs: number | null;
    customSecs: string;
    onSetInterval: (val: number | null) => void;
    onSetCustom: (val: string) => void;
}

export const IntervalSelector = ({
    intervalSecs,
    customSecs,
    onSetInterval,
    onSetCustom
}: IntervalSelectorProps) => (
    <div className={styles.intervalSection}>
        <div className={styles.intervalLabel}>Auto-Capture Interval:</div>
        <div className={styles.intervalSelector}>
            {[null, 5, 15, 30, 45, 60].map((val) => (
                <button
                    key={val ?? 'no'}
                    className={`${styles.intervalBtn} ${intervalSecs === val ? styles.active : ''}`}
                    onClick={() => onSetInterval(val)}
                >
                    {val === null ? 'None' : `${val}s`}
                </button>
            ))}
            <span className={styles.customLabel}>Custom</span>
            <div className={styles.customGroup}>
                <div className={styles.customInputWrapper}>
                    <input
                        type="text" inputMode="numeric" pattern="[0-9]*" className={styles.customInput}
                        value={customSecs}
                        onChange={(e) => onSetCustom(e.target.value.replace(/\D/g, ''))}
                        placeholder="0"
                    />
                    <span className={styles.unit}>s</span>
                </div>
            </div>
        </div>
    </div>
);
