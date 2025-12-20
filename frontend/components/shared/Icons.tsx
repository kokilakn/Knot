import React from 'react';

export const IconClose = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const IconDownload = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const IconDelete = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const IconChevron = ({ direction }: { direction: 'left' | 'right' | 'up' | 'down' }) => {
    const rotation = {
        left: 'rotate(0deg)',
        right: 'rotate(180deg)',
        up: 'rotate(90deg)',
        down: 'rotate(270deg)',
    }[direction];

    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ transform: rotation }}>
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

export const IconBack = () => (
    <span className="material-symbols-outlined">arrow_back</span>
);

export const IconFlipCamera = () => (
    <span className="material-symbols-outlined">flip_camera_ios</span>
);

export const IconCamera = () => (
    <span className="material-symbols-outlined">photo_camera</span>
);

export const IconUpload = () => (
    <span className="material-symbols-outlined">upload_file</span>
);
