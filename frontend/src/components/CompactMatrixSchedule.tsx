import React, { useMemo, memo } from 'react';
import type { Lesson, ScheduleRequest, Subject, PerformanceSettings } from '../types';
import { cn } from '../utils/cn';
import {
    AlertTriangle, Plus, BookOpen, Calculator, FlaskConical, Languages, Book,
    Library, Globe2, Divide, Shapes, Dna, Atom, Map, Scroll, Landmark, Users2, Palette, Hammer,
    Cpu, HeartPulse, Dumbbell, Shield, Telescope, Leaf
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

import { useHover } from '../context/HoverContext';
import { useUIStore } from '../store/useUIStore';

interface MemoizedCellProps {
    classId: string;
    day: string;
    period: number;
    lesson: Lesson | undefined;
    isDragOver: boolean;
    setDragOverCell: (pos: { classId: string; day: string; period: number } | null) => void;
    draggedLesson: Lesson | null;
    setDraggedLesson: (l: Lesson | null) => void;
    onCellClick: (classId: string, day: string, period: number, lesson?: Lesson, e?: React.MouseEvent) => void;
    isEditMode: boolean;
    isMonochrome: boolean;
    getSubjectColor: (id: string) => string;
    getConflicts: (teacherId: string, day: string, period: number, excludeClassId?: string) => string[];
    processDrop: (classId: string, day: string, period: number, externalLesson?: any, isCopy?: boolean) => void;
    subjects: Subject[];
    perfSettings: PerformanceSettings;
    getClassConflicts: (classId: string, day: string, period: number, excludeTeacherId?: string) => string[];
    userRole: 'admin' | 'teacher';
    selectedTeacherId: string | null;
    showIcons: boolean;
}

const MemoizedCell = memo(({
    classId, day, period, lesson,
    isDragOver, setDragOverCell, draggedLesson, setDraggedLesson,
    onCellClick, isEditMode, isMonochrome, getSubjectColor, getConflicts, processDrop, subjects,
    getClassConflicts, userRole, selectedTeacherId, showIcons
}: MemoizedCellProps) => {
    const { hoveredLesson, setHoveredLesson } = useHover();
    const isDragging = draggedLesson?.day === day && draggedLesson?.period === period && draggedLesson?.class_id === classId;

    const subject = lesson ? subjects.find(s => s.id === lesson.subject_id) : null;
    const subColor = lesson ? getSubjectColor(lesson.subject_id) : 'transparent';
    const teacherConflicts = lesson ? getConflicts(lesson.teacher_id, day, period, classId) : [];
    const classConflicts = getClassConflicts(classId, day, period, lesson?.teacher_id);

    const selectedLessonIds = useUIStore(s => s.selectedLessonIds);
    const isSelected = lesson && selectedLessonIds.includes(`${lesson.class_id}-${lesson.day}-${lesson.period}-${lesson.subject_id}`);

    const isTeacherHighlighted = hoveredLesson && lesson && lesson.teacher_id === hoveredLesson.teacher_id;
    const isTeacherConflict = isTeacherHighlighted && hoveredLesson && day === hoveredLesson.day && period === hoveredLesson.period && teacherConflicts.length > 0;

    // Check if this cell is a valid slot for the hovered lesson
    // Must be empty (!lesson), match the hovered lesson's class (or not? User said "empty cells where specific teacher has no conflicts").
    // Actually, usually we drag to a specific class row. If we are just highlighting "free slots for teacher", it should be ANY empty cell where teacher is free?
    // But logically, we only care about the class row we are targeting.
    // However, the user said "cells where specific teacher has no conflicts".
    // If I hover a 5-A Math lesson (Teacher X), and 5-B has an empty slot where Teacher X is free, should it light up? 
    // Probably yes, to show availability?
    // BUT, usually we want to place it in 5-A. 
    // Let's stick to "valid recommendation" usually implies "for this specific lesson".
    // So usually we only highlight slots in the target class row.
    // BUT the user request says: "empty cells where for specific teacher there are no conflicts ALSO somehow highlight".
    // If I am hovering a lesson for Class A, showing that Teacher is free in Class B's row is useful ONLY if I want to move it to Class B?
    // Unscheduled lessons have a pre-assigned class.
    // So it only makes sense to highlight slots in the `hoveredLesson.class_id` row.
    // Wait, let's re-read: "empty cells where for specific teacher will be no conflicts".
    // If I interpret this strictly: highlight ALL empty cells in the grid where Teacher X is free.
    // This allows seeing "Oh, the teacher is free on Monday 1st period", so I can look at Monday 1st period in MY class row.
    // So YES, highlight ALL empty cells where teacher is free.

    const isRecommendedSlot = !lesson && draggedLesson &&
        draggedLesson.teacher_id &&
        draggedLesson.class_id === classId && // REQUIREMENT: Only highlight for the target class row
        getConflicts(draggedLesson.teacher_id, day, period).length === 0;

    return (
        <td
            className={cn(
                "p-0 border-b border-r border-white/10 relative h-[32px] transition-all duration-300",
                isDragOver && "bg-indigo-500/40 z-10 ring-2 ring-inset ring-indigo-500",
                isDragging && "opacity-30",
                isTeacherHighlighted && "bg-white/20 z-10"
            )}
            onMouseEnter={() => {
                if (lesson) setHoveredLesson(lesson);
            }}
            onMouseLeave={() => {
                setHoveredLesson(null);
            }}
            onClick={(e) => {
                e.stopPropagation();
                onCellClick(classId, day, period, lesson, e);
            }}
            onDragOver={(e) => {
                if (isEditMode) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = e.altKey ? 'copy' : 'move';
                    setDragOverCell({ classId, day, period });
                }
            }}
            onDrop={(e) => {
                if (isEditMode) {
                    e.preventDefault();
                    e.stopPropagation();
                    const data = e.dataTransfer.getData('lesson');
                    const externalLesson = data ? JSON.parse(data) : undefined;
                    processDrop(classId, day, period, externalLesson, e.altKey);
                }
            }}
        >
            {lesson ? (
                <div
                    className={cn(
                        "w-full h-full flex flex-col items-center justify-center relative overflow-hidden group/cell transition-all cursor-pointer shadow-sm active:scale-95 hover:brightness-125 hover:z-10",
                        teacherConflicts.length > 0 ? " ring-inset ring-1 ring-amber-500/50 shadow-[inset_0_0_10px_rgba(245,158,11,0.2)]" : "",
                        classConflicts.length > 0 ? " ring-inset ring-1 ring-violet-500/50 shadow-[inset_0_0_10px_rgba(139,92,246,0.2)]" : "",
                        isTeacherHighlighted && (isTeacherConflict
                            ? "ring-2 ring-amber-400 ring-inset animate-pulse z-30 brightness-200 shadow-[0_0_30px_rgba(251,191,36,0.8)] scale-125 bg-amber-500/20"
                            : "ring-2 ring-white ring-inset animate-pulse z-20 brightness-200 shadow-[0_0_25px_rgba(255,255,255,0.6)] scale-110"
                        ),
                        userRole === 'teacher' && selectedTeacherId && lesson && lesson.teacher_id !== selectedTeacherId && "opacity-10 grayscale blur-[0.3px] pointer-events-none",
                        userRole === 'teacher' && selectedTeacherId && lesson && lesson.teacher_id === selectedTeacherId && "z-20 scale-125 ring-2 ring-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.5)] brightness-125",
                        isSelected && "ring-2 ring-indigo-400 bg-indigo-500/20 z-40 brightness-125",
                        isMonochrome ? "opacity-60" : ""
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
                            e.dataTransfer.effectAllowed = e.altKey ? 'copy' : 'move';
                        }
                    }}
                    onDragEnd={() => {
                        setDraggedLesson(null);
                        setDragOverCell(null);
                    }}
                >
                    {showIcons ? (
                        <IconRenderer name={subject?.icon} size={16} className={cn(
                            "transition-transform group-hover/cell:scale-110",
                            isMonochrome ? "text-[#a1a1aa]" : ""
                        )} />
                    ) : (
                        <span className={cn(
                            "text-[11px] font-black uppercase tracking-tighter leading-none",
                            isMonochrome ? "text-[#a1a1aa]" : "text-white"
                        )}
                        >
                            {subject?.name?.slice(0, 3)}
                        </span>
                    )}
                    {(teacherConflicts.length > 0 || classConflicts.length > 0) && (
                        <div className={cn(
                            "absolute top-0 right-0 rounded-bl-[4px] p-[1px] z-10 flex items-center justify-center",
                            classConflicts.length > 0 ? "text-violet-400 bg-violet-950/60" : "text-amber-500 bg-black/40"
                        )} title={classConflicts.length > 0 ? `Клас вже має іншого вчителя: ${classConflicts.join(', ')}` : `Вчитель вже веде урок у: ${teacherConflicts.join(', ')}`}>
                            <AlertTriangle size={8} />
                        </div>
                    )}
                </div>
            ) : (
                <div className={cn(
                    "w-full h-full flex items-center justify-center transition-all duration-300 group/empty",
                    isRecommendedSlot ? "opacity-100 bg-emerald-500/30 shadow-[inset_0_0_20px_rgba(16,185,129,0.4)]" : "opacity-0"
                )}>
                    {isEditMode ? (
                        <div className={cn(
                            "transition-all duration-300",
                            isRecommendedSlot
                                ? "scale-110 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                                : "opacity-0 group-hover/empty:opacity-20 text-white"
                        )}>
                            <Plus size={14} strokeWidth={3} />
                        </div>
                    ) : (
                        <span className="text-[8px] text-white/5 opacity-0 group-hover/empty:opacity-100">·</span>
                    )}
                </div>
            )}
        </td>
    );
});

