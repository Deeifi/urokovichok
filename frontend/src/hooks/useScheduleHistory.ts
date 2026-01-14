import { useState, useCallback } from 'react';
import type { ScheduleResponse } from '../types';

export const useScheduleHistory = (initialSchedule: ScheduleResponse | null) => {
    const [schedule, setSchedule] = useState<ScheduleResponse | null>(initialSchedule);
    const [history, setHistory] = useState<ScheduleResponse[]>([]);

    const pushToHistory = useCallback((currentState: ScheduleResponse) => {
        setHistory(prev => [JSON.parse(JSON.stringify(currentState)), ...prev].slice(0, 10));
    }, []);

    const handleUndo = useCallback(() => {
        if (history.length === 0) return;
        const nextState = history[0];
        setSchedule(nextState);
        setHistory(prev => prev.slice(1));
    }, [history]);

    return {
        schedule,
        setSchedule,
        history,
        pushToHistory,
        handleUndo
    };
};
