import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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

    // History
    history: ScheduleHistory;
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
                set((state) => ({
                    schedule,
                    weeklySchedules: schedule ? { ...state.weeklySchedules, [weekId]: schedule } : state.weeklySchedules,
                    history: { ...state.history, present: schedule }
                }));
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
                history: { past: [], present: null, future: [] }
            }),

            history: {
                past: [],
                present: null,
                future: []
            },

            canUndo: false,
            canRedo: false,

            pushToHistory: (newSchedule) => set((state) => {
                const { past, present } = state.history;
                const date = new Date(state.selectedDate);
                const weekId = getWeekId(date);

                // Get edit scope from UI store
                const editScope = useUIStore.getState().scheduleEditScope;

                // If history.present is lost (rehydration), use current schedule state
                const effectivePresent = present || state.schedule;

                if (!effectivePresent) {
                    if (editScope === 'template') {
                        return {
                            schedule: newSchedule,
                            history: { past: [], present: newSchedule, future: [] }
                        };
                    } else {
                        return {
                            weeklySchedules: { ...state.weeklySchedules, [weekId]: newSchedule },
                            history: { past: [], present: newSchedule, future: [] }
                        };
                    }
                }

                const newPast = [...past, effectivePresent];
                // Limit history size to 50
                if (newPast.length > 50) newPast.shift();

                if (editScope === 'template') {
                    // Template mode: update base schedule (affects all weeks)
                    return {
                        schedule: newSchedule,
                        history: {
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
                        history: {
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
                const { past, present, future } = state.history;
                // console.log("Undoing. Past size:", past.length);
                if (past.length === 0) return state;

                const previous = past[past.length - 1];
                const newPast = past.slice(0, past.length - 1);

                return {
                    schedule: previous,
                    history: {
                        past: newPast,
                        present: previous,
                        future: [present!, ...future]
                    },
                    canUndo: newPast.length > 0,
                    canRedo: true
                };
            }),

            redo: () => set((state) => {
                const { past, present, future } = state.history;
                if (future.length === 0) return state;

                const next = future[0];
                const newFuture = future.slice(1);

                return {
                    schedule: next,
                    history: {
                        past: [...past, present!],
                        present: next,
                        future: newFuture
                    },
                    canUndo: true,
                    canRedo: newFuture.length > 0
                };
            })
        }),
        {
            name: 'school_os_schedule',
            storage: createJSONStorage(() => localStorage),
            // Removed partialize to persist EVERYTHING including history
        }
    )
);
