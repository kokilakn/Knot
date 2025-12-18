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
            <svg
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                className={styles.spinner__svg}
            >
                <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className={styles.spinner__circle}
                />
            </svg>
            <span className={styles.srOnly}>Loading...</span>
        </div>
    );
};

export default Spinner;
