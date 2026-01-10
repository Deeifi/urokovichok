import React, { useState } from 'react';
import type { Lesson, ScheduleRequest } from '../types';
import { cn } from '../utils/cn';
import { Users, Search, Clock, AlertTriangle } from 'lucide-react';

interface CompactMatrixScheduleProps {
    data: ScheduleRequest;
    lessons: Lesson[];
    periods: number[];
    apiDays: string[];
    days: string[];
    getSubjectColor: (subjectId: string) => string;
    getConflicts: (teacherId: string, day: string, period: number, excludeClassId?: string) => string[];
    isEditMode: boolean;
    onCellClick: (classId: string, day: string, period: number, lesson?: Lesson) => void;

    // Drag and drop props
    draggedLesson: Lesson | null;
    setDraggedLesson: (l: Lesson | null) => void;
    dragOverCell: { classId: string, day: string, period: number } | null;
    setDragOverCell: (c: { classId: string, day: string, period: number } | null) => void;
    processDrop: (classId: string, day: string, period: number) => void;
    isMonochrome?: boolean;
}

export const CompactMatrixSchedule = ({
    data, lessons, periods, apiDays, days,
    getSubjectColor, getConflicts, isEditMode, onCellClick,
    draggedLesson, setDraggedLesson, dragOverCell, setDragOverCell, processDrop,
    isMonochrome = false
}: CompactMatrixScheduleProps) => {
    const [hoveredPos, setHoveredPos] = useState<{ classId: string; day: string; period: number } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const sortedClasses = [...data.classes].sort((a, b) => {
        const gradeA = parseInt(a.name) || 0;
        const gradeB = parseInt(b.name) || 0;
        if (gradeA !== gradeB) return gradeA - gradeB;
        return a.name.localeCompare(b.name);
    });

    const filteredClasses = sortedClasses.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const findLesson = (classId: string, day: string, period: number) => {
        return lessons.find(l => l.class_id === classId && l.day === day && l.period === period);
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-[#050507] rounded-3xl border border-white/5 shadow-2xl">
            {/* Header / Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0c0c0e]/80 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-indigo-400" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">ТИТЖНЕВА СІТКА КЛАСІВ</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                        <Search size={12} className="text-white/40" />
                        <input
                            type="text"
                            placeholder="ПОШУК КЛАСУ..."
                            className="bg-transparent border-none outline-none text-[10px] font-black text-white placeholder:text-white/20 w-32 uppercase tracking-widest"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20">
                        <Users size={12} className="text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">
                            {filteredClasses.length} КЛАСІВ
                        </span>
                    </div>
                </div>
            </div>

            {/* Grid Container */}
            <div className="flex-1 overflow-auto custom-scrollbar relative">
                <table className="border-separate border-spacing-0 w-full text-left">
                    <thead>
                        <tr>
                            {/* Sticky Top-Left Corner */}
                            <th className="sticky top-0 left-0 z-50 bg-[#0c0c0e] p-3 text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest border-b border-r border-white/10 w-[100px] min-w-[100px] text-center">
                                КЛАС
                            </th>
                            {apiDays.map((day, dIdx) => (
                                <React.Fragment key={day}>
                                    <th
                                        colSpan={periods.length}
                                        className="sticky top-0 z-30 bg-[#0c0c0e] py-2 text-[10px] font-black text-white uppercase tracking-widest border-b border-r border-white/10 text-center"
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="opacity-40">{days[dIdx].slice(0, 2)}</span>
                                            <span>{days[dIdx].toUpperCase()}</span>
                                        </div>
                                    </th>
                                    {/* Separator column */}
                                    <th className="sticky top-0 z-30 w-[12px] min-w-[12px] bg-[#050507] border-b border-white/10"></th>
                                </React.Fragment>
                            ))}
                        </tr>
                        <tr>
                            <th className="sticky top-[37px] left-0 z-40 bg-[#0c0c0e] border-b border-r border-white/10 h-[25px]"></th>
                            {apiDays.map((day) => (
                                <React.Fragment key={day}>
                                    {periods.map(p => (
                                        <th
                                            key={p}
                                            className={cn(
                                                "sticky top-[37px] z-30 p-1 text-[9px] font-black uppercase tracking-tighter border-b border-white/10 text-center w-[40px] min-w-[40px] transition-colors duration-200",
                                                hoveredPos?.day === day && hoveredPos?.period === p ? "bg-indigo-500/20 text-indigo-400" : "bg-[#121214] text-[#a1a1aa]"
                                            )}
                                        >
                                            {p}
                                        </th>
                                    ))}
                                    <th className="sticky top-[37px] z-30 w-[12px] min-w-[12px] bg-[#050507] border-b border-white/10"></th>
                                </React.Fragment>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClasses.map((cls, cIdx) => (
                            <tr
                                key={cls.id}
                                className={cn(
                                    "group transition-colors h-[40px]",
                                    cIdx % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent",
                                    "hover:bg-indigo-500/[0.05]"
                                )}
                            >
                                {/* Sticky Class Name */}
                                <td className={cn(
                                    "sticky left-0 z-20 p-2 border-b border-r border-white/10 transition-colors w-[100px] min-w-[100px] text-center font-black text-white group-hover:text-indigo-400 uppercase text-[11px]",
                                    cIdx % 2 === 0 ? "bg-[#0c0c0e]" : "bg-[#08080a]",
                                    "group-hover:bg-[#1a1a1e]"
                                )}>
                                    {cls.name}
                                </td>

                                {apiDays.map((day) => {
                                    return (
                                        <React.Fragment key={day}>
                                            {periods.map(p => {
                                                const lesson = findLesson(cls.id, day, p);
                                                const subject = lesson ? data.subjects.find(s => s.id === lesson.subject_id) : null;
                                                const subColor = lesson ? getSubjectColor(lesson.subject_id) : 'transparent';
                                                const conflicts = lesson ? getConflicts(lesson.teacher_id, day, p, cls.id) : [];

                                                const isHovered = hoveredPos?.classId === cls.id && hoveredPos?.day === day && hoveredPos?.period === p;
                                                const isCrosshair = hoveredPos?.classId === cls.id || (hoveredPos?.day === day && hoveredPos?.period === p);

                                                const isDragOver = dragOverCell?.day === day && dragOverCell?.period === p && dragOverCell?.classId === cls.id;
                                                const isDragging = draggedLesson?.day === day && draggedLesson?.period === p && draggedLesson?.class_id === cls.id;

                                                return (
                                                    <td
                                                        key={p}
                                                        className={cn(
                                                            "p-0 border-b border-r border-white/10 transition-all duration-200 relative h-[40px]",
                                                            isCrosshair && !isHovered && "bg-white/[0.02]",
                                                            isDragOver && "bg-indigo-500/30 scale-105 z-10 shadow-xl",
                                                            isDragging && "opacity-30"
                                                        )}
                                                        onMouseEnter={() => setHoveredPos({ classId: cls.id, day, period: p })}
                                                        onMouseLeave={() => setHoveredPos(null)}
                                                        onClick={() => onCellClick(cls.id, day, p, lesson)}
                                                        onDragOver={(e) => {
                                                            if (isEditMode) {
                                                                e.preventDefault();
                                                                setDragOverCell({ classId: cls.id, day, period: p });
                                                            }
                                                        }}
                                                        onDrop={(e) => {
                                                            if (isEditMode) {
                                                                e.preventDefault();
                                                                processDrop(cls.id, day, p);
                                                            }
                                                        }}
                                                    >
                                                        {lesson ? (
                                                            <div
                                                                className={cn(
                                                                    "w-full h-full flex flex-col items-center justify-center relative overflow-hidden group/cell transition-all cursor-pointer backdrop-blur-[2px] shadow-sm active:scale-95 hover:brightness-125 hover:z-10",
                                                                    conflicts.length > 0 ? " ring-inset ring-1 ring-red-500/50 shadow-[inset_0_0_10px_rgba(239,68,68,0.2)]" : ""
                                                                )}
                                                                style={{
                                                                    backgroundColor: isMonochrome ? 'transparent' : `${subColor}20`,
                                                                    borderLeft: `3px solid ${isMonochrome ? '#52525b' : subColor}`
                                                                }}
                                                                draggable={isEditMode}
                                                                onDragStart={(e) => {
                                                                    if (isEditMode) {
                                                                        setDraggedLesson(lesson);
                                                                        e.dataTransfer.setData('text/plain', JSON.stringify(lesson));
                                                                    }
                                                                }}
                                                                onDragEnd={() => {
                                                                    setDraggedLesson(null);
                                                                    setDragOverCell(null);
                                                                }}
                                                            >
                                                                {/* Subject Name (Unified Style) */}
                                                                <span className={cn(
                                                                    "text-[12px] font-black uppercase leading-none truncate w-full text-center px-0.5 tracking-tighter",
                                                                    isMonochrome ? "text-[#a1a1aa]" : "text-white"
                                                                )}>
                                                                    {subject?.name.toLowerCase().includes('фізкульт')
                                                                        ? 'Ф-РА'
                                                                        : subject?.name.slice(0, 3)}
                                                                </span>

                                                                {/* Conflict Indicator (Corner Triangle with Icon) */}
                                                                {conflicts.length > 0 && (
                                                                    <div className="absolute top-0 right-0 text-red-500 bg-black/40 rounded-bl-[4px] p-[1px] z-10 flex items-center justify-center">
                                                                        <AlertTriangle size={8} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {isEditMode ? (
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                                                ) : (
                                                                    <span className="text-[8px] text-white/5">·</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            {/* Separation Gap */}
                                            <td className="w-[12px] min-w-[12px] bg-[#050507] border-b border-white/5"></td>
                                        </React.Fragment>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
