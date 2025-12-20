import React from 'react';
import styles from './Spinner.module.css';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: 'accent' | 'ink' | 'paper' | 'logo';
    className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
    size = 'md',
    color = 'accent',
    className = '',
}) => {
    const classNames = [
        styles.spinner,
        styles[`spinner--${size}`],
        styles[`spinner--color-${color}`],
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={classNames} role="status">
            {/* K-branded spinner with rotating ring and pulsing K */}
            <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" className={styles.spinner__svg}>
                {/* Outer rotating ring */}
                <circle
                    cx="25"
                    cy="25"
                    r="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className={styles.spinner__ring}
                    opacity="0.2"
                />
                {/* Animated arc */}
                <circle
                    cx="25"
                    cy="25"
                    r="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className={styles.spinner__arc}
                />
                {/* Center K letter */}
                <text
                    x="25"
                    y="33"
                    textAnchor="middle"
                    className={styles.spinner__letter}
                    fill="currentColor"
                >
                    K
                </text>
            </svg>
            <span className={styles.srOnly}>Loading...</span>
        </div>
    );
};

export default Spinner;


