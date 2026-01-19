import { create } from 'zustand';

interface DragOverCell {
    classId?: string;
    teacherId?: string;
    day: string;
    period: number;
}

interface DragState {
    dragOverCell: DragOverCell | null;
    setDragOverCell: (cell: DragOverCell | null) => void;
    setDragOverCellDebounced: (cell: DragOverCell | null) => void;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingCell: DragOverCell | null = null;

export const useDragStore = create<DragState>((set, get) => ({
    dragOverCell: null,
    setDragOverCell: (cell) => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
        }
        pendingCell = null;
        set({ dragOverCell: cell });
    },
    setDragOverCellDebounced: (cell) => {
        const current = get().dragOverCell;

        // If trying to set null, do it immediately (to clear highlight on leave)
        if (!cell) {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
                debounceTimer = null;
            }
            pendingCell = null;
            set({ dragOverCell: null });
            return;
        }

        // If same as current, do nothing
        if (
            current &&
            current.day === cell.day &&
            current.period === cell.period &&
            current.classId === cell.classId &&
            current.teacherId === cell.teacherId
        ) {
            return;
        }

        // If same as pending, let the timer run
        if (
            pendingCell &&
            pendingCell.day === cell.day &&
            pendingCell.period === cell.period &&
            pendingCell.classId === cell.classId &&
            pendingCell.teacherId === cell.teacherId
        ) {
            return;
        }

        // New target: clear old timer, start new one
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        pendingCell = cell;
        debounceTimer = setTimeout(() => {
            set({ dragOverCell: cell });
            debounceTimer = null;
            pendingCell = null;
        }, 70);
    },
}));
