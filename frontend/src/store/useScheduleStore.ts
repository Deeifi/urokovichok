import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { indexedDBStorage } from '../utils/indexedDB';
import type { ScheduleResponse } from '../types';
import { getWeekId, getMonday } from '../utils/scheduleHelpers';
import { useUIStore } from './useUIStore';

interface ScheduleHistory {
    past: ScheduleResponse[];
    present: ScheduleResponse | null;
    future: ScheduleResponse[];
}

interface ScheduleState {
    schedule: ScheduleResponse | null;
    selectedDate: string; // ISO String of the Monday of the selected week
    weeklySchedules: Record<string, ScheduleResponse>; // key: YYYY-Www, value: schedule
    setSchedule: (schedule: ScheduleResponse | null) => void;

    // Date Management
    setCurrentDate: (date: Date) => void;
    resetWeekToTemplate: (weekId?: string) => void;
    clearAllSchedules: () => void;

    // History - separate for template and week editing
    templateHistory: ScheduleHistory;
    weekHistory: ScheduleHistory;
    pushToHistory: (newSchedule: ScheduleResponse) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

export const useScheduleStore = create<ScheduleState>()(
    persist(
        (set, get) => ({
            schedule: null,
            selectedDate: getMonday(new Date()).toISOString(),
            weeklySchedules: {},
            setSchedule: (schedule) => {
                const date = new Date(get().selectedDate);
                const weekId = getWeekId(date);
                const editScope = useUIStore.getState().scheduleEditScope;

                set((state) => {
                    if (editScope === 'template') {
                        // Template mode: update base schedule AND current week to make changes visible
                        return {
                            schedule,
                            weeklySchedules: schedule ? { ...state.weeklySchedules, [weekId]: schedule } : state.weeklySchedules,
                            templateHistory: { ...state.templateHistory, present: schedule }
                        };
                    } else {
                        // Week mode: update only current week's override
                        return {
                            weeklySchedules: schedule ? { ...state.weeklySchedules, [weekId]: schedule } : state.weeklySchedules,
                            weekHistory: { ...state.weekHistory, present: schedule }
                        };
                    }
                });
            },

            setCurrentDate: (date: Date) => {
                const monday = getMonday(date);

                set({
                    selectedDate: monday.toISOString(),
                });
            },

            resetWeekToTemplate: (weekId) => {
                const id = weekId || getWeekId(new Date(get().selectedDate));
                set((state) => {
                    const newWeekly = { ...state.weeklySchedules };
                    delete newWeekly[id];
                    return { weeklySchedules: newWeekly };
                });
            },

            clearAllSchedules: () => set({
                schedule: null,
                weeklySchedules: {},
                templateHistory: { past: [], present: null, future: [] },
                weekHistory: { past: [], present: null, future: [] }
            }),

            templateHistory: {
                past: [],
                present: null,
                future: []
            },

            weekHistory: {
                past: [],
                present: null,
                future: []
            },

            canUndo: false,
            canRedo: false,

            pushToHistory: (newSchedule) => set((state) => {
                const date = new Date(state.selectedDate);
                const weekId = getWeekId(date);

                // Get edit scope from UI store
                const editScope = useUIStore.getState().scheduleEditScope;

                // Select the correct history based on edit scope
                const history = editScope === 'template' ? state.templateHistory : state.weekHistory;
                const { past, present } = history;

                // If history.present is lost (rehydration), use current schedule state
                const effectivePresent = present || (editScope === 'template' ? state.schedule : state.weeklySchedules[weekId]);

                if (!effectivePresent) {
                    if (editScope === 'template') {
                        return {
                            schedule: newSchedule,
                            weeklySchedules: { ...state.weeklySchedules, [weekId]: newSchedule },
                            templateHistory: { past: [], present: newSchedule, future: [] },
                            canUndo: false,
                            canRedo: false
                        };
                    } else {
                        return {
                            weeklySchedules: { ...state.weeklySchedules, [weekId]: newSchedule },
                            weekHistory: { past: [], present: newSchedule, future: [] },
                            canUndo: false,
                            canRedo: false
                        };
                    }
                }

                const newPast = [...past, effectivePresent];
                // Limit history size to 50
                if (newPast.length > 50) newPast.shift();

                if (editScope === 'template') {
                    // Template mode: update base schedule (affects all weeks) AND current week override for visibility
                    return {
                        schedule: newSchedule,
                        weeklySchedules: { ...state.weeklySchedules, [weekId]: newSchedule },
                        templateHistory: {
                            past: newPast,
                            present: newSchedule,
                            future: []
                        },
                        canUndo: true,
                        canRedo: false
                    };
                } else {
                    // Week mode: update only this week's override
                    return {
                        weeklySchedules: { ...state.weeklySchedules, [weekId]: newSchedule },
                        weekHistory: {
                            past: newPast,
                            present: newSchedule,
                            future: []
                        },
                        canUndo: true,
                        canRedo: false
                    };
                }
            }),

            undo: () => set((state) => {
                const date = new Date(state.selectedDate);
                const weekId = getWeekId(date);
                const editScope = useUIStore.getState().scheduleEditScope;

                // Select the correct history based on edit scope
                const history = editScope === 'template' ? state.templateHistory : state.weekHistory;
                const { past, present, future } = history;

                if (past.length === 0) return state;

                const previous = past[past.length - 1];
                const newPast = past.slice(0, past.length - 1);
                const newHistory = {
                    past: newPast,
                    present: previous,
                    future: [present!, ...future]
                };

                if (editScope === 'template') {
                    return {
                        schedule: previous,
                        weeklySchedules: { ...state.weeklySchedules, [weekId]: previous },
                        templateHistory: newHistory,
                        canUndo: newPast.length > 0,
                        canRedo: true
                    };
                } else {
                    return {
                        weeklySchedules: { ...state.weeklySchedules, [weekId]: previous },
                        weekHistory: newHistory,
                        canUndo: newPast.length > 0,
                        canRedo: true
                    };
                }
            }),

            redo: () => set((state) => {
                const date = new Date(state.selectedDate);
                const weekId = getWeekId(date);
                const editScope = useUIStore.getState().scheduleEditScope;

                // Select the correct history based on edit scope
                const history = editScope === 'template' ? state.templateHistory : state.weekHistory;
                const { past, present, future } = history;

                if (future.length === 0) return state;

                const next = future[0];
                const newFuture = future.slice(1);
                const newHistory = {
                    past: [...past, present!],
                    present: next,
                    future: newFuture
                };

                if (editScope === 'template') {
                    return {
                        schedule: next,
                        weeklySchedules: { ...state.weeklySchedules, [weekId]: next },
                        templateHistory: newHistory,
                        canUndo: true,
                        canRedo: newFuture.length > 0
                    };
                } else {
                    return {
                        weeklySchedules: { ...state.weeklySchedules, [weekId]: next },
                        weekHistory: newHistory,
                        canUndo: true,
                        canRedo: newFuture.length > 0
                    };
                }
            })
        }),
        {
            name: 'school_os_schedule',
            storage: createJSONStorage(() => indexedDBStorage),
            // Removed partialize to persist EVERYTHING including history
        }
    )
);
