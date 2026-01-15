import { memo } from 'react';
import { Trash2, UserPlus, X, CheckSquare } from 'lucide-react';
import { useUIStore } from '../store/useUIStore';
import { cn } from '../utils/cn';

interface BulkActionsToolbarProps {
    onDelete?: (ids: string[]) => void;
    onAssignTeacher?: (ids: string[]) => void;
}

export const BulkActionsToolbar = memo(({ onDelete, onAssignTeacher }: BulkActionsToolbarProps) => {
    const selectedLessonIds = useUIStore(s => s.selectedLessonIds);
    const clearSelection = useUIStore(s => s.clearSelection);

    if (selectedLessonIds.length === 0) return null;

    return (
        <div className={cn("fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-300")}>
            <div className="bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 p-2 flex items-center gap-2 backdrop-blur-md">

                <div className="flex items-center gap-2 pl-3 pr-4 border-r border-white/10">
                    <div className="bg-indigo-500/20 text-indigo-400 p-1.5 rounded-lg">
                        <CheckSquare size={16} />
                    </div>
                    <span className="text-white font-black text-sm">
                        {selectedLessonIds.length} <span className="text-[#a1a1aa] font-bold text-xs">ОБРАНО</span>
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onAssignTeacher?.(selectedLessonIds)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-white font-bold hover:bg-white/10 transition-colors"
                        title="Assign Teacher"
                    >
                        <UserPlus size={16} />
                        <span className="text-xs">Призначити</span>
                    </button>

                    <button
                        onClick={() => onDelete?.(selectedLessonIds)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-red-400 font-bold hover:bg-red-500/10 transition-colors"
                        title="Delete Selected"
                    >
                        <Trash2 size={16} />
                        <span className="text-xs">Видалити</span>
                    </button>
                </div>

                <div className="w-[1px] h-8 bg-white/10 mx-1" />

                <button
                    onClick={clearSelection}
                    className="p-2 text-[#a1a1aa] hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                    title="Clear Selection"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
});
