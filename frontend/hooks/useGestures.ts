import { useState } from 'react';

interface UseGesturesProps {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    minDistance?: number;
}

export function useGestures({ onSwipeLeft, onSwipeRight, minDistance = 50 }: UseGesturesProps) {
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;

        if (distance > minDistance && onSwipeLeft) {
            onSwipeLeft();
        } else if (distance < -minDistance && onSwipeRight) {
            onSwipeRight();
        }
    };

    return {
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd
    };
}
