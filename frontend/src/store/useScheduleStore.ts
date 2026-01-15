import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ScheduleResponse } from '../types';

interface ScheduleHistory {
    past: ScheduleResponse[];
    present: ScheduleResponse | null;
    future: ScheduleResponse[];
}

interface ScheduleState {
    schedule: ScheduleResponse | null;
    setSchedule: (schedule: ScheduleResponse | null) => void;

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
            setSchedule: (schedule) => set({ schedule, history: { ...get().history, present: schedule } }),

            history: {
                past: [],
                present: null,
                future: []
            },

            canUndo: false,
            canRedo: false,

            pushToHistory: (newSchedule) => set((state) => {
                const { past, present } = state.history;
                // If history.present is lost (rehydration), use current schedule state
                const effectivePresent = present || state.schedule;

                if (!effectivePresent) return {
                    schedule: newSchedule,
                    history: { past: [], present: newSchedule, future: [] }
                };

                const newPast = [...past, effectivePresent];
                // Limit history size to 50
                if (newPast.length > 50) newPast.shift();

                // console.log("Pushing to history. New Past Length:", newPast.length);
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
