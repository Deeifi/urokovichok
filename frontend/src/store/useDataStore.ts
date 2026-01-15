import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { INITIAL_DATA } from '../initialData';
import type { ScheduleRequest } from '../types';

interface DataState {
    data: ScheduleRequest;
    setData: (data: ScheduleRequest | ((prev: ScheduleRequest) => ScheduleRequest)) => void;
    resetData: () => void;
}

export const useDataStore = create<DataState>()(
    persist(
        (set) => ({
            data: INITIAL_DATA,
            setData: (updater) => set((state) => {
                const newData = typeof updater === 'function' ? updater(state.data) : updater;
                return { data: newData };
            }),
            resetData: () => set({ data: INITIAL_DATA }),
        }),
        {
            name: 'school_os_data',
            storage: createJSONStorage(() => localStorage),
            // Only persist if data is valid (optional enhancement logic can go here)
        }
    )
);
