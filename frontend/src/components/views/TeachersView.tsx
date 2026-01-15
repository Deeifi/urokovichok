import { memo, useState, useMemo, useDeferredValue, useCallback } from 'react';
import * as rw from 'react-window';
const { FixedSizeList } = (rw as any).default || rw;
import { AutoSizer } from 'react-virtualized-auto-sizer';
const AutoSizerAny = AutoSizer as any;

import { Users, Search, Droplet, LayoutGrid, Plus } from 'lucide-react';

import { cn } from '../../utils/cn';
import { useDataStore } from '../../store/useDataStore';
import { useScheduleStore } from '../../store/useScheduleStore';
import { useUIStore } from '../../store/useUIStore';
import { getRoomColor, getSubjectColor } from '../../utils/gridHelpers';
import { useHover } from '../../context/HoverContext';
import { CompactTeacherSchedule } from '../CompactTeacherSchedule';
import type { Lesson } from '../../types';

interface TeachersViewProps {


    draggedLesson: Lesson | null;
    setDraggedLesson: (l: Lesson | null) => void;
    dragOverCell: any;
    setDragOverCell: (c: any) => void;
    processTeacherDrop: (teacherId: string, day: string, period: number, externalLesson?: any) => void;

    setViewingLesson: (c: { classId: string, day: string, period: number } | null) => void;
    setEditingTeacherCell: (c: { teacherId: string, day: string, period: number } | null) => void;
}

