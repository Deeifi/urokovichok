import { useState, useRef, useEffect } from 'react';
import { FileSpreadsheet, GraduationCap, ChevronDown, Download } from 'lucide-react';
import { cn } from '../utils/cn';
import type { Teacher, Lesson, Subject, ScheduleClass } from '../types';

interface ExportDropdownProps {
    teachers: Teacher[];
    lessons: Lesson[];
    subjects: Subject[];
    classes: ScheduleClass[];
    exportFunction: (teachers: Teacher[], lessons: Lesson[], subjects: Subject[], classes: ScheduleClass[], options?: { onlyClassNames?: boolean }) => void;
    compact?: boolean;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
    teachers,
    lessons,
    subjects,
    classes,
    exportFunction,
    compact = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 rounded-xl border transition-all text-xs font-bold h-10",
                    compact ? "px-2" : "px-3 md:px-4",
                    isOpen
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-[#18181b] border-white/5 text-[#a1a1aa] hover:text-white hover:bg-white/5"
                )}
                title="Експорт в Excel"
            >
                <Download size={compact ? 14 : 16} />
                {!compact && <span>ЕКСПОРТ</span>}
                <ChevronDown size={12} className={cn("transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-[#18181b] border border-white/10 rounded-2xl shadow-xl shadow-black/50 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 p-1.5 flex flex-col gap-1">

                    {/* Full Export */}
                    <button
                        onClick={() => {
                            exportFunction(teachers, lessons, subjects, classes);
                            setIsOpen(false);
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-500/10 transition-all group text-left"
                    >
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                            <FileSpreadsheet size={16} />
                        </div>
                        <div>
                            <div className="text-white text-xs font-bold">Повний розклад</div>
                            <div className="text-[#a1a1aa] text-[10px] leading-tight mt-0.5">Всі деталі уроків</div>
                        </div>
                    </button>

                    {/* Class Names Only */}
                    <button
                        onClick={() => {
                            exportFunction(teachers, lessons, subjects, classes, { onlyClassNames: true });
                            setIsOpen(false);
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-500/10 transition-all group text-left"
                    >
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                            <GraduationCap size={16} />
                        </div>
                        <div>
                            <div className="text-white text-xs font-bold">Тільки класи</div>
                            <div className="text-[#a1a1aa] text-[10px] leading-tight mt-0.5">Назви класів без деталей</div>
                        </div>
                    </button>

                </div>
            )}
        </div>
    );
};
