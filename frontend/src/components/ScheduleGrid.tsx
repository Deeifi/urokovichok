import { useCallback, useState, useMemo, useEffect, memo, useDeferredValue } from 'react';
import { useHover } from '../context/HoverContext';
import { createPortal } from 'react-dom';
import type { ScheduleRequest, ScheduleResponse, Lesson, ClassGroup, PerformanceSettings } from '../types';
import {
    Plus,
    X,
    Check,
    Search,
    Trash2,
    LayoutDashboard,
    Users,
    Table as TableIcon,
    Columns,
    ArrowRightLeft,
    Info,
    Unlock,
    Lock,
    LayoutGrid,
    Droplet,
    Pencil,
    AlertTriangle,
    ChevronRight,
    Video
} from 'lucide-react';
import { cn } from '../utils/cn';
import { ConfirmationModal } from './ConfirmationModal';
import { BELL_SCHEDULE } from '../constants';
import { CompactTeacherSchedule } from './CompactTeacherSchedule';
import { CompactMatrixSchedule } from './CompactMatrixSchedule';

interface ScheduleGridProps {
    data: ScheduleRequest;
    schedule: ScheduleResponse;
    onScheduleChange: (newSchedule: ScheduleResponse) => void;
    isEditMode: boolean;
    setIsEditMode: (val: boolean) => void;
    isCompact: boolean;
    setIsCompact: (val: boolean) => void;
    viewType: ViewType;
    setViewType: (val: ViewType) => void;
    perfSettings: PerformanceSettings;
    userRole: 'admin' | 'teacher';
    selectedTeacherId: string | null;
    isHeaderCollapsed?: boolean;
    setIsHeaderCollapsed?: (collapsed: boolean) => void;
}

export type ViewType = 'dashboard' | 'matrix' | 'byClass' | 'teachers';

// --- Sub-View Components ---

import { TeacherDashboard } from './TeacherDashboard';

interface DashboardViewProps {
    data: ScheduleRequest;
    selectedClassId: string;
    setSelectedClassId: (id: string) => void;
    timeInfo: any;
    now: Date;
    findLesson: (classId: string, day: string, period: number) => Lesson | null;
    periods: number[];
    getRoomColor: (room: string | undefined) => string;
    sortedClasses: ClassGroup[];
    perfSettings: PerformanceSettings;
    userRole: 'admin' | 'teacher';
    selectedTeacherId: string | null;
    lessons: Lesson[];
}

