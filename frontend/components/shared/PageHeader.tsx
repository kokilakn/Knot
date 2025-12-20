import React from 'react';
import Link from 'next/link';
import { IconBack } from './Icons';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
    title: string;
    backHref?: string;
    onBack?: () => void;
    actions?: React.ReactNode;
    scrolled?: boolean;
    className?: string;
}

export const PageHeader = ({ title, backHref, onBack, actions, scrolled, className = '' }: PageHeaderProps) => {
    return (
        <header className={`${styles.header} ${scrolled ? styles.scrolled : ''} ${className}`}>
            {backHref ? (
                <Link href={backHref} className={styles.iconBtn} aria-label="Back">
                    <IconBack />
                </Link>
            ) : onBack ? (
                <button onClick={onBack} className={styles.iconBtn} aria-label="Back">
                    <IconBack />
                </button>
            ) : null}

            <h1 className={styles.title}>{title}</h1>

            {actions && <div className={styles.headerActions}>{actions}</div>}
        </header>
    );
};
