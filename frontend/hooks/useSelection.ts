import { useState, useRef, useCallback, useEffect } from 'react';

export function useSelection() {
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDragging, setIsDragging] = useState(false);
    const [dragType, setDragType] = useState<'select' | 'unselect'>('select');
    const dragProcessedRef = useRef<Set<string>>(new Set());

    const toggleSelect = useCallback((id: string, forceState?: boolean) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            const newState = forceState !== undefined ? forceState : !next.has(id);
            if (newState) next.add(id);
            else next.delete(id);
            return next;
        });
    }, []);

    const handlePointerDown = useCallback((id: string, currentlySelected: boolean) => {
        if (!isSelectMode) return;
        setIsDragging(true);
        const nextState = !currentlySelected;
        setDragType(nextState ? 'select' : 'unselect');
        dragProcessedRef.current = new Set([id]);
        toggleSelect(id, nextState);
    }, [isSelectMode, toggleSelect]);

    const handlePointerEnter = useCallback((id: string) => {
        if (!isDragging || dragProcessedRef.current.has(id)) return;
        dragProcessedRef.current.add(id);
        toggleSelect(id, dragType === 'select');
    }, [isDragging, dragType, toggleSelect]);

    const resetSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    useEffect(() => {
        const handleGlobalPointerUp = () => {
            setIsDragging(false);
            dragProcessedRef.current.clear();
        };
        window.addEventListener('pointerup', handleGlobalPointerUp);
        return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
    }, []);

    return {
        isSelectMode,
        setIsSelectMode,
        selectedIds,
        setSelectedIds,
        isDragging,
        toggleSelect,
        handlePointerDown,
        handlePointerEnter,
        resetSelection
    };
}
