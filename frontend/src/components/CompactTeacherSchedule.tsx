import React, { useMemo, useState, memo } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { cn } from '../utils/cn';
import type { ScheduleRequest, Lesson } from '../types';

interface MemoizedTeacherCellProps {
    teacherId: string;
    day: string;
    period: number;
    lessons: Lesson[];
    hoveredPos: { day: string, period: number } | null;
    setHoveredPos: (pos: { day: string, period: number } | null) => void;
    isEditMode: boolean;
    isMonochrome: boolean;
    draggedLesson: Lesson | null;
    setDraggedLesson: (l: Lesson | null) => void;
    dragOverCell: any;
    setDragOverCell: (c: any) => void;
    onCellClick: (teacherId: string, day: string, period: number, lesson?: Lesson) => void;
    processTeacherDrop: (teacherId: string, day: string, period: number) => void;
    getSubjectColor: (id: string) => string;
    getConflicts: (teacherId: string, day: string, period: number, excludeClassId?: string) => string[];
    setActiveGroupPicker: (p: any) => void;
    data: ScheduleRequest;
}

const MemoizedTeacherCell = memo(({
    teacherId, day, period, lessons, hoveredPos, setHoveredPos, isEditMode, isMonochrome,
    draggedLesson, setDraggedLesson, dragOverCell, setDragOverCell, onCellClick, processTeacherDrop,
    getSubjectColor, getConflicts, setActiveGroupPicker, data
}: MemoizedTeacherCellProps) => {
    const hasLessons = lessons.length > 0;
    const isHoveredCol = hoveredPos?.day === day && hoveredPos?.period === period;
    const isDragOver = dragOverCell?.day === day && dragOverCell?.period === period && dragOverCell?.teacherId === teacherId;

    return (
        <td
            onMouseEnter={() => setHoveredPos({ day, period })}
            onMouseLeave={() => setHoveredPos(null)}
            onDragOver={(e) => {
                if (isEditMode) {
                    e.preventDefault();
                    setDragOverCell({ teacherId, day, period });
                }
            }}
            onDragLeave={() => isEditMode && setDragOverCell(null)}
            onDrop={(e) => {
                if (isEditMode) {
                    e.preventDefault();
                    processTeacherDrop(teacherId, day, period);
                }
            }}
            className={cn(
                "p-0 border-b border-r border-white/10 w-[32px] min-w-[32px] transition-all relative",
                isHoveredCol && "bg-indigo-500/[0.03]",
                isDragOver && "bg-indigo-500/20 scale-105 z-10 box-border border-2 border-indigo-500"
            )}
            style={{ height: '32px' }}
        >
            {hasLessons ? (
                <div className={cn(
                    "h-[32px] w-full items-stretch",
                    lessons.length === 2 ? "flex flex-row" : "flex flex-col gap-0"
                )}>
                    {lessons.slice(0, lessons.length > 2 ? 1 : 2).map((lesson, idx) => {
                        const cls = data.classes.find(c => c.id === lesson.class_id);
                        const sub = data.subjects.find(s => s.id === lesson.subject_id);
                        const subColor = getSubjectColor(lesson.subject_id);
                        const conflicts = getConflicts(teacherId, day, period, lesson.class_id);
                        const room = lesson.room || sub?.defaultRoom || "—";
                        const isDragging = draggedLesson?.teacher_id === teacherId && draggedLesson.day === day && draggedLesson.period === period && draggedLesson.class_id === lesson.class_id;

                        return (
                            <div
                                key={idx}
                                draggable={isEditMode}
                                onDragStart={(e) => {
                                    if (isEditMode) {
                                        setDraggedLesson(lesson);
                                        e.dataTransfer.setData('text/plain', JSON.stringify(lesson));
                                        e.dataTransfer.effectAllowed = 'move';
                                    }
                                }}
                                onDragEnd={() => setDraggedLesson(null)}
                                onClick={(e) => {
                                    if (lessons.length > 2) {
                                        e.stopPropagation();
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setActiveGroupPicker({
                                            teacherId,
                                            day,
                                            period,
                                            lessons: lessons,
                                            rect
                                        });
                                    } else {
                                        onCellClick(teacherId, day, period, lesson);
                                    }
                                }}
                                className={cn(
                                    "flex-1 flex flex-col justify-center items-center transition-all cursor-pointer active:scale-95 overflow-hidden relative group/cell shadow-sm",
                                    "hover:brightness-125 hover:z-10",
                                    lessons.length === 2 && idx === 0 && "border-r border-white/10",
                                    isDragging && "opacity-30"
                                )}
                                style={{
                                    borderLeft: lessons.length === 2 ? `1px solid ${isMonochrome ? '#52525b' : subColor}` : `2px solid ${isMonochrome ? '#52525b' : subColor}`,
                                    backgroundColor: isMonochrome ? 'transparent' : `${subColor}15`
                                }}
                            >
                                {lessons.length <= 2 && (
                                    <div className="invisible group-hover/cell:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-[100] w-max max-w-[150px] p-1.5 bg-[#18181b] border border-white/10 rounded-md shadow-2xl pointer-events-none animate-in fade-in zoom-in duration-100">
                                        <div className="text-[9px] font-black text-white uppercase">{cls?.name} • {sub?.name}</div>
                                        <div className="text-[7px] font-bold text-[#a1a1aa] mt-0.5">Каб: {room}</div>
                                        {conflicts.length > 0 && (
                                            <div className="mt-1 pt-1 border-t border-white/5 text-[7px] text-amber-500 font-bold">
                                                КОНФЛІКТ: {conflicts.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {conflicts.length > 0 && (
                                    <div className="absolute top-0 right-0 text-amber-500 bg-black/60 rounded-bl-[4px] p-[1px] z-10">
                                        <AlertTriangle size={8} />
                                    </div>
                                )}
                                <span className={cn(
                                    "font-black tracking-tighter truncate leading-none uppercase",
                                    isMonochrome ? "text-[#a1a1aa]" : "text-white",
                                    lessons.length >= 2 ? "text-[8px]" : "text-[11px]"
                                )}>
                                    {cls?.name}
                                </span>
                                {lessons.length === 1 && room !== "—" && (
                                    <span className={cn(
                                        "absolute bottom-[2px] right-[2px] text-[8px] font-black leading-none",
                                        isMonochrome ? "text-[#a1a1aa]/70" : "text-white/70"
                                    )}>
                                        {room}
                                    </span>
                                )}
                                {lessons.length > 2 && (
                                    <div className="absolute bottom-[1px] right-[2px] bg-indigo-500 text-white text-[7px] px-0.5 rounded-sm font-black">
                                        +{lessons.length - 1}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div
                    onClick={() => isEditMode && onCellClick(teacherId, day, period)}
                    className={cn(
                        "h-full w-full flex items-center justify-center text-[10px] text-white/[0.02] select-none transition-all",
                        isEditMode ? "cursor-pointer hover:bg-white/5 hover:text-indigo-500/30" : ""
                    )}
                >
                    {isEditMode ? <Plus size={12} /> : "·"}
                </div>
            )}
        </td>
    );
});

interface CompactTeacherScheduleProps {
    data: ScheduleRequest;
    lessons: Lesson[];
    periods: number[];
    apiDays: string[];
    days: string[];
    getSubjectColor: (subjectId: string) => string;
    getConflicts: (teacherId: string, day: string, period: number, excludeClassId?: string) => string[];
    isEditMode: boolean;
    onCellClick: (teacherId: string, day: string, period: number, lesson?: Lesson) => void;
    draggedLesson: Lesson | null;
    setDraggedLesson: (l: Lesson | null) => void;
    dragOverCell: any;
    setDragOverCell: (c: any) => void;
    processTeacherDrop: (teacherId: string, day: string, period: number) => void;
    isMonochrome?: boolean;
    searchQuery?: string;
}

export const CompactTeacherSchedule: React.FC<CompactTeacherScheduleProps> = ({
    data,
    lessons,
    periods,
    apiDays,
    days,
    getSubjectColor,
    getConflicts,
    isEditMode,
    onCellClick,
    draggedLesson,
    setDraggedLesson,
    dragOverCell,
    setDragOverCell,
    processTeacherDrop,
    isMonochrome = false,
    searchQuery = ''
}) => {
    const [hoveredPos, setHoveredPos] = useState<{ day: string, period: number } | null>(null);
    const [activeGroupPicker, setActiveGroupPicker] = useState<{
        teacherId: string,
        day: string,
        period: number,
        lessons: Lesson[],
        rect: DOMRect
    } | null>(null);

    // Close picker on scroll or click outside
    const closePicker = () => setActiveGroupPicker(null);

    // 1. Pre-index lessons for O(1) lookup: teacherId -> day -> period -> Lesson[]
    const indexedLessons = useMemo(() => {
        const index: Record<string, Record<string, Record<number, Lesson[]>>> = {};

        lessons.forEach(lesson => {
            if (!index[lesson.teacher_id]) index[lesson.teacher_id] = {};
            if (!index[lesson.teacher_id][lesson.day]) index[lesson.teacher_id][lesson.day] = {};
            if (!index[lesson.teacher_id][lesson.day][lesson.period]) {
                index[lesson.teacher_id][lesson.day][lesson.period] = [];
            }
            index[lesson.teacher_id][lesson.day][lesson.period].push(lesson);
        });

        return index;
    }, [lessons]);

    // 2. Sort & Filter teachers
    const sortedTeachers = useMemo(() => {
        let filtered = data.teachers;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t => t.name.toLowerCase().includes(query));
        }
        return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }, [data.teachers, searchQuery]);

    return (
        <div className="flex-1 overflow-hidden flex flex-col bg-[#09090b] rounded-2xl border border-white/5 shadow-2xl relative">
            <div
                className="overflow-auto custom-scrollbar flex-1 relative"
                onScroll={closePicker}
            >
                <table className="border-separate border-spacing-0 table-fixed min-w-max">
                    <thead>
                        {/* Day Headers */}
                        <tr className="h-[30px]">
                            <th className="sticky top-0 left-0 z-50 bg-[#121214] w-[90px] min-w-[90px] p-1 border-b border-r border-white/20 text-left">
                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Викладач</span>
                            </th>
                            {apiDays.map((day, dIdx) => (
                                <React.Fragment key={day}>
                                    <th
                                        colSpan={periods.length}
                                        className="sticky top-0 z-30 bg-[#121214] py-2 text-[10px] font-black text-white uppercase tracking-widest text-center border-b border-white/10"
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                                            {days[dIdx]}
                                        </div>
                                    </th>
                                    {/* Large separator column between days */}
                                    <th className="sticky top-0 z-30 w-[4px] min-w-[4px] bg-[#050507] border-b border-white/10"></th>
                                </React.Fragment>
                            ))}
                        </tr>
                        {/* Period Headers */}
                        <tr className="h-[20px]">
                            <th className="sticky top-[30px] left-0 z-50 bg-[#121214] border-b border-r border-white/20"></th>
                            {apiDays.map((day) => (
                                <React.Fragment key={day}>
                                    {periods.map((p) => (
                                        <th
                                            key={`${day}-${p}`}
                                            className={cn(
                                                "sticky top-[30px] z-30 p-0 text-[9px] font-black uppercase tracking-tighter border-b border-white/10 text-center w-[32px] min-w-[32px] transition-colors duration-200",
                                                hoveredPos?.day === day && hoveredPos?.period === p ? "bg-indigo-500/20 text-indigo-400" : "bg-[#121214] text-[#a1a1aa]"
                                            )}
                                        >
                                            {p}
                                        </th>
                                    ))}
                                    <th className="sticky top-[30px] z-30 w-[4px] min-w-[4px] bg-[#050507] border-b border-white/10 text-center"></th>
                                </React.Fragment>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTeachers.map((teacher, tIdx) => (
                            <tr
                                key={teacher.id}
                                className={cn(
                                    "group transition-colors h-[32px]",
                                    tIdx % 2 === 0 ? "bg-white/[0.03]" : "bg-transparent",
                                    "hover:bg-indigo-500/[0.05]"
                                )}
                            >
                                {/* Teacher Sticky Name */}
                                <td className={cn(
                                    "sticky left-0 z-20 p-1 border-b border-r border-white/20 transition-colors w-[90px] min-w-[90px]",
                                    tIdx % 2 === 0 ? "bg-[#121214]" : "bg-[#0c0c0e]",
                                    "group-hover:bg-[#1a1a1e]"
                                )}>
                                    <div className="flex flex-col justify-center min-w-0 h-full text-left">
                                        <span className="font-black text-white group-hover:text-indigo-400 transition-colors uppercase truncate text-[8px] leading-none">
                                            {teacher.name}
                                        </span>
                                    </div>
                                </td>

                                {apiDays.map((day) => (
                                    <React.Fragment key={day}>
                                        {periods.map((p) => (
                                            <MemoizedTeacherCell
                                                key={`${day}-${p}`}
                                                teacherId={teacher.id}
                                                day={day}
                                                period={p}
                                                lessons={indexedLessons[teacher.id]?.[day]?.[p] || []}
                                                hoveredPos={hoveredPos}
                                                setHoveredPos={setHoveredPos}
                                                isEditMode={isEditMode}
                                                isMonochrome={isMonochrome}
                                                draggedLesson={draggedLesson}
                                                setDraggedLesson={setDraggedLesson}
                                                dragOverCell={dragOverCell}
                                                setDragOverCell={setDragOverCell}
                                                onCellClick={onCellClick}
                                                processTeacherDrop={processTeacherDrop}
                                                getSubjectColor={getSubjectColor}
                                                getConflicts={getConflicts}
                                                setActiveGroupPicker={setActiveGroupPicker}
                                                data={data}
                                            />
                                        ))}
                                        {/* Vertical divider column */}
                                        <td className="w-[4px] min-w-[4px] bg-[#050507] border-b border-r border-white/20 relative">
                                            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-white/[0.02]"></div>
                                        </td>
                                    </React.Fragment>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Group Lesson Picker Popover */}
            {activeGroupPicker && (
                <>
                    <div
                        className="fixed inset-0 z-[100]"
                        onClick={closePicker}
                    />
                    <div
                        className="fixed z-[101] w-[200px] bg-[#121214]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-2 animate-in fade-in zoom-in duration-200"
                        style={{
                            left: Math.min(window.innerWidth - 210, activeGroupPicker.rect.left),
                            top: Math.min(window.innerHeight - 250, activeGroupPicker.rect.bottom + 8)
                        }}
                    >
                        <div className="text-[9px] font-black text-[#a1a1aa] uppercase tracking-widest mb-2 px-1 flex justify-between items-center">
                            <span>Оберіть групу</span>
                            <span className="text-white/20">{activeGroupPicker.lessons.length} класів</span>
                        </div>
                        <div className="space-y-1 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
                            {activeGroupPicker.lessons.map((lesson, idx) => {
                                const cls = data.classes.find(c => c.id === lesson.class_id);
                                const sub = data.subjects.find(s => s.id === lesson.subject_id);
                                const color = getSubjectColor(lesson.subject_id);
                                return (
                                    <button
                                        key={idx}
                                        draggable={isEditMode}
                                        onDragStart={(e) => {
                                            if (isEditMode) {
                                                setDraggedLesson(lesson);
                                                e.dataTransfer.setData('text/plain', JSON.stringify(lesson));
                                                e.dataTransfer.effectAllowed = 'move';
                                                closePicker();
                                            }
                                        }}
                                        onDragEnd={() => setDraggedLesson(null)}
                                        onClick={() => {
                                            onCellClick(activeGroupPicker.teacherId, activeGroupPicker.day, activeGroupPicker.period, lesson);
                                            closePicker();
                                        }}
                                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group/btn text-left"
                                    >
                                        <div
                                            className="w-1.5 h-6 rounded-full shrink-0"
                                            style={{ backgroundColor: color }}
                                        />
                                        <div className="min-w-0">
                                            <div className="text-[11px] font-black text-white group-hover/btn:text-indigo-400 transition-colors uppercase">{cls?.name}</div>
                                            <div className="text-[9px] text-[#a1a1aa] truncate">{sub?.name}</div>
                                        </div>
                                        <div className="ml-auto text-[9px] font-bold text-white/40">{lesson.room || '—'}</div>
                                    </button>
                                );
                            })}

                            {isEditMode && (
                                <button
                                    onClick={() => {
                                        onCellClick(activeGroupPicker.teacherId, activeGroupPicker.day, activeGroupPicker.period);
                                        closePicker();
                                    }}
                                    className="w-full flex items-center gap-3 p-2 rounded-lg border border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group/add text-left mt-2"
                                >
                                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center group-hover/add:bg-indigo-500/20 transition-colors">
                                        <Plus size={12} className="text-white/40 group-hover/add:text-indigo-400" />
                                    </div>
                                    <span className="text-[10px] font-bold text-white/40 group-hover/add:text-white transition-colors uppercase">Додати групу</span>
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div >
    );
};
