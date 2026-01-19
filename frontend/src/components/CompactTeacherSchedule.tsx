import React, { useMemo, useState, memo } from 'react';
import {
    AlertTriangle, Plus, BookOpen, Calculator, FlaskConical, Languages, Book, Library, Globe2,
    Divide, Shapes, Dna, Atom, Map, Scroll, Landmark, Users2, Palette, Hammer, Cpu, HeartPulse,
    Dumbbell, Shield, Telescope, Leaf
} from 'lucide-react';

const ICON_OPTIONS = [
    { name: 'BookOpen', icon: BookOpen },
    { name: 'Calculator', icon: Calculator },
    { name: 'FlaskConical', icon: FlaskConical },
    { name: 'Languages', icon: Languages },
    { name: 'Book', icon: Book },
    { name: 'Library', icon: Library },
    { name: 'Globe2', icon: Globe2 },
    { name: 'Divide', icon: Divide },
    { name: 'Shapes', icon: Shapes },
    { name: 'Dna', icon: Dna },
    { name: 'Atom', icon: Atom },
    { name: 'Map', icon: Map },
    { name: 'Scroll', icon: Scroll },
    { name: 'Landmark', icon: Landmark },
    { name: 'Users2', icon: Users2 },
    { name: 'Palette', icon: Palette },
    { name: 'Hammer', icon: Hammer },
    { name: 'Cpu', icon: Cpu },
    { name: 'HeartPulse', icon: HeartPulse },
    { name: 'Dumbbell', icon: Dumbbell },
    { name: 'Shield', icon: Shield },
    { name: 'Telescope', icon: Telescope },
    { name: 'Leaf', icon: Leaf },
];

const IconRenderer = ({ name, size = 20, className = "" }: { name?: string, size?: number, className?: string }) => {
    const IconComponent = ICON_OPTIONS.find(i => i.name === name)?.icon || BookOpen;
    return <IconComponent size={size} className={className} />;
};
import { cn } from '../utils/cn';
import type { ScheduleRequest, Lesson, PerformanceSettings } from '../types';
import { useHover } from '../context/HoverContext';
import { useUIStore } from '../store/useUIStore';
import { useScheduleStore } from '../store/useScheduleStore';
import { useDragStore } from '../store/useDragStore';
import { getDayDate } from '../utils/scheduleHelpers';
const EMPTY_ARRAY: Lesson[] = [];

interface MemoizedTeacherCellProps {
    teacherId: string;
    day: string;
    period: number;
    lessons: Lesson[];
    isEditMode: boolean;
    isMonochrome: boolean;
    draggedLesson: Lesson | null;
    setDraggedLesson: (l: Lesson | null) => void;
    onCellClick: (teacherId: string, day: string, period: number, lesson?: Lesson, e?: React.MouseEvent) => void;
    processTeacherDrop: (teacherId: string, day: string, period: number, externalLesson?: any, isCopy?: boolean) => void;
    getSubjectColor: (id: string) => string;
    getConflicts: (teacherId: string, day: string, period: number, excludeClassId?: string) => string[];
    getClassConflicts: (classId: string, day: string, period: number, excludeTeacherId?: string) => string[];
    setActiveGroupPicker: (p: any) => void;
    data: ScheduleRequest;
    perfSettings: PerformanceSettings;
}

