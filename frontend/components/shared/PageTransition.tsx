'use client';

import React from 'react';
import styles from './PageTransition.module.css';

interface PageTransitionProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * PageTransition - Wraps page content with smooth entrance animation.
 * Provides consistent page-level transitions across the application.
 * 
 * Usage:
 * <PageTransition>
 *   <YourPageContent />
 * </PageTransition>
 */
export function PageTransition({ children, className = '' }: PageTransitionProps) {
    return (
        <div className={`${styles.pageTransition} ${className}`}>
            {children}
        </div>
    );
}

export default PageTransition;
