import { useState, useMemo, useEffect } from 'react';
import type { ScheduleRequest, ScheduleResponse, Lesson, ClassGroup } from '../types';
import { Trash2, Plus, Pencil, X, Check, AlertTriangle, Users, LayoutDashboard, Table as TableIcon, Columns, ArrowRightLeft, Video, ChevronRight, Lock, Unlock, Info } from 'lucide-react';
import { cn } from '../utils/cn';
import { BELL_SCHEDULE } from '../constants';

interface ScheduleGridProps {
    data: ScheduleRequest;
    schedule: ScheduleResponse;
    onScheduleChange: (newSchedule: ScheduleResponse) => void;
    isEditMode: boolean;
    setIsEditMode: (val: boolean) => void;
}

type ViewType = 'dashboard' | 'matrix' | 'byClass' | 'teachers';

// --- Sub-View Components ---

interface DashboardViewProps {
    data: ScheduleRequest;
    selectedClassId: string;
    setSelectedClassId: (id: string) => void;
    timeInfo: any;
    findLesson: (classId: string, day: string, period: number) => Lesson | null;
    periods: number[];
    getRoomColor: (room: string | undefined) => string;
    sortedClasses: ClassGroup[];
}

const DashboardView = ({ data, selectedClassId, setSelectedClassId, timeInfo, findLesson, periods, getRoomColor, sortedClasses }: DashboardViewProps) => {
    const { todayApiDay, currentPeriod, isBreak, minutesLeft, nextPeriod } = timeInfo;

    const currentLesson = currentPeriod !== -1 ? findLesson(selectedClassId, todayApiDay, currentPeriod) : null;
    const upcomingLesson = nextPeriod !== -1 ? findLesson(selectedClassId, todayApiDay, nextPeriod) : null;

    const todayLessons = periods.map(p => ({
        period: p,
        lesson: findLesson(selectedClassId, todayApiDay, p)
    }));

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
                        {isBreak ? "Готуйся до наступного уроку" : teacher ? `${teacher.name} • Кабінет ${subject?.defaultRoom || '101'}` : "Відпочивай"}
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
            <div className="bento-card flex flex-col justify-between border-white/5 bg-[#1a1a1e] p-8 h-full">
                <div className="space-y-4">
                    <div className="text-[#a1a1aa] text-xs font-black uppercase tracking-widest">НАСТУПНИЙ УРОК</div>
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
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[#a1a1aa] text-xs font-black uppercase tracking-widest">РОЗКЛАД НА СЬОГОДНІ</h3>
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
};

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
    dragOverCell: { classId: string, day: string, period: number } | null;
    setDragOverCell: (c: { classId: string, day: string, period: number } | null) => void;
    draggedLesson: Lesson | null;
    setDraggedLesson: (l: Lesson | null) => void;
    processDrop: (classId: string, day: string, period: number) => void;
    setEditingCell: (c: { classId: string, day: string, period: number } | null) => void;
    setViewingLesson: (c: { classId: string, day: string, period: number } | null) => void;
    isEditMode: boolean;
}