interface CompactMatrixScheduleProps {
    data: ScheduleRequest;
    lessons: Lesson[];
    periods: number[];
    apiDays: string[];
    days: string[];
    getSubjectColor: (subjectId: string) => string;
    getConflicts: (teacherId: string, day: string, period: number, excludeClassId?: string) => string[];
    isEditMode: boolean;
    onCellClick: (classId: string, day: string, period: number, lesson?: Lesson, e?: React.MouseEvent) => void;

    // Drag and drop props
    draggedLesson: Lesson | null;
    setDraggedLesson: (l: Lesson | null) => void;
    dragOverCell: { classId: string, day: string, period: number } | null;
    setDragOverCell: (c: { classId: string, day: string, period: number } | null) => void;
    processDrop: (classId: string, day: string, period: number, externalLesson?: any, isCopy?: boolean) => void;
    isMonochrome?: boolean;
    perfSettings: PerformanceSettings;
    getClassConflicts: (classId: string, day: string, period: number, excludeTeacherId?: string) => string[];
    userRole: 'admin' | 'teacher';
    selectedTeacherId: string | null;
    showIcons: boolean;
}

export const CompactMatrixSchedule = ({
    data, lessons, periods, apiDays, days,
    getSubjectColor, getConflicts, isEditMode, onCellClick,
    draggedLesson, setDraggedLesson, dragOverCell, setDragOverCell, processDrop,
    isMonochrome = false, perfSettings,
    getClassConflicts, userRole, selectedTeacherId, showIcons, filteredClasses
}: CompactMatrixScheduleProps & { filteredClasses: import('../types').ClassGroup[] }) => {
    const { hoveredLesson } = useHover();

    const lessonLookup = useMemo(() => {
        const map: Record<string, Lesson> = {};
        lessons.forEach(l => {
            map[`${l.class_id}-${l.day}-${l.period}`] = l;
        });
        return map;
    }, [lessons]);

    const findLesson = (classId: string, day: string, period: number) => {
        return lessonLookup[`${classId}-${day}-${period}`];
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-[#050507] rounded-3xl border border-white/5 shadow-2xl">


            {/* Grid Container */}
            <div className="flex-1 overflow-auto custom-scrollbar relative">
                <table className="border-separate border-spacing-0 w-full text-left">
                    <thead>
                        <tr>
                            {/* Sticky Top-Left Corner */}
                            <th className="sticky top-0 left-0 z-50 bg-[#0c0c0e] p-2 text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest border-b border-r border-white/10 w-[80px] min-w-[80px] text-center">
                                КЛАС
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
                                            "sticky top-0 z-30 bg-[#0c0c0e] py-2 text-[10px] font-black text-white uppercase tracking-widest border-b border-r border-white/10 text-center cursor-pointer hover:bg-white/5 transition-colors",
                                        )}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                                            <span>{days[dIdx].toUpperCase()}</span>
                                        </div>
                                    </th>
                                    {/* Separator column */}
                                    <th className="sticky top-0 z-30 w-[8px] min-w-[8px] bg-[#050507] border-b border-white/10"></th>
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
                                            onClick={(e) => {
                                                if (e.ctrlKey || e.metaKey) {
                                                    e.stopPropagation();
                                                    const visibleClassIds = filteredClasses.map(c => c.id);
                                                    const periodLessons = lessons.filter(l =>
                                                        l.day === day &&
                                                        l.period === p &&
                                                        visibleClassIds.includes(l.class_id)
                                                    );
                                                    const newIds = periodLessons.map(l => `${l.class_id}-${l.day}-${l.period}-${l.subject_id}`);
                                                    const currentSelected = useUIStore.getState().selectedLessonIds;
                                                    useUIStore.getState().setSelectedLessons(Array.from(new Set([...currentSelected, ...newIds])));
                                                }
                                            }}
                                            className={cn(
                                                "sticky top-[37px] z-30 p-1 text-[9px] font-black uppercase tracking-tighter border-b border-white/10 text-center w-[32px] min-w-[32px] transition-colors duration-75 cursor-pointer hover:bg-white/5",
                                                "bg-[#121214] text-[#a1a1aa]"
                                            )}
                                        >
                                            {p}
                                        </th>
                                    ))}
                                    <th className="sticky top-[37px] z-30 w-[8px] min-w-[8px] bg-[#050507] border-b border-white/10"></th>
                                </React.Fragment>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClasses.map((cls, cIdx) => (
                            <tr
                                key={cls.id}
                                className={cn(
                                    "group transition-colors h-[32px]",
                                    cIdx % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent",
                                    hoveredLesson?.class_id === cls.id && "bg-indigo-500/20 shadow-[inset_0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-inset ring-indigo-500/30"
                                )}
                            >
                                {/* Sticky Class Name */}
                                <td
                                    onClick={(e) => {
                                        if (e.ctrlKey || e.metaKey) {
                                            e.stopPropagation();
                                            const classLessons = lessons.filter(l => l.class_id === cls.id);
                                            const newIds = classLessons.map(l => `${l.class_id}-${l.day}-${l.period}-${l.subject_id}`);
                                            const currentSelected = useUIStore.getState().selectedLessonIds;
                                            useUIStore.getState().setSelectedLessons(Array.from(new Set([...currentSelected, ...newIds])));
                                        }
                                    }}
                                    className={cn(
                                        "sticky left-0 z-20 p-1 border-b border-r border-white/10 transition-colors w-[80px] min-w-[80px] text-center font-black text-white group-hover:text-indigo-400 uppercase text-[10px] cursor-pointer hover:bg-white/5",
                                        cIdx % 2 === 0 ? "bg-[#0c0c0e]" : "bg-[#08080a]"
                                    )}>
                                    {cls.name}
                                </td>

                                {apiDays.map((day) => (
                                    <React.Fragment key={day}>
                                        {periods.map(p => (
                                            <MemoizedCell
                                                key={p}
                                                classId={cls.id}
                                                day={day}
                                                period={p}
                                                lesson={findLesson(cls.id, day, p)}
                                                isDragOver={dragOverCell?.day === day && dragOverCell?.period === p && dragOverCell?.classId === cls.id}
                                                setDragOverCell={setDragOverCell}
                                                draggedLesson={draggedLesson}
                                                setDraggedLesson={setDraggedLesson}
                                                onCellClick={onCellClick}
                                                isEditMode={isEditMode}
                                                isMonochrome={isMonochrome}
                                                getSubjectColor={getSubjectColor}
                                                getConflicts={getConflicts}
                                                processDrop={processDrop}
                                                subjects={data.subjects}
                                                perfSettings={perfSettings}
                                                getClassConflicts={getClassConflicts}
                                                userRole={userRole}
                                                selectedTeacherId={selectedTeacherId}
                                                showIcons={showIcons}
                                            />
                                        ))}
                                        <td className="w-[4px] min-w-[4px] bg-[#050507] border-b border-white/5"></td>
                                    </React.Fragment>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
