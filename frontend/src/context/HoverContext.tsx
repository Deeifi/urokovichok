import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { Lesson } from '../types';
import { debounce } from '../utils/debounce';

interface HoverContextType {
    hoveredLesson: Lesson | null;
    setHoveredLesson: (lesson: Lesson | null) => void;
}

const HoverContext = createContext<HoverContextType | undefined>(undefined);

export function HoverProvider({ children, disableHoverEffects = false }: { children: ReactNode, disableHoverEffects?: boolean }) {
    const [hoveredLesson, setHoveredLesson] = useState<Lesson | null>(null);

    const debouncedSetHoveredLesson = useCallback(
        debounce((lesson: Lesson | null) => {
            if (disableHoverEffects) {
                if (hoveredLesson !== null) setHoveredLesson(null);
                return;
            }
            setHoveredLesson(lesson);
        }, 75),
        [disableHoverEffects, hoveredLesson]
    );

    return (
        <HoverContext.Provider value={{ hoveredLesson, setHoveredLesson: debouncedSetHoveredLesson }}>
            {children}
        </HoverContext.Provider>
    );
}

export function useHover() {
    const context = useContext(HoverContext);
    if (context === undefined) {
        throw new Error('useHover must be used within a HoverProvider');
    }
    return context;
}