export const TeachersView = memo(({

    draggedLesson, setDraggedLesson, dragOverCell, setDragOverCell, processTeacherDrop,
    setViewingLesson, setEditingTeacherCell
}: TeachersViewProps) => {
    const data = useDataStore(s => s.data);
    const schedule = useScheduleStore(s => s.schedule);
    const lessons = (schedule?.status === 'success' || schedule?.status === 'conflict') ? schedule.schedule : [];

    const isCompact = useUIStore(s => s.isCompact);
    const setIsCompact = useUIStore(s => s.setIsCompact);
    const isEditMode = useUIStore(s => s.isEditMode);
    const perfSettings = useUIStore(s => s.perfSettings);
    const selectedTeacherId = useUIStore(s => s.selectedTeacherId);
    const isMonochrome = useUIStore(s => s.isMonochrome);
    const setIsMonochrome = useUIStore(s => s.setIsMonochrome);
    const userRole = useUIStore(s => s.userRole);



    const [day, setDay] = useState<string>('Mon');
    const [searchQuery, setSearchQuery] = useState('');
    const deferredSearchQuery = useDeferredValue(searchQuery);

    const days = ["Пн", "Вт", "Ср", "Чт", "Пт"];
    const apiDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const periods = [0, 1, 2, 3, 4, 5, 6, 7];

    const filledGetSubjectColor = useCallback((id: string) => getSubjectColor(id, data.subjects), [data.subjects]);

    const findAllLessonsByTeacher = useCallback((teacherId: string, d: string, p: number): Lesson[] => {
        return lessons.filter(l =>
            l.teacher_id === teacherId &&
            l.day === d &&
            l.period === p
        );
    }, [lessons]);

    const getConflicts = useCallback((teacherId: string, d: string, p: number, excludeClassId?: string): string[] => {
        return lessons
            .filter(l =>
                l.teacher_id === teacherId &&
                l.day === d &&
                l.period === p &&
                l.class_id !== excludeClassId
            )
            .map(l => data.classes.find(c => c.id === l.class_id)?.name || '???');
    }, [lessons, data.classes]);

    const getClassConflicts = useCallback((classId: string, d: string, p: number, excludeTeacherId?: string): string[] => {
        return lessons
            .filter(l =>
                l.class_id === classId &&
                l.day === d &&
                l.period === p &&
                l.teacher_id !== excludeTeacherId
            )
            .map(l => data.teachers.find(t => t.id === l.teacher_id)?.name || '???');
    }, [lessons, data.teachers]);

    const getTeacherStats = useCallback((teacherId: string) => {
        const teacherLessons = lessons.filter(l => l.teacher_id === teacherId);
        const totalHours = teacherLessons.length;
        const activeDays = new Set(teacherLessons.map(l => l.day)).size;
        return { totalHours, days: activeDays };
    }, [lessons]);


    const filteredTeachers = useMemo(() => {
        let list = data.teachers;
        if (userRole === 'teacher' && selectedTeacherId) {
            list = list.filter(t => t.id === selectedTeacherId);
        }

        const query = deferredSearchQuery.toLowerCase();
        if (query) {
            list = list.filter(t => t.name.toLowerCase().includes(query));
        }

        return list.sort((a, b) => a.name.localeCompare(b.name));
    }, [data.teachers, deferredSearchQuery, userRole, selectedTeacherId]);

    const dayName = days[apiDays.indexOf(day)];

    const rowProps = useMemo(() => ({
        filteredTeachers,
        data,
        masterDay: day,
        findAllLessonsByTeacher,
        getRoomColor,
        getSubjectColor: filledGetSubjectColor,
        getConflicts,
        getClassConflicts,
        setViewingLesson,
        isEditMode,
        setEditingTeacherCell,
        getTeacherStats,
        lessons,
        draggedLesson,
        setDraggedLesson,
        dragOverCell,
        setDragOverCell,
        processTeacherDrop,
        perfSettings,
        periods
    }), [
        filteredTeachers, data, day, lessons, isEditMode, draggedLesson, dragOverCell, perfSettings
    ]);

    return (
        <div className={cn("animate-in fade-in duration-300 h-full flex flex-col overflow-hidden", isCompact ? "space-y-1" : "space-y-3 lg:space-y-4")}>
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
                                className="bg-transparent border-none focus:ring-0 text-xs font-bold text-white placeholder-white/20 w-32 outline-none"
                            />
                        </div>
                    </div>

                    {!isCompact && (
                        <div className="flex bg-[#18181b] p-1 rounded-xl border border-white/5 overflow-x-auto">
                            {apiDays.map((d, idx) => (
                                <button
                                    key={d}
                                    onClick={() => setDay(d)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-[10px] font-black transition-all whitespace-nowrap",
                                        day === d ? "bg-white/10 text-white" : "text-[#a1a1aa] hover:text-white"
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
                    getSubjectColor={filledGetSubjectColor}
                    getConflicts={getConflicts}
                    isEditMode={isEditMode}
                    onCellClick={(teacherId, d, period, lesson) => {
                        if (isEditMode) {
                            setEditingTeacherCell({ teacherId, day: d, period });
                        } else if (lesson) {
                            setViewingLesson({ classId: lesson.class_id, day: d, period });
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
                    <div className="flex-1 overflow-x-auto custom-scrollbar">
                        <div className="min-w-[1280px] h-full flex flex-col">
                            {/* Sticky Header */}
                            <div className="flex border-b border-white/5 bg-[#18181b] sticky top-0 z-50">
                                <div className="w-[160px] p-3 text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest text-center border-r border-white/5 shrink-0">
                                    ВИКЛАДАЧ
                                </div>
                                {periods.map(p => (
                                    <div key={p} className="flex-1 min-w-[140px] p-3 text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest border-r border-white/5 text-center last:border-r-0">
                                        {p}<br />
                                        <span className="text-[8px] opacity-50 font-black">УРОК</span>
                                    </div>
                                ))}
                            </div>

                            {/* Virtualized List */}
                            <div className="flex-1">
                                <AutoSizerAny>

                                    {({ height, width }: any) => (
                                        <FixedSizeList
                                            height={height}
                                            width={width}
                                            itemCount={filteredTeachers.length}
                                            itemSize={80}
                                            itemData={rowProps}
                                        >
                                            {TeacherRow as any}
                                        </FixedSizeList>
                                    )}
                                </AutoSizerAny>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

const TeacherRow = memo(({ index, style, data }: any) => {
    const {
        filteredTeachers, data: scheduleData, masterDay, findAllLessonsByTeacher, getRoomColor, getSubjectColor,
        getConflicts, getClassConflicts, setViewingLesson, isEditMode, setEditingTeacherCell,
        getTeacherStats, processTeacherDrop, perfSettings, periods, setDragOverCell
    } = data;

    const teacher = filteredTeachers[index];
    const { hoveredLesson, setHoveredLesson } = useHover();

    const teacherPlan = (scheduleData.plan || []).filter((p: any) => p.teacher_id === teacher.id);
    const mainSubject = scheduleData.subjects.find((s: any) => s.id === (teacherPlan[0]?.subject_id || ''))?.name || "—";

    return (
        <div style={style} className={cn(
            "flex border-b border-white/5 group transition-colors min-w-[1280px]",
            !perfSettings.disableAnimations && "hover:bg-white/[0.01]"
        )}>
            {/* Teacher Info Column */}
            <div className="w-[160px] p-4 border-r border-white/5 text-center shrink-0 flex flex-col items-center gap-2 justify-center bg-[#18181b]">
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

            {/* Lesson Columns */}
            {periods.map((p: number) => {
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
                    (teacherLessons.some((l: Lesson) => l.teacher_id === hoveredLesson.teacher_id) && masterDay === hoveredLesson.day && p === hoveredLesson.period) ||
                    (teacherLessons.some((l: Lesson) => l.class_id === hoveredLesson.class_id) && masterDay === hoveredLesson.day && p === hoveredLesson.period)
                );

                const hasOtherClasses = teacherLessons.some((l: Lesson) => getConflicts(l.teacher_id, masterDay, p, l.class_id).length > 0);
                const hasOtherTeachers = teacherLessons.some((l: Lesson) => getClassConflicts(l.class_id, masterDay, p, l.teacher_id).length > 0);
                const isActualConflict = isTeacherHighlighted && (teacherLessons.length > 1 || hasOtherClasses || hasOtherTeachers);

                const isRecommendedSlot = !hasLessons && hoveredLesson &&
                    hoveredLesson.teacher_id === teacher.id &&
                    getClassConflicts(hoveredLesson.class_id, masterDay, p).length === 0 &&
                    findAllLessonsByTeacher(teacher.id, masterDay, p).length === 0;

                const isStaticConflict = teacherLessons.length > 1 || hasOtherClasses || hasOtherTeachers;

                return (
                    <div key={p} className={cn(
                        "flex-1 min-w-[140px] p-2 border-r border-white/5 h-[80px] transition-all last:border-r-0 flex flex-col justify-center",
                        isStaticConflict && (teacherLessons.length > 1 || hasOtherClasses ? "bg-amber-500/5 ring-1 ring-inset ring-amber-500/30" : "bg-violet-500/5 ring-1 ring-inset ring-violet-500/30"),
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
                                const dataStr = e.dataTransfer.getData('lesson');
                                const externalLesson = dataStr ? JSON.parse(dataStr) : undefined;
                                processTeacherDrop(teacher.id, masterDay, p, externalLesson);
                            }
                        }}
                    >
                        {hasLessons ? (
                            <div className="flex flex-col gap-1 h-full justify-center">
                                {teacherLessons.map((lesson: Lesson, idx: number) => {
                                    const cls = scheduleData.classes.find((c: any) => c.id === lesson.class_id);
                                    const room = lesson.room || scheduleData.subjects.find((s: any) => s.id === lesson.subject_id)?.defaultRoom;
                                    const subjectName = scheduleData.subjects.find((s: any) => s.id === lesson.subject_id)?.name || "";

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
                    </div>
                );
            })}
        </div>
    );
});