const ByClassView = ({
    data, selectedClassId, setSelectedClassId, sortedClasses, apiDays, days, periods,
    findLesson, getSubjectColor, getConflicts, dragOverCell, setDragOverCell,
    draggedLesson, setDraggedLesson, processDrop, setEditingCell, setViewingLesson, isEditMode
}: ByClassViewProps) => {
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
                {sortedClasses.map(cls => (
                    <button
                        key={cls.id}
                        onClick={() => setSelectedClassId(cls.id)}
                        className={cn(
                            "px-4 py-2 rounded-xl font-bold transition-all border",
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
                    <div key={day} className="bento-card p-4 border-white/5 bg-[#1a1a1e]">
                        <h4 className="text-[#a1a1aa] font-black text-center mb-4 uppercase tracking-widest">{days[dIdx]}</h4>
                        <div className="space-y-3">
                            {periods.map(p => {
                                const lesson = findLesson(selectedClassId, day, p);
                                const isUsed = !!lesson;

                                const subColor = lesson ? getSubjectColor(lesson.subject_id) : 'transparent';
                                const teacher = lesson ? data.teachers.find(t => t.id === lesson.teacher_id) : null;
                                const conflicts = lesson ? getConflicts(lesson.teacher_id, day, p, selectedClassId) : [];

                                const isDragOver = dragOverCell?.day === day && dragOverCell?.period === p && dragOverCell?.classId === selectedClassId;
                                const isDragging = draggedLesson?.day === day && draggedLesson?.period === p && draggedLesson?.class_id === selectedClassId;

                                return (
                                    <div
                                        key={p}
                                        className={cn(
                                            "relative group cursor-pointer p-2 rounded-lg transition-all -mx-2 border-2",
                                            isDragOver ? "border-indigo-500 bg-indigo-500/10 scale-105 z-10" : "border-transparent hover:bg-white/5",
                                            isDragging ? "opacity-50" : "opacity-100",
                                            !isUsed && !isEditMode && "opacity-40"
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
                                                processDrop(selectedClassId, day, p);
                                            }
                                        }}
                                    >
                                        <div className="absolute left-0 top-2 bottom-2 w-1 rounded-full group-hover:w-1.5 transition-all" style={{ backgroundColor: subColor }} />
                                        <div className="pl-3">
                                            <div className="text-[10px] text-[#a1a1aa] font-black flex items-center gap-2">
                                                <span>{p} УРОК</span>
                                                {conflicts.length > 0 && (
                                                    <div className="text-amber-500" title={`Вчитель вже веде урок у: ${conflicts.join(', ')}`}>
                                                        <AlertTriangle size={12} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-sm font-bold truncate min-h-[1.25rem]">
                                                {lesson ? data.subjects.find(s => s.id === lesson.subject_id)?.name : (isEditMode && <span className="text-white/20 italic text-[10px] lowercase opacity-50">Вільне вікно</span>)}
                                            </div>
                                            {teacher && (
                                                <div className="text-[10px] text-[#a1a1aa] font-bold truncate opacity-70">
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
};

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
    dragOverCell: { classId: string, day: string, period: number } | null;
    setDragOverCell: (c: { classId: string, day: string, period: number } | null) => void;
    processDrop: (classId: string, day: string, period: number) => void;
    setEditingCell: (c: { classId: string, day: string, period: number } | null) => void;
    setViewingLesson: (c: { classId: string, day: string, period: number } | null) => void;
    isEditMode: boolean;
}

const MatrixView = ({
    data, activeGradeGroup, setActiveGradeGroup, matrixDay, setMatrixDay,
    findLesson, getConflicts, getSubjectColor, getRoomColor, periods, days, apiDays, sortedClasses,
    draggedLesson, setDraggedLesson, dragOverCell, setDragOverCell, processDrop, setEditingCell, setViewingLesson, isEditMode
}: MatrixViewProps) => {
    const filteredClasses = sortedClasses.filter(cls => {
        const grade = parseInt(cls.name);
        if (activeGradeGroup === '1-4') return grade >= 1 && grade <= 4;
        if (activeGradeGroup === '5-9') return grade >= 5 && grade <= 9;
        if (activeGradeGroup === '10-11') return grade >= 10 && grade <= 11;
        return false;
    });

    const dayName = days[apiDays.indexOf(matrixDay)];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Загальний розклад</h2>
                    <div className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest mt-1">
                        Вся школа • {dayName}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
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
                                {group} КЛАСИ
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bento-card border-white/5 overflow-hidden">
                <div className="overflow-auto max-h-[70vh] custom-scrollbar">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="sticky top-0 left-0 z-30 bg-[#18181b] p-4 text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest text-center border-r border-white/5 min-w-[80px]">
                                    ЧАС
                                </th>
                                {filteredClasses.map(cls => (
                                    <th key={cls.id} className="sticky top-0 z-20 bg-[#18181b] p-4 text-[12px] font-black text-white uppercase tracking-widest border-r border-white/5 min-w-[160px]">
                                        {cls.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {periods.map(p => (
                                <tr key={p} className="border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors">
                                    <th className="sticky left-0 z-10 bg-[#18181b] p-4 border-r border-white/5 text-center">
                                        <div className="text-lg font-black text-white leading-none">{p}</div>
                                        <div className="text-[8px] text-[#a1a1aa] font-black mt-1 opacity-50 uppercase">УРОК</div>
                                    </th>
                                    {filteredClasses.map(cls => {
                                        const lesson = findLesson(cls.id, matrixDay, p);
                                        const subject = lesson ? data.subjects.find(s => s.id === lesson.subject_id) : null;
                                        const teacher = lesson ? data.teachers.find(t => t.id === lesson.teacher_id) : null;
                                        const subColor = getSubjectColor(lesson?.subject_id || '');
                                        const conflicts = lesson ? getConflicts(lesson.teacher_id, matrixDay, p, cls.id) : [];

                                        const isDragOver = dragOverCell?.day === matrixDay && dragOverCell?.period === p && dragOverCell?.classId === cls.id;
                                        const isDragging = draggedLesson?.day === matrixDay && draggedLesson?.period === p && draggedLesson?.class_id === cls.id;

                                        return (
                                            <td
                                                key={cls.id}
                                                className={cn(
                                                    "p-2 border-r border-white/5 last:border-r-0 h-24 transition-all",
                                                    isDragOver && "bg-indigo-500/10"
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
                                                        processDrop(cls.id, matrixDay, p);
                                                    }
                                                }}
                                            >
                                                {lesson ? (
                                                    <div
                                                        onClick={() => isEditMode
                                                            ? setEditingCell({ classId: cls.id, day: matrixDay, period: p })
                                                            : setViewingLesson({ classId: cls.id, day: matrixDay, period: p })
                                                        }
                                                        className={cn(
                                                            "h-full bg-white/[0.03] hover:bg-white/[0.06] rounded-xl p-3 border-l-4 transition-all group cursor-pointer shadow-sm active:scale-95 relative overflow-hidden",
                                                            isDragging ? "opacity-30 grayscale" : "opacity-100"
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
                                                        {conflicts.length > 0 && (
                                                            <div
                                                                className="absolute top-1 right-1 text-amber-500 bg-black/50 rounded-full p-1 z-10"
                                                                title={`Вчитель вже веде урок у: ${conflicts.join(', ')}`}
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
                                                        className="h-full rounded-xl border border-dashed border-white/5 flex items-center justify-center bg-black/5 opacity-30 hover:opacity-100 hover:border-white/20 transition-all cursor-pointer group"
                                                    >
                                                        <div className="text-[8px] font-black text-[#a1a1aa] uppercase tracking-widest group-hover:text-white">
                                                            {isEditMode ? (
                                                                <>
                                                                    <Plus size={14} className="mx-auto mb-1" />
                                                                    Додати
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
        </div>
    );
};

interface TeachersMasterViewProps {
    data: ScheduleRequest;
    masterDay: string;
    setMasterDay: (day: string) => void;
    findLessonByTeacher: (teacherId: string, day: string, period: number) => Lesson | null;
    getRoomColor: (room: string | undefined) => string;
    periods: number[];
    days: string[];
    apiDays: string[];
    setViewingLesson: (c: { classId: string, day: string, period: number } | null) => void;
    isEditMode: boolean;
    setEditingTeacherCell: (c: { teacherId: string, day: string, period: number } | null) => void;
}

const TeachersMasterView = ({ data, masterDay, setMasterDay, findLessonByTeacher, getRoomColor, periods, days, apiDays, setViewingLesson, isEditMode, setEditingTeacherCell }: TeachersMasterViewProps) => {
    const getGradeGroup = (className: string) => {
        const grade = parseInt(className);
        if (grade >= 1 && grade <= 4) return 'junior';
        if (grade >= 5 && grade <= 9) return 'mid';
        if (grade >= 10 && grade <= 11) return 'senior';
        return 'other';
    };

    const dayName = days[apiDays.indexOf(masterDay)];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Розклад вчителів</h2>
                    <div className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest mt-1">
                        Всі викладачі • {dayName}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                    {/* Legend */}
                    <div className="hidden lg:flex items-center gap-4">
                        {[
                            { label: '1-4 Класи', color: 'bg-orange-500' },
                            { label: '5-9 Класи', color: 'bg-emerald-500' },
                            { label: '10-11 Класи', color: 'bg-indigo-500' },
                        ].map(item => (
                            <div key={item.label} className="flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full", item.color)} />
                                <span className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">{item.label}</span>
                            </div>
                        ))}
                    </div>

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
                </div>
            </div>

            <div className="bento-card border-white/5 overflow-hidden flex-1 flex flex-col">
                <div className="overflow-auto custom-scrollbar flex-1">
                    <table className="w-full border-separate border-spacing-0 text-left">
                        <thead>
                            <tr>
                                <th className="sticky top-0 left-0 z-30 bg-[#18181b] p-4 text-[10px] font-black text-white uppercase tracking-widest border-b border-r border-white/5 min-w-[250px]">
                                    ВИКЛАДАЧ
                                </th>
                                {periods.map(p => (
                                    <th key={p} className="sticky top-0 z-20 bg-[#18181b] p-4 text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest border-b border-r border-white/5 min-w-[120px] text-center">
                                        {p}<br />
                                        <span className="text-[8px] opacity-50 font-black">УРОК</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.teachers.map(teacher => {
                                const teacherPlan = data.plan.filter(p => p.teacher_id === teacher.id);
                                const mainSubject = data.subjects.find(s => s.id === (teacherPlan[0]?.subject_id || ''))?.name || "—";

                                return (
                                    <tr key={teacher.id} className="group hover:bg-white/[0.01] transition-colors">
                                        <td className="sticky left-0 z-10 bg-[#18181b] p-4 border-b border-r border-white/5 group-hover:bg-[#1f1f23] transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white text-xs font-black uppercase group-hover:bg-indigo-500 transition-all duration-500 overflow-hidden border border-white/5">
                                                    {teacher.photo ? (
                                                        <img src={teacher.photo} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        teacher.name.slice(0, 1)
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors uppercase">{teacher.name}</span>
                                                    <span className="text-[9px] font-black text-[#a1a1aa] uppercase tracking-tighter opacity-70">{mainSubject}</span>
                                                </div>
                                            </div>
                                        </td>
                                        {periods.map(p => {
                                            const lesson = findLessonByTeacher(teacher.id, masterDay, p);
                                            const cls = lesson ? data.classes.find(c => c.id === lesson.class_id) : null;
                                            const gradeGroup = cls ? getGradeGroup(cls.name) : 'other';

                                            const colorClasses = {
                                                junior: "border-orange-500 bg-orange-500/10 text-orange-200",
                                                mid: "border-emerald-500 bg-emerald-500/10 text-emerald-200",
                                                senior: "border-indigo-500 bg-indigo-500/10 text-indigo-200",
                                                other: "border-white/10 bg-white/5 text-white"
                                            }[gradeGroup];

                                            const room = lesson?.room || (lesson ? data.subjects.find(s => s.id === lesson.subject_id)?.defaultRoom : undefined);

                                            const handleClick = () => {
                                                if (isEditMode) {
                                                    setEditingTeacherCell({ teacherId: teacher.id, day: masterDay, period: p });
                                                } else if (lesson) {
                                                    setViewingLesson({ classId: lesson.class_id, day: masterDay, period: p });
                                                }
                                            };

                                            return (
                                                <td key={p} className="p-2 border-b border-r border-white/5 h-[80px]">
                                                    {lesson ? (
                                                        <div
                                                            onClick={handleClick}
                                                            className={cn(
                                                                "h-full w-full rounded-xl border-l-[3px] p-2 flex flex-col justify-center items-center gap-1 transition-all duration-300 hover:scale-110 hover:z-50 hover:shadow-2xl cursor-pointer active:scale-95 group/pill relative overflow-hidden",
                                                                colorClasses
                                                            )}
                                                        >
                                                            <span className="text-xs font-black tracking-widest relative z-10">{cls?.name}</span>
                                                            <div className={cn(
                                                                "text-[8px] font-black px-1.5 py-0.5 rounded uppercase relative z-10",
                                                                getRoomColor(room)
                                                            )}>
                                                                {room || '—'}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            onClick={handleClick}
                                                            className={cn(
                                                                "h-full w-full flex items-center justify-center transition-all",
                                                                isEditMode ? "cursor-pointer hover:bg-white/5" : "text-white/5 select-none"
                                                            )}
                                                        >
                                                            {isEditMode ? <Plus size={14} className="text-indigo-500/30 group-hover:text-indigo-500" /> : "·"}
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
        </div >
    );
};

// --- Main ScheduleGrid Component ---

export function ScheduleGrid({ data, schedule, onScheduleChange, isEditMode, setIsEditMode }: ScheduleGridProps) {
    const [viewType, setViewType] = useState<ViewType>('dashboard');
    const [selectedClassId, setSelectedClassId] = useState<string>(data.classes[0]?.id || '');
    const [editingCell, setEditingCell] = useState<{ classId: string, day: string, period: number } | null>(null);
    const [editingTeacherCell, setEditingTeacherCell] = useState<{ teacherId: string, day: string, period: number } | null>(null);
    const [viewingLesson, setViewingLesson] = useState<{ classId: string, day: string, period: number } | null>(null);

    // Drag and Drop State
    const [draggedLesson, setDraggedLesson] = useState<Lesson | null>(null);
    const [dragOverCell, setDragOverCell] = useState<{ classId: string, day: string, period: number } | null>(null);

    // Extract lessons safely from the response
    const lessons = (schedule.status === 'success' || schedule.status === 'conflict') ? schedule.schedule : [];

    // Helper to find a lesson
    const findLesson = (classId: string, day: string, period: number): Lesson | null => {
        return lessons.find(l =>
            l.class_id === classId &&
            l.day === day &&
            l.period === period
        ) || null;
    };
    const [dragConfirm, setDragConfirm] = useState<{
        type: 'swap' | 'move';
        source: Lesson;
        target: { classId: string, day: string, period: number, lesson?: Lesson | null };
        conflicts: string[]; // List of conflict messages
    } | null>(null);
    const [activeGradeGroup, setActiveGradeGroup] = useState<'1-4' | '5-9' | '10-11'>('5-9');
    const [matrixDay, setMatrixDay] = useState<string>(''); // Will be set in useEffect or useMemo
    const [masterDay, setMasterDay] = useState<string>('');

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

        const newResponse: ScheduleResponse = {
            status: schedule.status === 'conflict' ? 'conflict' : 'success', // Preserve conflict status if it exists, otherwise success
            schedule: updatedLessons,
            violations: schedule.status === 'conflict' ? schedule.violations : [] // Preserve violations if conflict, otherwise empty
        };
        onScheduleChange(newResponse);
        setEditingCell(null);
    };

    // Redundant BELL_SCHEDULE removed

    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

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

    // Check if period 0 is used
    const hasPeriod0 = useMemo(() => {
        return lessons.some(l => l.period === 0);
    }, [lessons]);

    const periods = [0, 1, 2, 3, 4, 5, 6, 7];

    useEffect(() => {
        if (!matrixDay && timeInfo.todayApiDay) setMatrixDay(timeInfo.todayApiDay);
        if (!masterDay && timeInfo.todayApiDay) setMasterDay(timeInfo.todayApiDay);
    }, [timeInfo.todayApiDay]);

    const getConflicts = (teacherId: string, day: string, period: number, excludeClassId?: string): string[] => {
        return lessons
            .filter(l =>
                l.teacher_id === teacherId &&
                l.day === day &&
                l.period === period &&
                l.class_id !== excludeClassId
            )
            .map(l => data.classes.find(c => c.id === l.class_id)?.name || '???');
    };

    const getSubjectColor = (subjectId: string) => {
        const subject = data.subjects.find(s => s.id === subjectId);
        if (subject?.color) return subject.color;
        const palette = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
        const index = data.subjects.findIndex(s => s.id === subjectId);
        return palette[index % palette.length];
    };

    const days = ["Пн", "Вт", "Ср", "Чт", "Пт"];
    const apiDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const sortedClasses = useMemo(() =>
        ([...data.classes].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))),
        [data.classes]
    );

    if (!schedule || !lessons) return null;

    // --- Drag and Drop Logic ---

    const executeDragAction = () => {
        if (!dragConfirm) return;
        const { source, target } = dragConfirm;
        let updatedLessons = [...lessons];

        // Remove source
        updatedLessons = updatedLessons.filter(l =>
            !(l.class_id === source.class_id && l.day === source.day && l.period === source.period)
        );

        if (dragConfirm.type === 'swap') {
            // Remove target (if swap)
            updatedLessons = updatedLessons.filter(l =>
                !(l.class_id === target.classId && l.day === target.day && l.period === target.period)
            );
            // Add target at source position (Swap)
            if (target.lesson) { // Ensure target.lesson exists for a swap
                updatedLessons.push({
                    ...target.lesson,
                    class_id: source.class_id,
                    day: source.day,
                    period: source.period
                });
            }
        }

        // Add source at target position
        updatedLessons.push({
            ...source,
            class_id: target.classId,
            day: target.day,
            period: target.period
        });

        const newResponse: ScheduleResponse = {
            status: schedule.status === 'conflict' ? 'conflict' : 'success',
            schedule: updatedLessons,
            violations: schedule.status === 'conflict' ? schedule.violations : []
        };
        onScheduleChange(newResponse);
        setDragConfirm(null);
        setDraggedLesson(null);
    };

    const processDrop = (targetClassId: string, targetDay: string, targetPeriod: number) => {
        if (!draggedLesson) return;

        // Don't drop on self
        if (draggedLesson.class_id === targetClassId && draggedLesson.day === targetDay && draggedLesson.period === targetPeriod) {
            return;
        }

        const targetLesson = findLesson(targetClassId, targetDay, targetPeriod);
        const conflicts: string[] = [];

        // Check 1: Is source teacher busy at target time (excluding self)?
        // Note: We need to check if the teacher has OTHER lessons at target time
        const sourceTeacherBusy = getConflicts(draggedLesson.teacher_id, targetDay, targetPeriod, targetClassId);
        if (sourceTeacherBusy.length > 0) {
            const teacherName = data.teachers.find(t => t.id === draggedLesson.teacher_id)?.name;
            conflicts.push(`${teacherName} вже має урок у ${sourceTeacherBusy.join(', ')}`);
        }

        // Check 2: If swap, is target teacher busy at source time?
        if (targetLesson) {
            const targetTeacherBusy = getConflicts(targetLesson.teacher_id, draggedLesson.day, draggedLesson.period, targetClassId);
            if (targetTeacherBusy.length > 0) {
                const teacherName = data.teachers.find(t => t.id === targetLesson.teacher_id)?.name;
                conflicts.push(`${teacherName} вже має урок у ${targetTeacherBusy.join(', ')}`);
            }
        }

        if (targetLesson || conflicts.length > 0) {
            setDragConfirm({
                type: targetLesson ? 'swap' : 'move',
                source: draggedLesson,
                target: { classId: targetClassId, day: targetDay, period: targetPeriod, lesson: targetLesson },
                conflicts
            });
        } else {
            // Direct move if no target and no conflicts
            let updatedLessons = [...lessons];

            // Remove old
            updatedLessons = updatedLessons.filter(l =>
                !(l.class_id === draggedLesson.class_id && l.day === draggedLesson.day && l.period === draggedLesson.period)
            );
            // Add new
            updatedLessons.push({
                ...draggedLesson,
                class_id: targetClassId,
                day: targetDay,
                period: targetPeriod
            });

            const newResponse: ScheduleResponse = {
                status: schedule.status === 'conflict' ? 'conflict' : 'success',
                schedule: updatedLessons,
                violations: schedule.status === 'conflict' ? schedule.violations : []
            };
            onScheduleChange(newResponse);
            setDraggedLesson(null);
        }
        setDragOverCell(null);
    };

    // Redundant DashboardView internal definition removed
    // Redundant MatrixView internal definition removed
    // Redundant TeachersMasterView internal definition removed

    const findLessonByTeacher = (teacherId: string, day: string, period: number): Lesson | null => {
        return lessons.find(l =>
            l.teacher_id === teacherId &&
            l.day === day &&
            l.period === period
        ) || null;
    };

    const getTeacherStats = (teacherId: string) => {
        if (!lessons) return { totalHours: 0, days: 0 };
        const teacherLessons = lessons.filter(l => l.teacher_id === teacherId);
        const totalHours = teacherLessons.length;
        const days = new Set(teacherLessons.map(l => l.day)).size;
        return { totalHours, days };
    };

    return (
        <div className="space-y-8 h-full flex flex-col overflow-hidden">
            {/* View Selection Bar & Edit Mode Toggle */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div className="flex flex-wrap gap-2 p-1.5 bg-[#18181b] rounded-2xl w-fit border border-white/5">
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
                                "flex items-center gap-2 px-5 py-2 rounded-xl font-bold transition-all duration-200",
                                viewType === tab.id
                                    ? "bg-white/10 text-white shadow-lg shadow-black/20"
                                    : "text-[#a1a1aa] hover:text-white"
                            )}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 p-1.5 bg-[#18181b] rounded-2xl border border-white/5">
                    <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all duration-300 group",
                            isEditMode
                                ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                                : "text-[#a1a1aa] hover:text-white"
                        )}
                    >
                        {isEditMode ? (
                            <>
                                <Unlock size={18} className="animate-pulse" />
                                <span>Редагування УВІМК.</span>
                            </>
                        ) : (
                            <>
                                <Lock size={18} />
                                <span>Редагування ВИМК.</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {viewType === 'dashboard' ? (
                <DashboardView
                    data={data}
                    selectedClassId={selectedClassId}
                    setSelectedClassId={setSelectedClassId}
                    timeInfo={timeInfo}
                    findLesson={findLesson}
                    periods={periods}
                    getRoomColor={getRoomColor}
                    sortedClasses={sortedClasses}
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
                    isEditMode={isEditMode}
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
                    isEditMode={isEditMode}
                />
            ) : (
                <TeachersMasterView
                    data={data}
                    masterDay={masterDay}
                    setMasterDay={setMasterDay}
                    findLessonByTeacher={findLessonByTeacher}
                    getRoomColor={getRoomColor}
                    periods={periods}
                    days={days}
                    apiDays={apiDays}
                    setViewingLesson={setViewingLesson}
                    isEditMode={isEditMode}
                    setEditingTeacherCell={setEditingTeacherCell}
                />
            )}

            {editingCell && (
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
                />
            )}

            {viewingLesson && (
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
                />
            )}

            {dragConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setDragConfirm(null)}>
                    <div className="bg-[#18181b] w-full max-w-sm rounded-3xl border border-white/10 shadow-2xl overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
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
                </div>
            )}

            {/* Teacher Edit Modal */}
            {editingTeacherCell && (
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
                />
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
                                    onClick={handleClear}
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

function TeacherEditModal({ data, schedule, teacherId, day, period, onSave, onClose }: TeacherEditModalProps) {
    const existingLesson = schedule.find(l => l.teacher_id === teacherId && l.day === day && l.period === period);

    const [classId, setClassId] = useState(existingLesson?.class_id || '');
    const [subjectId, setSubjectId] = useState(existingLesson?.subject_id || '');
    const [room, setRoom] = useState(existingLesson?.room || '');
    const [conflict, setConflict] = useState<{ teacherName: string, className: string } | null>(null);

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
                                    onClick={handleClear}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-[#18181b] w-full max-w-sm rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
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