const MemoizedTeacherCell = memo(({
    teacherId, day, period, lessons, isEditMode, isMonochrome,
    draggedLesson, setDraggedLesson, onCellClick, processTeacherDrop,
    getSubjectColor, getConflicts, getClassConflicts, setActiveGroupPicker, data,
}: MemoizedTeacherCellProps) => {
    const { hoveredLesson, setHoveredLesson } = useHover();
    const isDragOver = useDragStore(s => s.dragOverCell?.day === day && s.dragOverCell?.period === period && s.dragOverCell?.teacherId === teacherId);
    const hasLessons = lessons.length > 0;
    const selectedLessonIds = useUIStore(s => s.selectedLessonIds);

    // Check for recommendation in Compact Teacher View
    // Check for recommendation in Compact Teacher View
    const activeForRec = draggedLesson || (hoveredLesson?.isUnscheduled ? hoveredLesson : null);

    const isRecommendedSlot = !hasLessons && activeForRec &&
        activeForRec.teacher_id === teacherId &&
        // REQUIREMENT: Valid only if the target class is free
        getClassConflicts(activeForRec.class_id, day, period).length === 0 &&
        getConflicts(teacherId, day, period).length === 0;

    return (
        <td
            onDragOver={(e) => {
                if (isEditMode) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = e.altKey ? 'copy' : 'move';
                    useDragStore.getState().setDragOverCellDebounced({ teacherId, day, period });
                }
            }}
            onDragLeave={() => isEditMode && useDragStore.getState().setDragOverCell(null)}
            onDrop={(e) => {
                if (isEditMode) {
                    e.preventDefault();
                    e.stopPropagation();
                    const data = e.dataTransfer.getData('lesson');
                    const externalLesson = data ? JSON.parse(data) : undefined;
                    processTeacherDrop(teacherId, day, period, externalLesson, e.altKey);
                }
            }}
            className={cn(
                "p-0 border-b border-r border-white/10 w-[32px] min-w-[32px] relative",
                isDragOver && "bg-indigo-500/40 z-10 box-border ring-2 ring-inset ring-indigo-500"
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
                        const teacherConflicts = getConflicts(teacherId, day, period, lesson.class_id);
                        const classConflicts = getClassConflicts(lesson.class_id, day, period, teacherId);
                        const hasConflicts = teacherConflicts.length > 0 || classConflicts.length > 0;
                        const room = lesson.room || sub?.defaultRoom || "—";
                        const isDragging = draggedLesson?.teacher_id === teacherId && draggedLesson.day === day && draggedLesson.period === period && draggedLesson.class_id === lesson.class_id;
                        const isTeacherHighlighted = hoveredLesson && lesson && (
                            (lesson.teacher_id === hoveredLesson.teacher_id && day === hoveredLesson.day && period === hoveredLesson.period) ||
                            (lesson.class_id === hoveredLesson.class_id && day === hoveredLesson.day && period === hoveredLesson.period)
                        );

                        const isSelected = selectedLessonIds.includes(`${lesson.class_id}-${lesson.day}-${lesson.period}-${lesson.subject_id}`);

                        return (
                            <div
                                key={idx}
                                draggable={isEditMode}
                                onMouseEnter={() => lesson && setHoveredLesson(lesson)}
                                onMouseLeave={() => setHoveredLesson(null)}
                                onDragStart={(e) => {
                                    if (isEditMode) {
                                        setDraggedLesson(lesson);
                                        e.dataTransfer.setData('text/plain', JSON.stringify(lesson));
                                        e.dataTransfer.effectAllowed = e.altKey ? 'copy' : 'move';
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
                                        e.stopPropagation();
                                        onCellClick(teacherId, day, period, lesson, e);
                                    }
                                }}
                                className={cn(
                                    "flex-1 flex flex-col justify-center items-center transition-all cursor-pointer active:scale-95 overflow-hidden relative group/cell shadow-sm",
                                    "hover:brightness-125 hover:z-10",
                                    lessons.length === 2 && idx === 0 && "border-r border-white/10",
                                    isDragging && "opacity-30",
                                    isTeacherHighlighted && ((lessons.length > 1 || teacherConflicts.length > 0 || classConflicts.length > 0)
                                        ? "ring-2 ring-amber-400 ring-inset animate-pulse z-30 brightness-200 shadow-[0_0_30px_rgba(251,191,36,0.8)] scale-110 bg-amber-500/20"
                                        : "ring-2 ring-white ring-inset animate-pulse z-20 brightness-200 shadow-[0_0_25px_rgba(255,255,255,0.6)] scale-110"
                                    ),
                                    isSelected && "ring-2 ring-indigo-400 bg-indigo-500/20 z-40 brightness-125"
                                )}
                                style={{
                                    borderLeft: lessons.length === 2 ? `1px solid ${isMonochrome ? '#52525b' : subColor}` : `2px solid ${isMonochrome ? '#52525b' : subColor}`,
                                    backgroundColor: isMonochrome ? 'transparent' : (classConflicts.length > 0 ? 'rgba(139, 92, 246, 0.15)' : (isTeacherHighlighted ? 'rgba(255, 255, 255, 0.4)' : `${subColor}15`))
                                }}
                            >
                                {lessons.length <= 2 && (
                                    <div className="invisible group-hover/cell:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-[100] w-max max-w-[200px] p-2 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl pointer-events-none animate-in fade-in zoom-in duration-100 flex items-start gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                                            <IconRenderer name={sub?.icon} size={16} />
                                        </div>
                                        <div>
                                            <div className="text-[9px] font-black text-white uppercase">{cls?.name} • {sub?.name}</div>
                                            <div className="text-[7px] font-bold text-[#a1a1aa] mt-0.5">Кабінет: {room}</div>
                                            {hasConflicts && (
                                                <div className="mt-1 pt-1 border-t border-white/5 text-[7px] font-bold">
                                                    {classConflicts.length > 0 && <div className="text-violet-400">КЛАС: {classConflicts.join(', ')}</div>}
                                                    {teacherConflicts.length > 0 && <div className="text-amber-500">ВИКЛ.: {teacherConflicts.join(', ')}</div>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {hasConflicts && (
                                    <div className={cn(
                                        "absolute top-0 right-0 rounded-bl-[4px] p-[1px] z-10 flex items-center justify-center",
                                        classConflicts.length > 0 ? "text-violet-400 bg-violet-950/60" : "text-amber-500 bg-black/40"
                                    )}>
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
                    onClick={(e) => {
                        if (isEditMode) {
                            e.stopPropagation();
                            onCellClick(teacherId, day, period, undefined, e);
                        }
                    }}
                    className={cn(
                        "h-full w-full flex items-center justify-center text-[10px] text-white/[0.02] select-none transition-all group/empty",
                        isEditMode ? "cursor-pointer hover:bg-white/5" : "",
                        isRecommendedSlot && "bg-emerald-500/30 shadow-[inset_0_0_20px_rgba(16,185,129,0.4)]"
                    )}
                >
                    {isEditMode ? (
                        <div className={cn(
                            "transition-all duration-300",
                            isRecommendedSlot
                                ? "opacity-100 scale-110 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                                : "opacity-0 group-hover/empty:opacity-20 text-white"
                        )}>
                            <Plus size={14} strokeWidth={3} />
                        </div>
                    ) : (
                        <span className="opacity-0 group-hover/empty:opacity-10">·</span>
                    )}
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
    onCellClick: (teacherId: string, day: string, period: number, lesson?: Lesson, e?: React.MouseEvent) => void;
    draggedLesson: Lesson | null;
    setDraggedLesson: (l: Lesson | null) => void;
    processTeacherDrop: (teacherId: string, day: string, period: number, externalLesson?: any, isCopy?: boolean) => void;
    isMonochrome?: boolean;
    searchQuery?: string;
    perfSettings: PerformanceSettings;
    getClassConflicts: (classId: string, day: string, period: number, excludeTeacherId?: string) => string[];
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
    processTeacherDrop,
    isMonochrome = false,
    searchQuery = '',
    perfSettings,
    getClassConflicts,
}) => {
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
    const selectedDate = useScheduleStore(s => s.selectedDate);

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
                                        onClick={(e) => {
                                            if (e.ctrlKey || e.metaKey) {
                                                e.stopPropagation();
                                                const dayLessons = lessons.filter(l => l.day === day);
                                                const newIds = dayLessons.map(l => `${l.class_id}-${l.day}-${l.period}-${l.subject_id}`);
                                                const currentSelected = useUIStore.getState().selectedLessonIds;
                                                useUIStore.getState().setSelectedLessons(Array.from(new Set([...currentSelected, ...newIds])));
                                            }
                                        }}
                                        className={cn(
                                            "sticky top-0 z-30 bg-[#121214] py-2 text-[10px] font-black text-white uppercase tracking-widest text-center border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors",
                                        )}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                                            {days[dIdx]}
                                            <span className="ml-1 text-[10px] font-black text-white">{getDayDate(selectedDate, dIdx)}</span>
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
                                            onClick={(e) => {
                                                if (e.ctrlKey || e.metaKey) {
                                                    e.stopPropagation();
                                                    const visibleTeacherIds = sortedTeachers.map(t => t.id);
                                                    const periodLessons = lessons.filter(l =>
                                                        l.day === day &&
                                                        l.period === p &&
                                                        visibleTeacherIds.includes(l.teacher_id)
                                                    );
                                                    const newIds = periodLessons.map(l => `${l.class_id}-${l.day}-${l.period}-${l.subject_id}`);
                                                    const currentSelected = useUIStore.getState().selectedLessonIds;
                                                    useUIStore.getState().setSelectedLessons(Array.from(new Set([...currentSelected, ...newIds])));
                                                }
                                            }}
                                            className={cn(
                                                "sticky top-[30px] z-30 p-0 text-[9px] font-black uppercase tracking-tighter border-b border-white/10 text-center w-[32px] min-w-[32px] transition-colors duration-75 cursor-pointer hover:bg-white/5",
                                                "bg-[#121214] text-[#a1a1aa]"
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
                                    tIdx % 2 === 0 ? "bg-white/[0.03]" : "bg-transparent"
                                )}
                            >
                                {/* Teacher Sticky Name */}
                                <td
                                    onClick={(e) => {
                                        if (e.ctrlKey || e.metaKey) {
                                            e.stopPropagation();
                                            const teacherLessons = lessons.filter(l => l.teacher_id === teacher.id);
                                            const newIds = teacherLessons.map(l => `${l.class_id}-${l.day}-${l.period}-${l.subject_id}`);
                                            const currentSelected = useUIStore.getState().selectedLessonIds;
                                            useUIStore.getState().setSelectedLessons(Array.from(new Set([...currentSelected, ...newIds])));
                                        }
                                    }}
                                    className={cn(
                                        "sticky left-0 z-20 p-1 border-b border-r border-white/20 transition-colors w-[90px] min-w-[90px] cursor-pointer hover:bg-white/5",
                                        tIdx % 2 === 0 ? "bg-[#121214]" : "bg-[#0c0c0e]"
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
                                                lessons={indexedLessons[teacher.id]?.[day]?.[p] || EMPTY_ARRAY}
                                                isEditMode={isEditMode}
                                                isMonochrome={isMonochrome}
                                                draggedLesson={draggedLesson}
                                                setDraggedLesson={setDraggedLesson}
                                                onCellClick={onCellClick}
                                                processTeacherDrop={processTeacherDrop}
                                                getSubjectColor={getSubjectColor}
                                                getConflicts={getConflicts}
                                                getClassConflicts={getClassConflicts}
                                                setActiveGroupPicker={setActiveGroupPicker}
                                                data={data}
                                                perfSettings={perfSettings}

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
                                const isSelected = useUIStore.getState().selectedLessonIds.includes(`${lesson.class_id}-${lesson.day}-${lesson.period}-${lesson.subject_id}`);

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
                                        onClick={(e) => {
                                            onCellClick(activeGroupPicker.teacherId, activeGroupPicker.day, activeGroupPicker.period, lesson, e);
                                            closePicker();
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group/btn text-left",
                                            isSelected && "bg-indigo-500/20 ring-1 ring-indigo-500"
                                        )}
                                    >
                                        <div
                                            className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-white/5 border border-white/5"
                                            style={{ color: color }}
                                        >
                                            <IconRenderer name={sub?.icon} size={16} />
                                        </div>
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
                                    onClick={(e) => {
                                        onCellClick(activeGroupPicker.teacherId, activeGroupPicker.day, activeGroupPicker.period, undefined, e);
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
