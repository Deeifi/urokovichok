import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ScheduleResponse, Lesson } from '../types';

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
                if (!present) return {
                    schedule: newSchedule,
                    history: { past: [], present: newSchedule, future: [] }
                };

                const newPast = [...past, present];
                // Limit history size to 50
                if (newPast.length > 50) newPast.shift();

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
            partialize: (state) => ({
                schedule: state.schedule,
                // We might not want to persist huge history arrays across reloads
                // or maybe we do? Let's keep it simple for now and persist everything.
            }),
        }
    )
);