const DashboardView = memo(({
    data, selectedClassId, setSelectedClassId, timeInfo, now, findLesson, periods,
    getRoomColor, sortedClasses, perfSettings, userRole, selectedTeacherId, lessons
}: DashboardViewProps) => {
    const { todayApiDay, currentPeriod, isBreak, minutesLeft, nextPeriod } = timeInfo;

    // Use enhanced dashboard for teachers
    if (userRole === 'teacher' && selectedTeacherId) {
        return (
            <TeacherDashboard
                data={data}
                teacherId={selectedTeacherId}
                schedule={lessons}
                timeInfo={timeInfo}
                now={now}
            />
        );
    }

    const todayLessons = periods.map(p => ({
        period: p,
        lesson: findLesson(selectedClassId, todayApiDay, p)
    }));

    const currentLesson = currentPeriod !== -1 ? findLesson(selectedClassId, todayApiDay, currentPeriod) : null;
    const upcomingLesson = nextPeriod !== -1 ? findLesson(selectedClassId, todayApiDay, nextPeriod) : null;

    const subject = currentLesson ? data.subjects.find(s => s.id === currentLesson.subject_id) : null;
    const teacher = currentLesson ? data.teachers.find(t => t.id === currentLesson.teacher_id) : null;

    const nextStartTime = nextPeriod !== -1 ? BELL_SCHEDULE.find(b => b.period === nextPeriod)?.start : null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Live Card */}
            <div
                className="md:col-span-2 accent-card flex flex-col justify-between min-h-[320px] shadow-2xl shadow-indigo-500/20 relative overflow-hidden group transition-all duration-700"
                style={{
                    background: (subject?.color && !isBreak)
                        ? `linear-gradient(135deg, ${subject.color}, ${subject.color}CC)`
                        : undefined
                }}
            >
                <div className="absolute -top-16 -right-16 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                    <Video size={200} />
                </div>

                <div>
                    <div className="status-badge mb-6 border-white/20 bg-black/20 backdrop-blur-md">
                        <div className={cn("live-dot", isBreak && "bg-amber-500 shadow-amber-500/50")} />
                        {isBreak ? (
                            `ПЕРЕРВА (до початку ${minutesLeft} хв)`
                        ) : currentPeriod !== -1 ? (
                            `ЗАРАЗ ІДЕ (${minutesLeft} хв залишилось)`
                        ) : (
                            "ЗАНЯТТЯ ЗАКІНЧЕНО"
                        )}
                    </div>
                    <h2 className="text-5xl font-black mb-2 tracking-tight group-hover:translate-x-1 transition-transform">
                        {isBreak ? "Час на каву ☕" : subject?.name || (currentPeriod === -1 ? "Вітаємо!" : "Вільне вікно")}
                    </h2>
                    <p className="text-white/80 text-xl font-bold flex items-center gap-2">
                        {isBreak ? "Готуйся до наступного уроку" : (
                            currentLesson ? (
                                `${teacher?.name} • Кабінет ${subject?.defaultRoom || '101'}`
                            ) : "Відпочивай"
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-4 mt-8">
                    <a
                        href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-premium w-fit flex items-center gap-2 group/btn"
                    >
                        <Video size={20} />
                        Приєднатися до Video 📹
                        <ChevronRight size={18} className="translate-x-0 group-hover/btn:translate-x-1 transition-transform" />
                    </a>
                </div>
            </div>

            {/* Next Lesson Card */}
            <div className="bento-card flex flex-col justify-between border-white/5 bg-[#1a1a1e] p-5 h-full">
                <div className="space-y-4">
                    <div className="text-[#a1a1aa] text-xs font-black uppercase tracking-widest flex justify-between items-center">
                        <span>НАСТУПНИЙ УРОК</span>
                        {!perfSettings.lowFrequencyClock && (
                            <span className="text-[10px] tabular-nums bg-white/5 px-2 py-1 rounded-md">
                                {now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        )}
                    </div>
                    <div className="text-[#22c55e] text-5xl font-black mb-1 tabular-nums">{nextStartTime || "--:--"}</div>
                </div>

                <div className="mt-auto">
                    <h3 className="text-2xl font-bold mb-1 line-clamp-2">
                        {upcomingLesson ? data.subjects.find(s => s.id === upcomingLesson.subject_id)?.name : "Сьогодні все"}
                    </h3>
                    <p className="text-[#a1a1aa] font-medium text-sm">
                        {upcomingLesson ? data.teachers.find(t => t.id === upcomingLesson.teacher_id)?.name : "Чудова робота!"}
                    </p>
                </div>
            </div>

            {/* Today's Schedule List */}
            <div className="md:col-span-3 bento-card border-white/5">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-[#a1a1aa] text-xs font-black uppercase tracking-widest">
                        РОЗКЛАД КЛАСУ НА СЬОГОДНІ
                    </h3>
                    <select
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="bg-white/5 border-none rounded-lg px-3 py-1 text-sm font-bold focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                    >
                        {sortedClasses.map(c => <option key={c.id} value={c.id} className="bg-[#18181b]">Клас {c.name}</option>)}
                    </select>
                </div>

                <div className="space-y-1">
                    {todayLessons.map(({ period, lesson }) => {
                        const sub = lesson ? data.subjects.find(s => s.id === lesson.subject_id) : null;
                        const isCurrent = period === currentPeriod;
                        const isPast = currentPeriod !== -1 && period < currentPeriod;
                        const sched = BELL_SCHEDULE.find(b => b.period === period);

                        return (
                            <div
                                key={period}
                                className={cn(
                                    "flex items-center gap-4 py-4 px-4 rounded-2xl transition-all duration-300",
                                    isCurrent ? "bg-white/5 border-l-4 border-[#6366f1] translate-x-1" : "hover:bg-white/[0.02]",
                                    isPast ? "opacity-40" : "opacity-100"
                                )}
                            >
                                <div className={cn(
                                    "w-16 font-black text-lg tabular-nums",
                                    isCurrent ? "text-[#6366f1]" : "text-[#a1a1aa]"
                                )}>
                                    {sched?.start || "--:--"}
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-lg">{sub?.name || "—"}</div>
                                    <div className="text-xs text-[#a1a1aa] font-black uppercase tracking-tight">
                                        {lesson ? data.teachers.find(t => t.id === lesson.teacher_id)?.name : "Вікно"}
                                    </div>
                                </div>
                                <div className={cn(
                                    "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest",
                                    getRoomColor(lesson?.room || sub?.defaultRoom)
                                )}>
                                    {lesson?.room || sub?.defaultRoom || "—"}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div >
    );
});

interface ByClassViewProps {
    data: ScheduleRequest;
    selectedClassId: string;
    setSelectedClassId: (id: string) => void;
    sortedClasses: ClassGroup[];
    apiDays: string[];
    days: string[];
    periods: number[];
    findLesson: (classId: string, day: string, period: number) => Lesson | null;
    getSubjectColor: (subjectId: string) => string;
    getConflicts: (teacherId: string, day: string, period: number, excludeClassId?: string) => string[];
    dragOverCell: any;
    setDragOverCell: (c: any) => void;
    draggedLesson: Lesson | null;
    setDraggedLesson: (l: Lesson | null) => void;
    processDrop: (classId: string, day: string, period: number, externalLesson?: any) => void;
    setEditingCell: (c: { classId: string, day: string, period: number } | null) => void;
    setViewingLesson: (c: { classId: string, day: string, period: number } | null) => void;
    isEditMode: boolean;
    isCompact: boolean;
    perfSettings: PerformanceSettings;
    getClassConflicts: (classId: string, day: string, period: number, excludeTeacherId?: string) => string[];
    userRole: 'admin' | 'teacher';
    selectedTeacherId: string | null;
}

const ByClassView = memo(({
    data, selectedClassId, setSelectedClassId, sortedClasses, apiDays, days, periods,
    findLesson, getSubjectColor, getConflicts, dragOverCell, setDragOverCell,
    draggedLesson, setDraggedLesson, processDrop, setEditingCell, setViewingLesson, isEditMode, isCompact, perfSettings,
    getClassConflicts, userRole, selectedTeacherId
}: ByClassViewProps) => {
    const { hoveredLesson, setHoveredLesson } = useHover();
    return (
        <div className={cn(!perfSettings.disableAnimations && "animate-in fade-in duration-300", isCompact ? "space-y-2" : "space-y-6")}>
            <div className={cn("flex flex-wrap", isCompact ? "gap-1" : "gap-2")}>
                {sortedClasses.map(cls => (
                    <button
                        key={cls.id}
                        onClick={() => setSelectedClassId(cls.id)}
                        className={cn(
                            "font-bold transition-all border",
                            isCompact ? "px-3 py-1 text-xs rounded-lg" : "px-4 py-2 rounded-xl",
                            selectedClassId === cls.id
                                ? "bg-indigo-600 border-indigo-500 text-white"
                                : "bg-[#18181b] border-white/5 text-[#a1a1aa] hover:border-white/20"
                        )}
                    >
                        {cls.name}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {apiDays.map((day, dIdx) => (
                    <div key={day} className={cn("bento-card border-white/5 bg-[#1a1a1e]", isCompact ? "p-2" : "p-4")}>
                        <h4 className={cn("text-[#a1a1aa] font-black text-center uppercase tracking-widest", isCompact ? "mb-0.5 text-[10px]" : "mb-4")}>{days[dIdx]}</h4>
                        <div className={isCompact ? "space-y-1" : "space-y-3"}>
                            {periods.map(p => {
                                const lesson = findLesson(selectedClassId, day, p);
                                const isUsed = !!lesson;

                                const subColor = lesson ? getSubjectColor(lesson.subject_id) : 'transparent';
                                const teacher = lesson ? data.teachers.find(t => t.id === lesson.teacher_id) : null;
                                const teacherConflicts = lesson ? getConflicts(lesson.teacher_id, day, p, selectedClassId) : [];
                                const classConflicts = lesson ? getClassConflicts(selectedClassId, day, p, lesson.teacher_id) : [];

                                const isDragOver = dragOverCell?.day === day && dragOverCell?.period === p && dragOverCell?.classId === selectedClassId;
                                const isDragging = draggedLesson?.day === day && draggedLesson?.period === p && draggedLesson?.class_id === selectedClassId;
                                const isTeacherHighlighted = hoveredLesson && lesson && lesson.teacher_id === hoveredLesson.teacher_id;
                                const isTeacherConflict = isTeacherHighlighted && hoveredLesson && day === hoveredLesson.day && p === hoveredLesson.period && (teacherConflicts.length > 0 || classConflicts.length > 0);

                                return (
                                    <div
                                        key={p}
                                        onMouseEnter={() => lesson && setHoveredLesson(lesson)}
                                        onMouseLeave={() => setHoveredLesson(null)}
                                        className={cn(
                                            "relative group cursor-pointer transition-all -mx-2 border-2",
                                            isCompact ? "p-1 rounded-md" : "p-2 rounded-lg",
                                            isDragOver ? "border-indigo-500 bg-indigo-500/10 scale-105 z-10" : "border-transparent",
                                            classConflicts.length > 0 && "ring-1 ring-violet-500/50 bg-violet-500/[0.02]",
                                            !perfSettings.disableAnimations && "hover:bg-white/5",
                                            isDragging ? "opacity-50" : "opacity-100",
                                            !isUsed && !isEditMode && "opacity-40",
                                            isTeacherHighlighted && (isTeacherConflict
                                                ? "ring-2 ring-amber-400 ring-inset animate-pulse z-30 brightness-200 shadow-[0_0_30px_rgba(251,191,36,0.8)] scale-110 bg-amber-500/20"
                                                : "ring-2 ring-white ring-inset animate-pulse z-20 brightness-200 shadow-[0_0_25px_rgba(255,255,255,0.6)] scale-105 bg-white/10"
                                            ),
                                            userRole === 'teacher' && selectedTeacherId && lesson && lesson.teacher_id !== selectedTeacherId && "opacity-20 grayscale scale-[0.95] blur-[0.5px] pointer-events-none",
                                            userRole === 'teacher' && selectedTeacherId && lesson && lesson.teacher_id === selectedTeacherId && "ring-2 ring-emerald-500 z-10 scale-105 shadow-[0_0_20px_rgba(16,185,129,0.4)] bg-emerald-500/10"
                                        )}
                                        onClick={() => isEditMode
                                            ? setEditingCell({ classId: selectedClassId, day, period: p })
                                            : (isUsed && setViewingLesson({ classId: selectedClassId, day, period: p }))
                                        }
                                        draggable={isEditMode && !!lesson}
                                        onDragStart={(e) => {
                                            if (isEditMode && lesson) {
                                                setDraggedLesson(lesson);
                                                e.dataTransfer.setData('text/plain', JSON.stringify(lesson));
                                                e.dataTransfer.effectAllowed = 'move';
                                            }
                                        }}
                                        onDragEnd={() => setDraggedLesson(null)}
                                        onDragOver={(e) => {
                                            if (isEditMode) {
                                                e.preventDefault();
                                                e.dataTransfer.dropEffect = 'move';
                                                setDragOverCell({ classId: selectedClassId, day, period: p });
                                            }
                                        }}
                                        onDragLeave={() => isEditMode && setDragOverCell(null)}
                                        onDrop={(e) => {
                                            if (isEditMode) {
                                                e.preventDefault();
                                                const data = e.dataTransfer.getData('lesson');
                                                const externalLesson = data ? JSON.parse(data) : undefined;
                                                processDrop(selectedClassId, day, p, externalLesson);
                                            }
                                        }}
                                    >
                                        <div className="absolute left-0 top-2 bottom-2 w-1 rounded-full group-hover:w-1.5 transition-all" style={{ backgroundColor: subColor }} />
                                        <div className={isCompact ? "pl-2" : "pl-3"}>
                                            <div className="text-[10px] text-[#a1a1aa] font-black flex items-center gap-2 leading-tight">
                                                <span>{p} УРОК</span>
                                                {(teacherConflicts.length > 0 || classConflicts.length > 0) && (
                                                    <div
                                                        className={classConflicts.length > 0 ? "text-violet-400" : "text-amber-500"}
                                                        title={classConflicts.length > 0
                                                            ? `Клас вже має іншого вчителя: ${classConflicts.join(', ')}`
                                                            : `Вчитель вже веде урок у: ${teacherConflicts.join(', ')} `
                                                        }
                                                    >
                                                        <AlertTriangle size={10} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className={cn("font-bold truncate min-h-[1rem] leading-tight", isCompact ? "text-xs" : "text-sm")}>
                                                {lesson ? data.subjects.find(s => s.id === lesson.subject_id)?.name : (isEditMode && <span className="text-white/20 italic text-[9px] lowercase opacity-50">Вільне вікно</span>)}
                                            </div>
                                            {teacher && (
                                                <div className={cn(
                                                    "text-[10px] font-bold truncate opacity-70 leading-tight",
                                                    classConflicts.length > 0 ? "text-violet-300" : "text-[#a1a1aa]"
                                                )}>
                                                    {teacher.name}
                                                </div>
                                            )}
                                        </div>
                                        {isEditMode && (
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="bg-white/10 p-1.5 rounded-lg text-white"><Pencil size={14} /></div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

interface MatrixViewProps {
    data: ScheduleRequest;
    activeGradeGroup: '1-4' | '5-9' | '10-11';
    setActiveGradeGroup: (group: '1-4' | '5-9' | '10-11') => void;
    matrixDay: string;
    setMatrixDay: (day: string) => void;
    findLesson: (classId: string, day: string, period: number) => Lesson | null;
    getConflicts: (teacherId: string, day: string, period: number, excludeClassId?: string) => string[];
    getSubjectColor: (subjectId: string) => string;
    getRoomColor: (room: string | undefined) => string;
    periods: number[];
    days: string[];
    apiDays: string[];
    sortedClasses: ClassGroup[];
    draggedLesson: Lesson | null;
    setDraggedLesson: (l: Lesson | null) => void;
    dragOverCell: any;
    setDragOverCell: (c: any) => void;
    processDrop: (classId: string, day: string, period: number, externalLesson?: any) => void;
    setEditingCell: (c: { classId: string, day: string, period: number } | null) => void;
    setViewingLesson: (c: { classId: string, day: string, period: number } | null) => void;
    isEditMode: boolean;
    isCompact: boolean;
    setIsCompact: (v: boolean) => void;
    isMonochrome: boolean;
    setIsMonochrome: (v: boolean) => void;
    lessons: Lesson[];
    perfSettings: PerformanceSettings;
    getClassConflicts: (classId: string, day: string, period: number, excludeTeacherId?: string) => string[];
    userRole: 'admin' | 'teacher';
    selectedTeacherId: string | null;
    showIcons: boolean;
    setShowIcons: (v: boolean) => void;
}

const MatrixView = memo(({
    data, activeGradeGroup, setActiveGradeGroup, matrixDay, setMatrixDay,
    findLesson, getConflicts, getClassConflicts, getSubjectColor, getRoomColor, periods, days, apiDays, sortedClasses,
    draggedLesson, setDraggedLesson, dragOverCell, setDragOverCell, processDrop, setEditingCell, setViewingLesson, isEditMode,
    isCompact, setIsCompact, isMonochrome, setIsMonochrome, lessons, perfSettings,
    userRole, selectedTeacherId, showIcons, setShowIcons
}: MatrixViewProps) => {
    const { hoveredLesson, setHoveredLesson } = useHover();
    const filteredClasses = sortedClasses.filter(cls => {
        const grade = parseInt(cls.name);
        if (activeGradeGroup === '1-4') return grade >= 1 && grade <= 4;
        if (activeGradeGroup === '5-9') return grade >= 5 && grade <= 9;
        if (activeGradeGroup === '10-11') return grade >= 10 && grade <= 11;
        return false;
    });

    const dayName = days[apiDays.indexOf(matrixDay)];

    return (
        <div className={cn("animate-in fade-in duration-300 h-full flex flex-col overflow-hidden", isCompact ? "space-y-1" : "space-y-6")}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                {!isCompact && (
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">
                            Загальний розклад
                        </h2>
                        <div className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest mt-1">
                            Вся школа • {dayName}
                        </div>
                    </div>
                )}

                <div className={cn("flex flex-wrap items-center gap-4", isCompact ? "ml-auto" : "")}>
                    {!isCompact && (
                        <>
                            <div className="flex bg-[#18181b] p-1 rounded-xl border border-white/5 overflow-x-auto">
                                {apiDays.map((day, idx) => (
                                    <button
                                        key={day}
                                        onClick={() => setMatrixDay(day)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-[10px] font-black transition-all whitespace-nowrap",
                                            matrixDay === day ? "bg-white/10 text-white" : "text-[#a1a1aa] hover:text-white"
                                        )}
                                    >
                                        {days[idx].toUpperCase()}
                                    </button>
                                ))}
                            </div>

                            <div className="flex bg-[#18181b] p-1 rounded-xl border border-white/5">
                                {(['1-4', '5-9', '10-11'] as const).map(group => (
                                    <button
                                        key={group}
                                        onClick={() => setActiveGradeGroup(group)}
                                        className={cn(
                                            "px-4 py-1.5 rounded-lg text-[10px] font-black transition-all whitespace-nowrap",
                                            activeGradeGroup === group ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-[#a1a1aa] hover:text-white"
                                        )}
                                    >
                                        {group}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    <div className="flex bg-[#18181b] p-1 rounded-xl border border-white/5">
                        <button
                            onClick={() => setIsMonochrome(!isMonochrome)}
                            className={cn(
                                "flex items-center gap-2 rounded-lg text-[10px] font-black transition-all whitespace-nowrap justify-center transition-all",
                                isCompact ? "w-[100px] px-2 py-1" : "w-[130px] px-3 py-1.5",
                                isMonochrome ? "text-[#a1a1aa] hover:text-white" : "bg-amber-600 text-white shadow-lg shadow-amber-500/20"
                            )}
                        >
                            <Droplet size={isCompact ? 12 : 14} />
                            {isMonochrome ? "КОЛІР: ВИМК." : "КОЛІР: УВІМК."}
                        </button>
                    </div>

                    <button
                        onClick={() => setShowIcons(!showIcons)}
                        className={cn(
                            "flex items-center gap-2 rounded-lg text-[10px] font-black transition-all whitespace-nowrap justify-center transition-all",
                            isCompact ? "w-[120px] px-2 py-1" : "w-[150px] px-3 py-1.5",
                            showIcons ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-[#a1a1aa] hover:text-white"
                        )}
                    >
                        <LayoutGrid size={isCompact ? 12 : 14} />
                        {showIcons ? "ІКОНКИ: УВІМК." : "ІКОНКИ: ВИМК."}
                    </button>

                    <button
                        onClick={() => setIsCompact(!isCompact)}
                        className={cn(
                            "flex items-center gap-2 rounded-lg text-[10px] font-black transition-all whitespace-nowrap justify-center transition-all",
                            isCompact ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 w-[120px] px-2 py-1" : "text-[#a1a1aa] hover:text-white w-[160px] px-3 py-1.5"
                        )}
                    >
                        <LayoutGrid size={isCompact ? 12 : 14} />
                        {isCompact ? "КОМПАКТ: УВІМК." : "КОМПАКТНО: ВИМК."}
                    </button>
                </div>
            </div>

            {isCompact ? (
                <div className="flex-1 overflow-hidden">
                    <CompactMatrixSchedule
                        data={data}
                        lessons={lessons}
                        periods={periods}
                        apiDays={apiDays}
                        days={days}
                        getSubjectColor={getSubjectColor}
                        getConflicts={getConflicts}
                        isEditMode={isEditMode}
                        onCellClick={(classId, day, period, lesson) => {
                            if (isEditMode) {
                                setEditingCell({ classId, day, period });
                            } else if (lesson) {
                                setViewingLesson({ classId, day, period });
                            }
                        }}
                        draggedLesson={draggedLesson}
                        setDraggedLesson={setDraggedLesson}
                        dragOverCell={dragOverCell}
                        setDragOverCell={setDragOverCell}
                        processDrop={processDrop}
                        isMonochrome={isMonochrome}
                        perfSettings={perfSettings}
                        getClassConflicts={getClassConflicts}
                        userRole={userRole}
                        selectedTeacherId={selectedTeacherId}
                        showIcons={showIcons}
                    />
                </div>
            ) : (

                <div className="bento-card border-white/5 overflow-hidden">
                    <div className="overflow-auto max-h-[70vh] custom-scrollbar">
                        <table className="w-full border-collapse text-left table-fixed">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="sticky top-0 left-0 z-30 bg-[#18181b] p-3 text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest text-center border-r border-white/5 w-[80px] shrink-0">
                                        ЧАС
                                    </th>
                                    {filteredClasses.map(cls => (
                                        <th key={cls.id} className={cn(
                                            "sticky top-0 z-20 bg-[#18181b] p-3 text-[11px] font-black text-white uppercase tracking-widest border-r border-white/5 w-[140px] min-w-[140px]",
                                            hoveredLesson?.class_id === cls.id && "bg-indigo-500/20 text-indigo-300 ring-1 ring-inset ring-indigo-500/30"
                                        )}>
                                            {cls.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {periods.map(p => (
                                    <tr key={p} className={cn(
                                        "border-b border-white/5 last:border-0 transition-colors",
                                        !perfSettings.disableAnimations && "hover:bg-white/[0.01]"
                                    )}>
                                        <th className="sticky left-0 z-10 bg-[#18181b] p-4 border-r border-white/5 text-center">
                                            <div className="text-lg font-black text-white leading-none">{p}</div>
                                            <div className="text-[8px] text-[#a1a1aa] font-black mt-1 opacity-50 uppercase">УРОК</div>
                                        </th>
                                        {filteredClasses.map(cls => {
                                            const lesson = findLesson(cls.id, matrixDay, p);
                                            const subject = lesson ? data.subjects.find(s => s.id === lesson.subject_id) : null;
                                            const teacher = lesson ? data.teachers.find(t => t.id === lesson.teacher_id) : null;
                                            const subColor = getSubjectColor(lesson?.subject_id || '');
                                            const teacherConflicts = lesson ? getConflicts(lesson.teacher_id, matrixDay, p, cls.id) : [];
                                            const classConflicts = lesson ? getClassConflicts(cls.id, matrixDay, p, lesson.teacher_id) : [];

                                            const isDragOver = dragOverCell?.day === matrixDay && dragOverCell?.period === p && dragOverCell?.classId === cls.id;
                                            const isDragging = draggedLesson?.day === matrixDay && draggedLesson?.period === p && draggedLesson?.class_id === cls.id;
                                            const isTeacherHighlighted = hoveredLesson && lesson && lesson.teacher_id === hoveredLesson.teacher_id;
                                            const isTeacherConflict = isTeacherHighlighted && hoveredLesson && matrixDay === hoveredLesson.day && p === hoveredLesson.period && (teacherConflicts.length > 0 || classConflicts.length > 0);

                                            // Check for recommendation
                                            const isRecommendedSlot = !lesson && hoveredLesson &&
                                                hoveredLesson.teacher_id &&
                                                hoveredLesson.class_id === cls.id && // REQUIREMENT: Only highlight for the target class row
                                                getConflicts(hoveredLesson.teacher_id, matrixDay, p).length === 0;

                                            return (
                                                <td
                                                    key={cls.id}
                                                    className={cn(
                                                        "p-1.5 border-r border-white/5 last:border-r-0 h-20 transition-all",
                                                        isDragOver && "bg-indigo-500/10",
                                                        hoveredLesson?.class_id === cls.id && !isDragOver && "bg-indigo-500/10 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]",
                                                        isRecommendedSlot && !isDragOver && "bg-emerald-500/15 shadow-[inset_0_0_25px_rgba(16,185,129,0.2)]"
                                                    )}
                                                    onDragOver={(e) => {
                                                        if (isEditMode) {
                                                            e.preventDefault();
                                                            e.dataTransfer.dropEffect = 'move';
                                                            setDragOverCell({ classId: cls.id, day: matrixDay, period: p });
                                                        }
                                                    }}
                                                    onDragLeave={() => isEditMode && setDragOverCell(null)}
                                                    onDrop={(e) => {
                                                        if (isEditMode) {
                                                            e.preventDefault();
                                                            const data = e.dataTransfer.getData('lesson');
                                                            const externalLesson = data ? JSON.parse(data) : undefined;
                                                            processDrop(cls.id, matrixDay, p, externalLesson);
                                                        }
                                                    }}
                                                >
                                                    {lesson ? (
                                                        <div
                                                            onMouseEnter={() => lesson && setHoveredLesson(lesson)}
                                                            onMouseLeave={() => setHoveredLesson(null)}
                                                            onClick={() => isEditMode
                                                                ? setEditingCell({ classId: cls.id, day: matrixDay, period: p })
                                                                : setViewingLesson({ classId: cls.id, day: matrixDay, period: p })
                                                            }
                                                            className={cn(
                                                                "h-full bg-white/[0.03] hover:bg-white/[0.06] rounded-lg p-2 border-l-4 transition-all group cursor-pointer shadow-sm active:scale-95 relative overflow-hidden",
                                                                isDragging ? "opacity-30 grayscale" : "opacity-100",
                                                                classConflicts.length > 0 && "ring-1 ring-inset ring-violet-500/30 bg-violet-500/[0.03]",
                                                                isTeacherHighlighted && (isTeacherConflict
                                                                    ? "ring-2 ring-amber-400 ring-inset animate-pulse z-30 brightness-200 shadow-[0_0_30px_rgba(251,191,36,0.8)] scale-[1.05] bg-amber-500/20"
                                                                    : "ring-2 ring-white ring-inset animate-pulse z-20 brightness-200 shadow-[0_0_25px_rgba(255,255,255,0.6)] scale-[1.03] bg-white/10"
                                                                ),
                                                                userRole === 'teacher' && selectedTeacherId && lesson && lesson.teacher_id !== selectedTeacherId && "opacity-20 grayscale scale-[0.98] blur-[0.5px] pointer-events-none",
                                                                userRole === 'teacher' && selectedTeacherId && lesson && lesson.teacher_id === selectedTeacherId && "ring-2 ring-emerald-500 z-10 scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-emerald-500/10",
                                                            )}
                                                            style={{ borderLeftColor: subColor }}
                                                            draggable={isEditMode}
                                                            onDragStart={(e) => {
                                                                if (isEditMode) {
                                                                    setDraggedLesson(lesson);
                                                                    e.dataTransfer.setData('text/plain', JSON.stringify(lesson));
                                                                    e.dataTransfer.effectAllowed = 'move';
                                                                }
                                                            }}
                                                            onDragEnd={() => {
                                                                setDraggedLesson(null);
                                                                setDragOverCell(null);
                                                            }}
                                                        >
                                                            {(teacherConflicts.length > 0 || classConflicts.length > 0) && (
                                                                <div
                                                                    className={cn(
                                                                        "absolute top-1 right-1 rounded-full p-1 z-10",
                                                                        classConflicts.length > 0 ? "text-violet-400 bg-violet-950/60" : "text-amber-500 bg-black/50"
                                                                    )}
                                                                    title={classConflicts.length > 0
                                                                        ? `Клас вже має іншого вчителя: ${classConflicts.join(', ')}`
                                                                        : `Вчитель вже веде урок у: ${teacherConflicts.join(', ')} `
                                                                    }
                                                                >
                                                                    <AlertTriangle size={12} />
                                                                </div>
                                                            )}
                                                            <div className="text-xs font-black text-white group-hover:text-indigo-400 transition-colors truncate relative z-0">
                                                                {subject?.name}
                                                            </div>
                                                            <div className="flex justify-between items-end mt-2">
                                                                <div className="text-[10px] font-bold text-[#a1a1aa] truncate mr-2">
                                                                    {teacher?.name.split(' ').slice(0, 2).join(' ')}
                                                                </div>
                                                                <div className={cn(
                                                                    "text-[8px] font-black px-1.5 py-0.5 rounded transition-colors uppercase tracking-tight",
                                                                    getRoomColor(lesson?.room || subject?.defaultRoom)
                                                                )}>
                                                                    {lesson?.room || subject?.defaultRoom || '—'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            onClick={() => isEditMode
                                                                ? setEditingCell({ classId: cls.id, day: matrixDay, period: p })
                                                                : setViewingLesson({ classId: cls.id, day: matrixDay, period: p })
                                                            }
                                                            className={cn(
                                                                "h-full rounded-xl border border-dashed border-white/5 flex items-center justify-center bg-black/5 opacity-30 hover:opacity-100 hover:border-white/20 transition-all cursor-pointer group",
                                                                isRecommendedSlot && "opacity-100 bg-emerald-500/20 border-emerald-500/50 border-solid shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-2 ring-emerald-500/20 ring-offset-2 ring-offset-[#0f0f11] animate-pulse-slow"
                                                            )}
                                                        >
                                                            <div className="text-[8px] font-black text-[#a1a1aa] uppercase tracking-widest group-hover:text-white">
                                                                {isEditMode ? (
                                                                    <>
                                                                        <div className={cn(
                                                                            "mr-1 inline-block",
                                                                            isRecommendedSlot ? "text-emerald-400 scale-125 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "text-white"
                                                                        )}>
                                                                            <Plus size={isRecommendedSlot ? 18 : 14} className="mx-auto mb-1" />
                                                                        </div>
                                                                        <span className={isRecommendedSlot ? "text-emerald-400 font-black text-[10px]" : ""}>
                                                                            {isRecommendedSlot ? "ВСТАВИТИ СЮДИ" : "Додати"}
                                                                        </span>
                                                                    </>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )
            }
        </div >
    );
});

interface TeachersMasterViewProps {
    data: ScheduleRequest;
    masterDay: string;
    setMasterDay: (day: string) => void;
    findAllLessonsByTeacher: (teacherId: string, day: string, period: number) => Lesson[];
    getRoomColor: (room: string | undefined) => string;
    getSubjectColor: (subjectId: string) => string;
    getConflicts: (teacherId: string, day: string, period: number, excludeClassId?: string) => string[];
    periods: number[];
    days: string[];
    apiDays: string[];
    setViewingLesson: (c: { classId: string, day: string, period: number } | null) => void;
    isEditMode: boolean;
    setEditingTeacherCell: (c: { teacherId: string, day: string, period: number } | null) => void;
    getTeacherStats: (teacherId: string) => { totalHours: number, days: number };
    isCompact: boolean;
    setIsCompact: (val: boolean) => void;
    isMonochrome: boolean;
    setIsMonochrome: (val: boolean) => void;
    lessons: Lesson[];
    draggedLesson: Lesson | null;
    setDraggedLesson: (l: Lesson | null) => void;
    dragOverCell: any;
    setDragOverCell: (c: any) => void;
    processTeacherDrop: (teacherId: string, day: string, period: number, externalLesson?: any) => void;
    perfSettings: PerformanceSettings;
    getClassConflicts: (classId: string, day: string, period: number, excludeTeacherId?: string) => string[];
}

const TeachersMasterView = memo(({
    data, masterDay, setMasterDay, findAllLessonsByTeacher, getRoomColor, getSubjectColor, getConflicts, getClassConflicts,
    periods, days, apiDays, setViewingLesson, isEditMode, setEditingTeacherCell, getTeacherStats, isCompact, setIsCompact, isMonochrome, setIsMonochrome, lessons,
    draggedLesson, setDraggedLesson, dragOverCell, setDragOverCell, processTeacherDrop, perfSettings,
}: TeachersMasterViewProps) => {
    const { hoveredLesson, setHoveredLesson } = useHover();
    const [searchQuery, setSearchQuery] = useState('');
    const deferredSearchQuery = useDeferredValue(searchQuery);

    const filteredTeachers = useMemo(() => {
        const query = deferredSearchQuery.toLowerCase();
        return data.teachers.filter(t => t.name.toLowerCase().includes(query))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [data.teachers, deferredSearchQuery]);

    const dayName = days[apiDays.indexOf(masterDay)];
    // Access lessons from parent Scope (ScheduleGrid)
    // Actually, we should pass lessons as a prop or rely on the fact that this is defined inside ScheduleGrid?
    // Wait, TeachersMasterView IS defined OUTSIDE of ScheduleGrid in this file currently.
    // I need to make sure the props are correct.

    // I will check the props in TeachersMasterViewProps again.
    // It doesn't have 'lessons'. I should add it or use the data we have.
    // Actually, lessons are available in the ScheduleGrid scope, but this component is outside.
    // I will modify the props to include lessons.

    return (
        <div className={cn("animate-in fade-in duration-300 h-full flex flex-col overflow-hidden", isCompact ? "space-y-1" : "space-y-6")}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                {!isCompact && (
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Розклад вчителів</h2>
                        <div className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest mt-1">
                            Всі викладачі • {dayName}
                        </div>
                    </div>
                )}

                <div className={cn("flex flex-wrap items-center gap-6", isCompact ? "ml-auto" : "")}>
                    {/* Teacher Search & Stats */}
                    <div className={cn("flex items-center gap-4 bg-[#18181b]/50 backdrop-blur-md rounded-xl border border-white/5 shadow-xl transition-all", isCompact ? "p-0.5 px-2" : "p-1 px-3")}>
                        <div className="flex items-center gap-2 border-r border-white/5 pr-3 mr-1">
                            <div className="relative">
                                <Users size={isCompact ? 12 : 14} className="text-indigo-400" />
                                <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                            </div>
                            <span className="text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">
                                <span>{filteredTeachers.length}</span> / {data.teachers.length}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Search size={isCompact ? 10 : 12} className="text-white/20" />
                            <input
                                type="text"
                                placeholder="ПОШУК..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {!isCompact && (
                        <div className="flex bg-[#18181b] p-1 rounded-xl border border-white/5 overflow-x-auto">
                            {apiDays.map((day, idx) => (
                                <button
                                    key={day}
                                    onClick={() => setMasterDay(day)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-[10px] font-black transition-all whitespace-nowrap",
                                        masterDay === day ? "bg-white/10 text-white" : "text-[#a1a1aa] hover:text-white"
                                    )}
                                >
                                    {days[idx].toUpperCase()}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex bg-[#18181b] p-1 rounded-xl border border-white/5">
                        <button
                            onClick={() => setIsMonochrome(!isMonochrome)}
                            className={cn(
                                "flex items-center gap-2 rounded-lg text-[10px] font-black transition-all whitespace-nowrap justify-center transition-all",
                                isCompact ? "w-[100px] px-2 py-1" : "w-[130px] px-3 py-1.5",
                                isMonochrome ? "text-[#a1a1aa] hover:text-white" : "bg-amber-600 text-white shadow-lg shadow-amber-500/20"
                            )}
                        >
                            <Droplet size={isCompact ? 12 : 14} />
                            {isMonochrome ? "КОЛІР: ВИМК." : "КОЛІР: УВІМК."}
                        </button>
                    </div>

                    <div className="flex bg-[#18181b] p-1 rounded-xl border border-white/5">
                        <button
                            onClick={() => setIsCompact(!isCompact)}
                            className={cn(
                                "flex items-center gap-2 rounded-lg text-[10px] font-black transition-all whitespace-nowrap justify-center transition-all",
                                isCompact ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 w-[120px] px-2 py-1" : "text-[#a1a1aa] hover:text-white w-[160px] px-3 py-1.5"
                            )}
                        >
                            <LayoutGrid size={isCompact ? 12 : 14} />
                            {isCompact ? "КОМПАКТ: УВІМК." : "КОМПАКТНО: ВИМК."}
                        </button>
                    </div>
                </div>
            </div>

            {isCompact ? (
                <CompactTeacherSchedule
                    data={data}
                    lessons={lessons}
                    periods={periods}
                    apiDays={apiDays}
                    days={days}
                    getSubjectColor={getSubjectColor}
                    getConflicts={getConflicts}
                    isEditMode={isEditMode}
                    onCellClick={(teacherId, day, period, lesson) => {
                        if (isEditMode) {
                            setEditingTeacherCell({ teacherId, day, period });
                        } else if (lesson) {
                            setViewingLesson({ classId: lesson.class_id, day, period });
                        }
                    }}
                    draggedLesson={draggedLesson}
                    setDraggedLesson={setDraggedLesson}
                    dragOverCell={dragOverCell}
                    setDragOverCell={setDragOverCell}
                    processTeacherDrop={processTeacherDrop}
                    isMonochrome={isMonochrome}
                    searchQuery={deferredSearchQuery}
                    perfSettings={perfSettings}
                    getClassConflicts={getClassConflicts}
                />
            ) : (
                <div className="bento-card border-white/5 overflow-hidden flex-1 flex flex-col">
                    <div className="overflow-auto custom-scrollbar flex-1">
                        <table className="w-full border-separate border-spacing-0 text-left table-fixed">
                            <thead>
                                <tr>
                                    <th className="sticky top-0 left-0 z-50 bg-[#18181b] p-3 text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest text-center border-b border-r border-white/5 w-[160px] shrink-0">
                                        ВИКЛАДАЧ
                                    </th>
                                    {periods.map(p => (
                                        <th key={p} className="sticky top-0 z-40 bg-[#18181b] p-3 text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest border-b border-r border-white/5 w-[140px] min-w-[140px] text-center">
                                            {p}<br />
                                            <span className="text-[8px] opacity-50 font-black">УРОК</span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTeachers.map(teacher => {
                                    const teacherPlan = data.plan.filter(p => p.teacher_id === teacher.id);
                                    const mainSubject = data.subjects.find(s => s.id === (teacherPlan[0]?.subject_id || ''))?.name || "—";

                                    return (
                                        <tr key={teacher.id} className={cn(
                                            "group transition-colors",
                                            !perfSettings.disableAnimations && "hover:bg-white/[0.01]"
                                        )}>
                                            <td className="sticky left-0 z-30 bg-[#18181b] p-4 border-b border-r border-white/5 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white text-[10px] font-black uppercase group-hover:bg-indigo-500 transition-all duration-500 overflow-hidden border border-white/5">
                                                        {teacher.photo && !perfSettings.hidePhotos ? (
                                                            <img src={teacher.photo} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <span className="text-sm font-black text-white">{teacher.name.slice(0, 1)}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col min-w-0 items-center">
                                                        <span className="font-black text-white uppercase truncate text-xs">
                                                            {teacher.name.split(' ').slice(0, 2).join(' ')}
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[9px] font-black text-[#a1a1aa] uppercase tracking-tighter opacity-70 truncate">{mainSubject}</span>
                                                            <span className="text-[8px] px-1 bg-white/5 rounded text-[#a1a1aa] font-black uppercase tracking-tighter shrink-0">
                                                                {getTeacherStats(teacher.id).totalHours}г / {getTeacherStats(teacher.id).days}д
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            {periods.map(p => {
                                                const teacherLessons = findAllLessonsByTeacher(teacher.id, masterDay, p);
                                                const hasLessons = teacherLessons.length > 0;

                                                const handleClick = (lesson?: Lesson) => {
                                                    if (isEditMode) {
                                                        setEditingTeacherCell({ teacherId: teacher.id, day: masterDay, period: p });
                                                    } else if (lesson) {
                                                        setViewingLesson({ classId: lesson.class_id, day: masterDay, period: p });
                                                    }
                                                };

                                                const isTeacherHighlighted = hoveredLesson && (
                                                    (teacherLessons.some(l => l.teacher_id === hoveredLesson.teacher_id) && masterDay === hoveredLesson.day && p === hoveredLesson.period) ||
                                                    (teacherLessons.some(l => l.class_id === hoveredLesson.class_id) && masterDay === hoveredLesson.day && p === hoveredLesson.period)
                                                );

                                                const hasOtherClasses = teacherLessons.some(l => getConflicts(l.teacher_id, masterDay, p, l.class_id).length > 0);
                                                const hasOtherTeachers = teacherLessons.some(l => getClassConflicts(l.class_id, masterDay, p, l.teacher_id).length > 0);
                                                const isActualConflict = isTeacherHighlighted && (teacherLessons.length > 1 || hasOtherClasses || hasOtherTeachers);

                                                // Check for recommendation in Teacher View
                                                const isRecommendedSlot = !hasLessons && hoveredLesson &&
                                                    hoveredLesson.teacher_id === teacher.id &&
                                                    // REQUIREMENT: Valid only if the target class is free (no other teacher teaches this class at this time)
                                                    getClassConflicts(hoveredLesson.class_id, masterDay, p).length === 0 &&
                                                    findAllLessonsByTeacher(teacher.id, masterDay, p).length === 0;

                                                return (
                                                    <td key={p} className={cn(
                                                        "p-2 border-b border-r border-white/5 h-[80px] transition-all",
                                                        isTeacherHighlighted && (isActualConflict
                                                            ? "bg-amber-500/20 ring-2 ring-inset ring-amber-400 animate-pulse z-30 shadow-[0_0_30px_rgba(251,191,36,0.8)] scale-105"
                                                            : "bg-white/10 ring-2 ring-inset ring-white animate-pulse z-20 shadow-[0_0_25px_rgba(255,255,255,0.4)] scale-105"
                                                        )
                                                    )}
                                                        onDragOver={(e) => {
                                                            if (isEditMode) {
                                                                e.preventDefault();
                                                                e.dataTransfer.dropEffect = 'move';
                                                                setDragOverCell({ teacherId: teacher.id, day: masterDay, period: p });
                                                            }
                                                        }}
                                                        onDragLeave={() => isEditMode && setDragOverCell(null)}
                                                        onDrop={(e) => {
                                                            if (isEditMode) {
                                                                e.preventDefault();
                                                                const data = e.dataTransfer.getData('lesson');
                                                                const externalLesson = data ? JSON.parse(data) : undefined;
                                                                processTeacherDrop(teacher.id, masterDay, p, externalLesson);
                                                            }
                                                        }}
                                                    >
                                                        {hasLessons ? (
                                                            <div className="flex flex-col gap-1 h-full justify-center">
                                                                {teacherLessons.map((lesson, idx) => {
                                                                    const cls = data.classes.find(c => c.id === lesson.class_id);
                                                                    const room = lesson.room || data.subjects.find(s => s.id === lesson.subject_id)?.defaultRoom;
                                                                    const subjectName = data.subjects.find(s => s.id === lesson.subject_id)?.name || "";

                                                                    return (
                                                                        <div
                                                                            key={idx}
                                                                            onMouseEnter={() => lesson && setHoveredLesson(lesson)}
                                                                            onMouseLeave={() => setHoveredLesson(null)}
                                                                            onClick={() => handleClick(lesson)}
                                                                            className={cn(
                                                                                "w-full bg-white/[0.03] hover:bg-white/[0.06] rounded-lg p-2 border-l-4 transition-all group/card cursor-pointer shadow-sm active:scale-95 relative overflow-hidden",
                                                                                teacherLessons.length > 1 ? "flex-1" : "h-full",
                                                                                isTeacherHighlighted && (isActualConflict
                                                                                    ? "ring-2 ring-amber-400 ring-inset animate-pulse z-30 brightness-200 shadow-[0_0_30px_rgba(251,191,36,0.8)] scale-[1.05] bg-amber-500/20"
                                                                                    : "ring-2 ring-white ring-inset animate-pulse z-20 brightness-200 shadow-[0_0_25px_rgba(255,255,255,0.6)] scale-[1.03] bg-white/10"
                                                                                ),
                                                                            )}
                                                                            style={{ borderLeftColor: getSubjectColor(lesson.subject_id) }}
                                                                        >
                                                                            <div className="text-xs font-black text-white group-hover/card:text-indigo-400 transition-colors truncate relative z-0">
                                                                                {cls?.name}
                                                                            </div>
                                                                            <div className="flex justify-between items-end mt-2">
                                                                                <div className="text-[10px] font-bold text-[#a1a1aa] truncate mr-2 uppercase tracking-tighter">
                                                                                    {subjectName}
                                                                                </div>
                                                                                <div className={cn(
                                                                                    "text-[8px] font-black px-1.5 py-0.5 rounded transition-colors uppercase tracking-tight",
                                                                                    getRoomColor(room)
                                                                                )}>
                                                                                    {room || '—'}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <div
                                                                onClick={() => handleClick()}
                                                                className={cn(
                                                                    "h-full rounded-xl border border-dashed border-white/5 flex items-center justify-center bg-black/5 opacity-30 hover:opacity-100 hover:border-white/20 transition-all cursor-pointer group/empty",
                                                                    isRecommendedSlot && "opacity-100 bg-emerald-500/20 border-emerald-500/50 border-solid shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-2 ring-emerald-500/20 ring-offset-2 ring-offset-[#0f0f11] animate-pulse-slow"
                                                                )}
                                                            >
                                                                <div className="text-[8px] font-black text-[#a1a1aa] uppercase tracking-widest group-hover/empty:text-white text-center">
                                                                    {isEditMode ? (
                                                                        <>
                                                                            <div className={cn(
                                                                                "mb-1",
                                                                                isRecommendedSlot ? "text-emerald-400 scale-125 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "text-white"
                                                                            )}>
                                                                                <Plus size={isRecommendedSlot ? 18 : 14} className="mx-auto" />
                                                                            </div>
                                                                            <span className={isRecommendedSlot ? "text-emerald-400 font-black text-[9px]" : ""}>
                                                                                {isRecommendedSlot ? "ВСТАВИТИ СЮДИ" : "ДОДАТИ"}
                                                                            </span>
                                                                        </>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
});

// --- Main ScheduleGrid Component ---

export function ScheduleGrid({
    data, schedule, onScheduleChange, isEditMode, setIsEditMode, isCompact, setIsCompact, viewType, setViewType, perfSettings,
    userRole, selectedTeacherId, isHeaderCollapsed, setIsHeaderCollapsed
}: ScheduleGridProps) {
    const [selectedClassId, setSelectedClassId] = useState<string>(data.classes[0]?.id || '');
    const [editingCell, setEditingCell] = useState<{ classId: string, day: string, period: number } | null>(null);
    const [editingTeacherCell, setEditingTeacherCell] = useState<{ teacherId: string, day: string, period: number } | null>(null);
    const [viewingLesson, setViewingLesson] = useState<{ classId: string, day: string, period: number } | null>(null);
    const [isMonochrome, setIsMonochrome] = useState(false);
    const [showIcons, setShowIcons] = useState(false);
    // hoveredLesson state is now passed from parent


    // Drag and Drop State
    const [draggedLesson, setDraggedLesson] = useState<Lesson | null>(null);
    const [dragOverCell, setDragOverCell] = useState<{
        classId?: string,
        teacherId?: string,
        day: string,
        period: number
    } | null>(null);

    // Extract lessons safely from the response
    const lessons = (schedule.status === 'success' || schedule.status === 'conflict') ? schedule.schedule : [];
    const effectiveIsCompact = isCompact && (viewType === 'matrix' || viewType === 'teachers');

    // Helper to find a lesson
    const findLesson = useCallback((classId: string, day: string, period: number): Lesson | null => {
        return lessons.find(l =>
            l.class_id === classId &&
            l.day === day &&
            l.period === period
        ) || null;
    }, [lessons]);
    const [dragConfirm, setDragConfirm] = useState<{
        type: 'swap' | 'move';
        source: Lesson;
        target: {
            classId?: string,
            teacherId?: string,
            day: string,
            period: number,
            lesson?: Lesson | null,
            lessons?: Lesson[]
        };
        conflicts: string[]; // List of conflict messages
    } | null>(null);
    const [activeGradeGroup, setActiveGradeGroup] = useState<'1-4' | '5-9' | '10-11'>('5-9');
    const [matrixDay, setMatrixDay] = useState<string>(''); // Will be set in useEffect or useMemo
    const [masterDay, setMasterDay] = useState<string>('');

    // Filter teachers for Teacher View
    const visibleTeachers = useMemo(() => {
        if (userRole === 'teacher' && selectedTeacherId) {
            return data.teachers.filter(t => t.id === selectedTeacherId);
        }
        return data.teachers;
    }, [data.teachers, userRole, selectedTeacherId]);

    const getRoomColor = (room: string | undefined) => {
        if (!room) return 'bg-white/5 text-[#a1a1aa]';
        const firstChar = room.trim()[0];
        switch (firstChar) {
            case '1': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'; // 1st floor - Green
            case '2': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'; // 2nd floor - Blue
            case '3': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'; // 3rd floor - Orange
            case '4': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20'; // 4th floor - Red
            default: return 'bg-white/10 text-white border border-white/10';
        }
    };

    const handleSaveLesson = (classId: string, day: string, period: number, subjectId: string, teacherId: string, room?: string) => {
        const currentLessons = (schedule.status === 'success' || schedule.status === 'conflict') ? schedule.schedule : [];
        let updatedLessons = [...currentLessons];

        // Remove existing lesson at this cell
        updatedLessons = updatedLessons.filter(l =>
            !(l.class_id === classId && l.day === day && l.period === period)
        );

        // Add new lesson only if subjectId and teacherId are provided
        if (subjectId && teacherId) {
            updatedLessons.push({
                class_id: classId,
                subject_id: subjectId,
                teacher_id: teacherId,
                day,
                period,
                room: room || undefined // Ensure room is undefined if empty string
            });
        }

        const newResponse: ScheduleResponse = schedule.status === 'conflict'
            ? { status: 'conflict', schedule: updatedLessons, violations: schedule.violations }
            : { status: 'success', schedule: updatedLessons };
        onScheduleChange(newResponse);
        setEditingCell(null);
    };

    // Redundant BELL_SCHEDULE removed

    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = perfSettings.lowFrequencyClock ? 60000 : 1000;
        const timer = setInterval(() => setNow(new Date()), interval);
        return () => clearInterval(timer);
    }, [perfSettings.lowFrequencyClock]);

    const timeInfo = useMemo(() => {
        const h = now.getHours();
        const m = now.getMinutes();
        const currentTimeInMinutes = h * 60 + m;

        const dayIndex = now.getDay(); // 0 is Sunday, 1 is Monday...
        const apiDaysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const todayApiDay = apiDaysMap[dayIndex] || "Mon";

        let currentPeriod = -1;
        let isBreak = false;
        let minutesLeft = 0;
        let nextPeriod = -1;

        for (let i = 0; i < BELL_SCHEDULE.length; i++) {
            const b = BELL_SCHEDULE[i];
            const [sH, sM] = b.start.split(':').map(Number);
            const [eH, eM] = b.end.split(':').map(Number);
            const startMins = sH * 60 + sM;
            const endMins = eH * 60 + eM;

            if (currentTimeInMinutes >= startMins && currentTimeInMinutes < endMins) {
                currentPeriod = b.period;
                minutesLeft = endMins - currentTimeInMinutes;
                nextPeriod = BELL_SCHEDULE[i + 1]?.period || -1;
                break;
            }

            if (i < BELL_SCHEDULE.length - 1) {
                const nextB = BELL_SCHEDULE[i + 1];
                const [nextSH, nextSM] = nextB.start.split(':').map(Number);
                const nextStartMins = nextSH * 60 + nextSM;

                if (currentTimeInMinutes >= endMins && currentTimeInMinutes < nextStartMins) {
                    isBreak = true;
                    minutesLeft = nextStartMins - currentTimeInMinutes;
                    nextPeriod = nextB.period;
                    break;
                }
            }
        }

        // If before first lesson
        const first = BELL_SCHEDULE[0];
        const [fSH, fSM] = first.start.split(':').map(Number);
        const firstStart = fSH * 60 + fSM;
        if (currentTimeInMinutes < firstStart) {
            isBreak = true;
            minutesLeft = firstStart - currentTimeInMinutes;
            nextPeriod = first.period;
        }

        return { todayApiDay, currentPeriod, isBreak, minutesLeft, nextPeriod };
    }, [now]);

    const periods = [0, 1, 2, 3, 4, 5, 6, 7];

    useEffect(() => {
        if (!matrixDay && timeInfo.todayApiDay) setMatrixDay(timeInfo.todayApiDay);
        if (!masterDay && timeInfo.todayApiDay) setMasterDay(timeInfo.todayApiDay);
    }, [timeInfo.todayApiDay]);

    const getConflicts = useCallback((teacherId: string, day: string, period: number, excludeClassId?: string): string[] => {
        return lessons
            .filter(l =>
                l.teacher_id === teacherId &&
                l.day === day &&
                l.period === period &&
                l.class_id !== excludeClassId
            )
            .map(l => data.classes.find(c => c.id === l.class_id)?.name || '???');
    }, [lessons, data.classes]);

    const getClassConflicts = useCallback((classId: string, day: string, period: number, excludeTeacherId?: string): string[] => {
        return lessons
            .filter(l =>
                l.class_id === classId &&
                l.day === day &&
                l.period === period &&
                l.teacher_id !== excludeTeacherId
            )
            .map(l => data.teachers.find(t => t.id === l.teacher_id)?.name || '???');
    }, [lessons, data.teachers]);

    const getSubjectColor = useCallback((subjectId: string) => {
        const subject = data.subjects.find(s => s.id === subjectId);
        if (subject?.color) return subject.color;
        const palette = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
        const index = data.subjects.findIndex(s => s.id === subjectId);
        return palette[index % palette.length];
    }, [data.subjects]);

    const days = ["Пн", "Вт", "Ср", "Чт", "Пт"];
    const apiDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const sortedClasses = useMemo(() =>
        ([...data.classes].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))),
        [data.classes]
    );

    if (!schedule || !lessons) return null;

    // --- Drag and Drop Logic ---

    const executeDragAction = useCallback(() => {
        if (!dragConfirm) return;
        const { source, target } = dragConfirm;
        let updatedLessons = [...lessons];

        // Remove source
        if (!source.isUnscheduled) {
            updatedLessons = updatedLessons.filter(l =>
                !(l.class_id === source.class_id && l.day === source.day && l.period === source.period)
            );
        }

        if (dragConfirm.type === 'swap') {
            // Remove target
            updatedLessons = updatedLessons.filter(l =>
                !(l.class_id === target.classId && l.day === target.day && l.period === target.period)
            );
            // Add target at source position
            if (target.lesson) {
                updatedLessons.push({
                    ...target.lesson,
                    teacher_id: source.teacher_id,
                    day: source.day,
                    period: source.period
                });
            }
        }

        // Add source at target position
        // If source was unscheduled, it doesn't have old day/period.
        // But here we are in executeDragAction, where source is expected to be a lesson object.
        // If isUnscheduled, we just add it.
        updatedLessons.push({
            ...source,
            class_id: target.classId || source.class_id,
            teacher_id: target.teacherId || source.teacher_id,
            day: target.day,
            period: target.period,
            room: (target.teacherId && target.teacherId !== source.teacher_id)
                ? (data.subjects.find(s => s.id === source.subject_id)?.defaultRoom || source.room)
                : (source.room || data.subjects.find(s => s.id === source.subject_id)?.defaultRoom)
        });

        const newResponse: ScheduleResponse = schedule.status === 'conflict'
            ? { status: 'conflict', schedule: updatedLessons, violations: schedule.violations }
            : { status: 'success', schedule: updatedLessons };

        onScheduleChange(newResponse);
        setDragConfirm(null);
        setDraggedLesson(null);
    }, [dragConfirm, lessons, data.subjects, onScheduleChange, schedule]);

    const processDrop = useCallback((targetClassId: string, targetDay: string, targetPeriod: number, externalLesson?: any) => {
        const sourceLesson = externalLesson || draggedLesson;
        if (!sourceLesson) return;

        // Verify if we are dropping on itself (only for existing lessons)
        if (!sourceLesson.isUnscheduled && sourceLesson.class_id === targetClassId && sourceLesson.day === targetDay && sourceLesson.period === targetPeriod) {
            return;
        }

        const targetLesson = findLesson(targetClassId, targetDay, targetPeriod);
        const conflicts: string[] = [];

        const sourceTeacherBusy = getConflicts(sourceLesson.teacher_id, targetDay, targetPeriod, targetClassId);
        if (sourceTeacherBusy.length > 0) {
            const teacherName = data.teachers.find(t => t.id === sourceLesson.teacher_id)?.name;
            conflicts.push(`${teacherName} вже має урок у ${sourceTeacherBusy.join(', ')} `);
        }

        if (targetLesson) {
            // For unscheduled lessons, we are technically "swapping" in meaningful way?
            // Usually we just want to place it. If there is a target lesson, we might replace it.
            // But if replacing, where does the old one go?
            // 1. If source is unscheduled, old one stays removed (gone to panel)? Or we prevent drop?
            // Let's assume we proceed with 'swap' logic only if source is existing. 
            // If source is unscheduled, we probably act as 'overwrite' but warn.

            const targetTeacherBusy = getConflicts(targetLesson.teacher_id, sourceLesson.day, sourceLesson.period, targetClassId);
            // Note: sourceLesson.day/period might be undefined for unscheduled lessons
            if (!sourceLesson.isUnscheduled && targetTeacherBusy.length > 0) {
                const teacherName = data.teachers.find(t => t.id === targetLesson.teacher_id)?.name;
                conflicts.push(`${teacherName} вже має урок у ${targetTeacherBusy.join(', ')} `);
            }
        }

        if (targetLesson || conflicts.length > 0 || sourceLesson.isUnscheduled) {
            // For unscheduled, we treat as 'move' (insert), effectively.
            // If target exists, confirmation needed.
            setDragConfirm({
                type: (targetLesson && !sourceLesson.isUnscheduled) ? 'swap' : 'move',
                source: sourceLesson,
                target: { classId: targetClassId, day: targetDay, period: targetPeriod, lesson: targetLesson },
                conflicts
            });
        } else {
            let updatedLessons = [...lessons];

            // If it's an existing lesson, remove it from old position
            if (!sourceLesson.isUnscheduled) {
                updatedLessons = updatedLessons.filter(l =>
                    !(l.class_id === sourceLesson.class_id && l.day === sourceLesson.day && l.period === sourceLesson.period)
                );
            }

            // check if room is needed
            const subject = data.subjects.find(s => s.id === sourceLesson.subject_id);
            const room = sourceLesson.room || subject?.defaultRoom;

            updatedLessons.push({
                ...sourceLesson,
                class_id: targetClassId,
                day: targetDay,
                period: targetPeriod,
                room: room
            });

            const newResponse: ScheduleResponse = schedule.status === 'conflict'
                ? { status: 'conflict', schedule: updatedLessons, violations: schedule.violations }
                : { status: 'success', schedule: updatedLessons };

            onScheduleChange(newResponse);
            setDraggedLesson(null);
        }
        setDragOverCell(null);
    }, [draggedLesson, lessons, data.teachers, data.subjects, getConflicts, schedule, onScheduleChange]);

    const processTeacherDrop = useCallback((targetTeacherId: string, targetDay: string, targetPeriod: number, externalLesson?: any) => {
        const sourceLesson = externalLesson || draggedLesson;
        if (!sourceLesson) return;

        if (!sourceLesson.isUnscheduled && sourceLesson.teacher_id === targetTeacherId && sourceLesson.day === targetDay && sourceLesson.period === targetPeriod) {
            return;
        }

        const targetLessons = findAllLessonsByTeacher(targetTeacherId, targetDay, targetPeriod);
        const conflicts: string[] = [];

        const classBusy = getConflicts(targetTeacherId, targetDay, targetPeriod, sourceLesson.class_id);
        if (classBusy.length > 0) {
            const className = data.classes.find(c => c.id === sourceLesson.class_id)?.name;
            conflicts.push(`Клас ${className} вже має урок у ${classBusy.join(', ')} `);
        }

        setDragConfirm({
            type: 'move',
            source: sourceLesson,
            target: {
                teacherId: targetTeacherId,
                day: targetDay,
                period: targetPeriod,
                lessons: targetLessons
            },
            conflicts
        });

        setDragOverCell(null);
    }, [draggedLesson, data.classes, getConflicts, lessons]);

    // Redundant DashboardView internal definition removed
    // Redundant MatrixView internal definition removed
    // Redundant TeachersMasterView internal definition removed

    const findAllLessonsByTeacher = (teacherId: string, day: string, period: number): Lesson[] => {
        return lessons.filter(l =>
            l.teacher_id === teacherId &&
            l.day === day &&
            l.period === period
        );
    };


    const getTeacherStats = (teacherId: string) => {
        if (!lessons) return { totalHours: 0, days: 0 };
        const teacherLessons = lessons.filter(l => l.teacher_id === teacherId);
        const totalHours = teacherLessons.length;
        const days = new Set(teacherLessons.map(l => l.day)).size;
        return { totalHours, days };
    };

    return (
        <div className={cn(
            "h-full flex flex-col overflow-hidden transition-all",
            viewType === 'dashboard' ? (effectiveIsCompact ? "gap-2" : "gap-4") : "gap-0"
        )}>
            {/* UI Header for the Grid - Only shown on Dashboard as other views use the Header toolbar */}
            {viewType === 'dashboard' && (
                <div className={cn("flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-500 overflow-hidden shrink-0",
                    (effectiveIsCompact || isHeaderCollapsed) ? "h-0 opacity-0 mb-0" : "h-14 mb-4")}>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-2xl font-black text-white tracking-tight">Розклад</h2>
                            {userRole === 'admin' && <span className="text-[10px] font-black bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 uppercase">Адмін</span>}
                        </div>
                        <p className="text-xs font-bold text-[#a1a1aa] uppercase tracking-widest">
                            {userRole === 'admin' ? "Керування навчальним процесом" : "Ваш персональний розклад"}
                        </p>
                    </div>
                </div>
            )}

            {/* View Selection Bar & Edit Mode Toggle - Only shown on Dashboard as other views use the Header toolbar */}
            {viewType === 'dashboard' && (
                <div className={cn("flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 transition-all duration-500",
                    isHeaderCollapsed ? "mb-4" : (effectiveIsCompact ? "mb-[-16px]" : "mb-2"))}>
                    <div className={cn("flex flex-wrap gap-2 bg-[#18181b] rounded-2xl w-fit border border-white/5 transition-all", (effectiveIsCompact || isHeaderCollapsed) ? "p-1" : "p-1.5")}>
                        {[
                            { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
                            { id: 'byClass', label: 'По класах', icon: Columns },
                            { id: 'matrix', label: 'Загальний', icon: TableIcon },
                            { id: 'teachers', label: 'Вчителі', icon: Users },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setViewType(tab.id as ViewType)}
                                className={cn(
                                    "flex items-center gap-2 rounded-xl font-bold transition-all duration-200",
                                    (effectiveIsCompact || isHeaderCollapsed) ? "px-3 py-1 text-xs" : "px-5 py-2",
                                    viewType === tab.id
                                        ? "bg-white/10 text-white shadow-lg shadow-black/20"
                                        : "text-[#a1a1aa] hover:text-white"
                                )}
                            >
                                <tab.icon size={(effectiveIsCompact || isHeaderCollapsed) ? 14 : 18} />
                                {!(effectiveIsCompact || isHeaderCollapsed) && tab.label}
                                {(effectiveIsCompact || isHeaderCollapsed) && tab.id === viewType && tab.label}
                            </button>
                        ))}
                    </div>

                    {userRole === 'admin' && (
                        <div className={cn("flex items-center gap-2 bg-[#18181b] rounded-2xl border border-white/5 transition-all", (effectiveIsCompact || isHeaderCollapsed) ? "p-1" : "p-1.5")}>
                            <button
                                onClick={() => setIsEditMode(!isEditMode)}
                                className={cn(
                                    "flex items-center gap-2 rounded-xl font-bold transition-all duration-300 group",
                                    (effectiveIsCompact || isHeaderCollapsed) ? "px-3 py-1 text-xs" : "px-4 py-2",
                                    isEditMode
                                        ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                                        : "text-[#a1a1aa] hover:text-white"
                                )}
                            >
                                {isEditMode ? (
                                    <>
                                        <Unlock size={(effectiveIsCompact || isHeaderCollapsed) ? 14 : 18} className="animate-pulse" />
                                        <span>{(effectiveIsCompact || isHeaderCollapsed) ? 'РЕД.' : 'Редагування УВІМК.'}</span>
                                    </>
                                ) : (
                                    <>
                                        <Lock size={(effectiveIsCompact || isHeaderCollapsed) ? 14 : 18} />
                                        <span>{(effectiveIsCompact || isHeaderCollapsed) ? 'РЕД.' : 'Редагування ВИМК.'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}


            <div
                className={cn("flex-1 min-h-0", viewType === 'teachers' ? "overflow-hidden flex flex-col" : "overflow-y-auto custom-scrollbar")}
                onScroll={(e) => {
                    if (viewType !== 'dashboard' || !setIsHeaderCollapsed) return;
                    const top = e.currentTarget.scrollTop;
                    if (top > 50 && !isHeaderCollapsed) {
                        setIsHeaderCollapsed(true);
                    } else if (top <= 50 && isHeaderCollapsed) {
                        setIsHeaderCollapsed(false);
                    }
                }}
            >
                {viewType === 'dashboard' ? (
                    <DashboardView
                        data={data}
                        selectedClassId={selectedClassId}
                        setSelectedClassId={setSelectedClassId}
                        timeInfo={timeInfo}
                        now={now}
                        findLesson={findLesson}
                        periods={periods}
                        getRoomColor={getRoomColor}
                        sortedClasses={sortedClasses}
                        perfSettings={perfSettings}
                        userRole={userRole}
                        selectedTeacherId={selectedTeacherId}
                        lessons={lessons}
                    />
                ) : viewType === 'byClass' ? (
                    /* ... ByClassView remains here for now as it doesn't have internal state bugs reported yet, but I'll stabilize it if needed ... */
                    <ByClassView
                        data={data}
                        selectedClassId={selectedClassId}
                        setSelectedClassId={setSelectedClassId}
                        sortedClasses={sortedClasses}
                        apiDays={apiDays}
                        days={days}
                        periods={periods}
                        findLesson={findLesson}
                        getSubjectColor={getSubjectColor}
                        getConflicts={getConflicts}
                        dragOverCell={dragOverCell}
                        setDragOverCell={setDragOverCell}
                        draggedLesson={draggedLesson}
                        setDraggedLesson={setDraggedLesson}
                        processDrop={processDrop}
                        setEditingCell={setEditingCell}
                        setViewingLesson={setViewingLesson}
                        isEditMode={userRole === 'admin' ? isEditMode : false}
                        isCompact={false}
                        perfSettings={perfSettings}
                        getClassConflicts={getClassConflicts}
                        userRole={userRole}
                        selectedTeacherId={selectedTeacherId}
                    />
                ) : viewType === 'matrix' ? (
                    <MatrixView
                        data={data}
                        activeGradeGroup={activeGradeGroup}
                        setActiveGradeGroup={setActiveGradeGroup}
                        matrixDay={matrixDay}
                        setMatrixDay={setMatrixDay}
                        findLesson={findLesson}
                        getConflicts={getConflicts}
                        getSubjectColor={getSubjectColor}
                        getRoomColor={getRoomColor}
                        periods={periods}
                        days={days}
                        apiDays={apiDays}
                        sortedClasses={sortedClasses}
                        draggedLesson={draggedLesson}
                        setDraggedLesson={setDraggedLesson}
                        dragOverCell={dragOverCell}
                        setDragOverCell={setDragOverCell}
                        processDrop={processDrop}
                        setEditingCell={setEditingCell}
                        setViewingLesson={setViewingLesson}
                        isEditMode={userRole === 'admin' ? isEditMode : false}
                        isCompact={isCompact}
                        setIsCompact={setIsCompact}
                        isMonochrome={isMonochrome}
                        setIsMonochrome={setIsMonochrome}
                        lessons={lessons}
                        perfSettings={perfSettings}
                        getClassConflicts={getClassConflicts}
                        userRole={userRole}
                        selectedTeacherId={selectedTeacherId}
                        showIcons={showIcons}
                        setShowIcons={setShowIcons}
                    />
                ) : (
                    <TeachersMasterView
                        data={{ ...data, teachers: visibleTeachers }}
                        masterDay={masterDay}
                        setMasterDay={setMasterDay}
                        findAllLessonsByTeacher={findAllLessonsByTeacher}
                        getRoomColor={getRoomColor}
                        getSubjectColor={getSubjectColor}
                        getConflicts={getConflicts}
                        periods={periods}
                        days={days}
                        apiDays={apiDays}
                        setViewingLesson={setViewingLesson}
                        isEditMode={userRole === 'admin' ? isEditMode : false}
                        setEditingTeacherCell={setEditingTeacherCell}
                        getTeacherStats={getTeacherStats}
                        isCompact={isCompact}
                        setIsCompact={setIsCompact}
                        isMonochrome={isMonochrome}
                        setIsMonochrome={setIsMonochrome}
                        lessons={lessons}
                        draggedLesson={draggedLesson}
                        setDraggedLesson={setDraggedLesson}
                        dragOverCell={dragOverCell}
                        setDragOverCell={setDragOverCell}
                        processTeacherDrop={processTeacherDrop}
                        perfSettings={perfSettings}
                        getClassConflicts={getClassConflicts}
                    />
                )}
            </div>

            {editingCell && createPortal(
                <EditLessonModal
                    data={data}
                    schedule={lessons}
                    initialClassId={editingCell.classId}
                    initialDay={editingCell.day}
                    initialPeriod={editingCell.period}
                    currentSubjectId={findLesson(editingCell.classId, editingCell.day, editingCell.period)?.subject_id}
                    currentTeacherId={findLesson(editingCell.classId, editingCell.day, editingCell.period)?.teacher_id}
                    currentRoom={findLesson(editingCell.classId, editingCell.day, editingCell.period)?.room}
                    onSave={handleSaveLesson}
                    onClose={() => setEditingCell(null)}
                />,
                document.body
            )}

            {viewingLesson && createPortal(
                <LessonDetailsModal
                    data={data}
                    lesson={findLesson(viewingLesson.classId, viewingLesson.day, viewingLesson.period)}
                    classId={viewingLesson.classId}
                    day={viewingLesson.day}
                    period={viewingLesson.period}
                    onClose={() => setViewingLesson(null)}
                    onEdit={() => {
                        const cell = { ...viewingLesson };
                        setViewingLesson(null);
                        setEditingCell(cell);
                    }}
                    isEditMode={isEditMode}
                />,
                document.body
            )}

            {dragConfirm && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200" onClick={() => setDragConfirm(null)}>
                    <div className="bg-[#18181b] w-full max-w-sm rounded-3xl border border-white/10 shadow-xl overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-4">
                            <div className={cn("p-3 rounded-full", dragConfirm.conflicts.length > 0 ? "bg-red-500/20 text-red-500" : "bg-indigo-500/20 text-indigo-500")}>
                                {dragConfirm.conflicts.length > 0 ? <AlertTriangle size={24} /> : <ArrowRightLeft size={24} />}
                            </div>
                            <div>
                                <h4 className="font-black text-white text-lg">{dragConfirm.conflicts.length > 0 ? "Увага, конфлікт!" : "Підтвердіть дію"}</h4>
                                <p className="text-sm text-[#a1a1aa]">
                                    {dragConfirm.type === 'swap' ? 'Ви хочете поміняти уроки місцями?' : 'Ви хочете перенести урок?'}
                                </p>
                            </div>
                        </div>

                        {dragConfirm.conflicts.length > 0 && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                                {dragConfirm.conflicts.map((c, i) => (
                                    <div key={i} className="text-xs text-red-200 font-bold mb-1 last:mb-0 flex items-start gap-2">
                                        <span>•</span> {c}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            <button onClick={() => setDragConfirm(null)} className="flex-1 py-2.5 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-white transition-colors">
                                Скасувати
                            </button>
                            <button onClick={executeDragAction} className={cn("flex-1 py-2.5 rounded-xl font-bold text-white transition-colors", dragConfirm.conflicts.length > 0 ? "bg-red-500 hover:bg-red-600" : "bg-indigo-600 hover:bg-indigo-500")}>
                                {dragConfirm.conflicts.length > 0 ? "Все одно виконати" : "Так, виконати"}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Teacher Edit Modal */}
            {editingTeacherCell && createPortal(
                <TeacherEditModal
                    data={data}
                    schedule={lessons}
                    teacherId={editingTeacherCell.teacherId}
                    day={editingTeacherCell.day}
                    period={editingTeacherCell.period}
                    onSave={(classId, day, period, subjectId, teacherId, room) => {
                        handleSaveLesson(classId, day, period, subjectId, teacherId, room);
                        setEditingTeacherCell(null);
                    }}
                    onClose={() => setEditingTeacherCell(null)}
                />,
                document.body
            )}
        </div>
    );
}

// --- Edit Modal Component ---
interface EditLessonModalProps {
    data: ScheduleRequest;
    schedule: import('../types').Lesson[];
    initialClassId: string;
    initialDay: string;
    initialPeriod: number;
    currentSubjectId?: string;
    currentTeacherId?: string;
    currentRoom?: string; // Add currentRoom prop
    onSave: (classId: string, day: string, period: number, subjectId: string, teacherId: string, room?: string) => void;
    onClose: () => void;
}

function EditLessonModal({ data, schedule, initialClassId, initialDay, initialPeriod, currentSubjectId, currentTeacherId, currentRoom, onSave, onClose }: EditLessonModalProps) {
    const [subjectId, setSubjectId] = useState(currentSubjectId || '');
    const [teacherId, setTeacherId] = useState(currentTeacherId || '');
    const [room, setRoom] = useState(currentRoom || ''); // Room state
    const [conflict, setConflict] = useState<{ teacherName: string, className: string } | null>(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // If subject changes, maybe pre-fill default room?
    useEffect(() => {
        if (subjectId && !room && !currentRoom) {
            const sub = data.subjects.find(s => s.id === subjectId);
            if (sub?.defaultRoom) setRoom(sub.defaultRoom);
        }
    }, [subjectId, data.subjects, room, currentRoom]);


    const className = data.classes.find(c => c.id === initialClassId)?.name || '???';
    const dayMap: Record<string, string> = { "Mon": "Пн", "Tue": "Вт", "Wed": "Ср", "Thu": "Чт", "Fri": "Пт" };
    const dayName = dayMap[initialDay as keyof typeof dayMap] || initialDay;

    // Сортуємо предмети безпечно
    const subjects = [...data.subjects].sort((a, b) => a.name.localeCompare(b.name));

    // Фільтруємо вчителів за обраним предметом (опціонально, але покращує UX)
    const teachers = useMemo(() => {
        if (!subjectId) return [];
        let list = data.teachers.filter(t => t.subjects.includes(subjectId));
        // Також додаємо поточного вчителя, якщо він призначений, навіть якщо не підходить за фільтром
        if (teacherId && !list.some(t => t.id === teacherId)) {
            const current = data.teachers.find(t => t.id === teacherId);
            if (current) list.push(current);
        }
        // Якщо список порожній (наприклад, ручне перепризначення), можна показати всіх?
        // Показуємо всіх, але сортуємо за релевантністю.
        return data.teachers.sort((a, b) => {
            const aRel = a.subjects.includes(subjectId) ? 1 : 0;
            const bRel = b.subjects.includes(subjectId) ? 1 : 0;
            return bRel - aRel || a.name.localeCompare(b.name);
        });
    }, [data.teachers, subjectId, teacherId]);

    const handleSave = () => {
        // Перевірка на конфлікти
        if (teacherId) {
            const collision = schedule.find(l =>
                l.teacher_id === teacherId &&
                l.day === initialDay &&
                l.period === initialPeriod &&
                l.class_id !== initialClassId
            );

            if (collision && !conflict) {
                const teacherName = data.teachers.find(t => t.id === teacherId)?.name || 'Вчитель';
                const conflictClass = data.classes.find(c => c.id === collision.class_id)?.name || '???';
                setConflict({ teacherName, className: conflictClass });
                return;
            }
        }

        onSave(initialClassId, initialDay, initialPeriod, subjectId, teacherId, room);
    };

    const handleClear = () => {
        onSave(initialClassId, initialDay, initialPeriod, "", "");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-[#18181b] w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div>
                        <h3 className="text-xl font-black text-white">Редагування уроку</h3>
                        <div className="text-xs font-bold text-[#a1a1aa] mt-1">
                            Клас {className} • {dayName} • {initialPeriod} урок
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-[#a1a1aa] hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {conflict ? (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 space-y-4 animate-in slide-in-from-top-2">
                            <div className="flex items-start gap-4">
                                <div className="bg-red-500/20 p-3 rounded-full text-red-500">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h4 className="font-black text-white text-lg">Конфлікт у розкладі!</h4>
                                    <p className="text-sm text-red-200 mt-1 leading-relaxed">
                                        <b className="text-white">{conflict.teacherName}</b> вже веде урок у класі <b className="text-white">{conflict.className}</b> в цей час.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setConflict(null)} className="flex-1 py-2 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-white transition-colors">
                                    Скасувати
                                </button>
                                <button onClick={() => onSave(initialClassId, initialDay, initialPeriod, subjectId, teacherId, room)} className="flex-1 py-2 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white transition-colors">
                                    Все одно зберегти
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">Предмет</label>
                                <select
                                    value={subjectId}
                                    onChange={e => { setSubjectId(e.target.value); setTeacherId(''); }}
                                    className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-3 font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                                >
                                    <option value="">-- Оберіть предмет --</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">Вчитель</label>
                                <select
                                    value={teacherId}
                                    onChange={e => setTeacherId(e.target.value)}
                                    disabled={!subjectId}
                                    className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-3 font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 appearance-none"
                                >
                                    <option value="">-- Оберіть вчителя --</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id} className={!t.subjects.includes(subjectId) ? "text-white/50" : ""}>
                                            {t.name} {!t.subjects.includes(subjectId) ? "(Інший фах)" : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">Кабінет</label>
                                <input
                                    type="text"
                                    value={room}
                                    onChange={e => setRoom(e.target.value)}
                                    placeholder="Наприклад: 101"
                                    className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-3 font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowClearConfirm(true)}
                                    className="flex-1 py-3 rounded-xl font-black text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={18} />
                                    Очистити
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!subjectId || !teacherId}
                                    className="flex-[2] py-3 rounded-xl font-black text-white bg-indigo-500 hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Check size={18} />
                                    Зберегти
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                onConfirm={handleClear}
                title="Очистити урок?"
                description="Ви впевнені, що хочете видалити цей урок з розкладу?"
            />
        </div>
    );
}

// --- Teacher Edit Modal Component ---
interface TeacherEditModalProps {
    data: ScheduleRequest;
    schedule: Lesson[];
    teacherId: string;
    day: string;
    period: number;
    onSave: (classId: string, day: string, period: number, subjectId: string, teacherId: string, room?: string) => void;
    onClose: () => void;
}

export function TeacherEditModal({ data, schedule, teacherId, day, period, onSave, onClose }: TeacherEditModalProps) {
    const existingLesson = schedule.find(l => l.teacher_id === teacherId && l.day === day && l.period === period);

    const [classId, setClassId] = useState(existingLesson?.class_id || '');
    const [subjectId, setSubjectId] = useState(existingLesson?.subject_id || '');
    const [room, setRoom] = useState(existingLesson?.room || '');
    const [conflict, setConflict] = useState<{ teacherName: string, className: string } | null>(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const teacherObj = data.teachers.find(t => t.id === teacherId);
    const dayMap: Record<string, string> = { "Mon": "Пн", "Tue": "Вт", "Wed": "Ср", "Thu": "Чт", "Fri": "Пт" };
    const dayName = dayMap[day] || day;

    // Сортуємо класи
    const sortedClasses = [...data.classes].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    // Фільтруємо предмети, які викладає цей вчитель за планом
    const teacherSubjects = useMemo(() => {
        const subjectsInPlan = data.plan
            .filter(p => p.teacher_id === teacherId && (classId ? p.class_id === classId : true))
            .map(p => p.subject_id);

        return data.subjects.filter(s => subjectsInPlan.includes(s.id) || teacherObj?.subjects.includes(s.id));
    }, [data.plan, teacherId, data.subjects, teacherObj, classId]);

    useEffect(() => {
        if (subjectId && !room && !existingLesson) {
            const sub = data.subjects.find(s => s.id === subjectId);
            if (sub?.defaultRoom) setRoom(sub.defaultRoom);
        }
    }, [subjectId, data.subjects, room, existingLesson]);

    const handleSave = () => {
        // Перевірка чи не зайнятий КЛАС у цей час іншим вчителем
        if (classId) {
            const collision = schedule.find(l =>
                l.class_id === classId &&
                l.day === day &&
                l.period === period &&
                l.teacher_id !== teacherId
            );

            if (collision && !conflict) {
                const className = data.classes.find(c => c.id === classId)?.name || '???';
                const otherTeacher = data.teachers.find(t => t.id === collision.teacher_id)?.name || 'Інший вчитель';
                setConflict({ teacherName: otherTeacher, className: className });
                return;
            }
        }
        onSave(classId, day, period, subjectId, teacherId, room);
    };

    const handleClear = () => {
        if (existingLesson) {
            onSave(existingLesson.class_id, day, period, "", "");
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-[#18181b] w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div>
                        <h3 className="text-xl font-black text-white">Редагування розкладу вчителя</h3>
                        <div className="text-xs font-bold text-[#a1a1aa] mt-1">
                            {teacherObj?.name} • {dayName} • {period} урок
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-[#a1a1aa] hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {conflict ? (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 space-y-4 animate-in slide-in-from-top-2">
                            <div className="flex items-start gap-4">
                                <div className="bg-red-500/20 p-3 rounded-full text-red-500">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h4 className="font-black text-white text-lg">Клас уже зайнятий!</h4>
                                    <p className="text-sm text-red-200 mt-1 leading-relaxed">
                                        Клас <b className="text-white">{conflict.className}</b> вже має урок з вчителем <b className="text-white">{conflict.teacherName}</b> в цей час.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setConflict(null)} className="flex-1 py-2 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-white transition-colors">
                                    Скасувати
                                </button>
                                <button
                                    onClick={() => onSave(classId, day, period, subjectId, teacherId, room)}
                                    className="flex-1 py-2 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white transition-colors"
                                >
                                    Перезаписати
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">Клас</label>
                                <select
                                    value={classId}
                                    onChange={e => setClassId(e.target.value)}
                                    className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-3 font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">-- Оберіть клас --</option>
                                    {sortedClasses.map(c => <option key={c.id} value={c.id}>Клас {c.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">Предмет</label>
                                <select
                                    value={subjectId}
                                    onChange={e => setSubjectId(e.target.value)}
                                    disabled={!classId}
                                    className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-3 font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    <option value="">-- Оберіть предмет --</option>
                                    {teacherSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">Кабінет</label>
                                <input
                                    type="text"
                                    value={room}
                                    onChange={e => setRoom(e.target.value)}
                                    placeholder="Наприклад: 101"
                                    className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-3 font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowClearConfirm(true)}
                                    className="flex-1 py-3 rounded-xl font-black text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={18} />
                                    Очистити
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!classId || !subjectId}
                                    className="flex-[2] py-3 rounded-xl font-black text-white bg-indigo-500 hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Check size={18} />
                                    Зберегти
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                onConfirm={handleClear}
                title="Очистити урок?"
                description="Ви впевнені, що хочете видалити цей урок з розкладу?"
            />
        </div>
    );
}

// --- Lesson Details Modal (Read-only) ---
interface LessonDetailsModalProps {
    data: ScheduleRequest;
    lesson: Lesson | null;
    classId: string;
    day: string;
    period: number;
    onClose: () => void;
    onEdit: () => void;
    isEditMode: boolean;
}

function LessonDetailsModal({ data, lesson, classId, day, period, onClose, onEdit, isEditMode }: LessonDetailsModalProps) {
    const className = data.classes.find(c => c.id === classId)?.name || '???';
    const dayMap: Record<string, string> = { "Mon": "Пн", "Tue": "Вт", "Wed": "Ср", "Thu": "Чт", "Fri": "Пт" };
    const dayName = dayMap[day as keyof typeof dayMap] || day;

    const subject = lesson ? data.subjects.find(s => s.id === lesson.subject_id) : null;
    const teacher = lesson ? data.teachers.find(t => t.id === lesson.teacher_id) : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-[#18181b] w-full max-w-sm rounded-3xl border border-white/10 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div>
                        <h3 className="text-xl font-black text-white">Інформація про урок</h3>
                        <div className="text-xs font-bold text-[#a1a1aa] mt-1">
                            Клас {className} • {dayName} • {period} урок
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-[#a1a1aa] hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {!lesson ? (
                        <div className="text-center py-8">
                            <div className="text-white/20 mb-2 flex justify-center"><Info size={48} /></div>
                            <p className="text-[#a1a1aa] font-bold">Урок не призначено</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: subject?.color || '#eee' }}>
                                        <Info size={24} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">Предмет</div>
                                        <div className="text-lg font-black text-white">{subject?.name}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white shrink-0">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">Вчитель</div>
                                        <div className="text-lg font-black text-white">{teacher?.name}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white shrink-0">
                                        <LayoutDashboard size={24} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">Кабінет</div>
                                        <div className="text-lg font-black text-white">{lesson.room || subject?.defaultRoom || '—'}</div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl font-black text-[#a1a1aa] bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            Закрити
                        </button>
                        {isEditMode && (
                            <button
                                onClick={onEdit}
                                className="flex-1 py-3 rounded-xl font-black text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                            >
                                <Pencil size={18} />
                                Редагувати
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

