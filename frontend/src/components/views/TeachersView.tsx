import { memo, useState, useMemo, useDeferredValue, useCallback } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useDataStore } from '../../store/useDataStore';
// import { useScheduleStore } from '../../store/useScheduleStore'; // Removed
import { useUIStore } from '../../store/useUIStore';
import { getRoomColor, getSubjectColor } from '../../utils/gridHelpers';
import { CompactTeacherSchedule } from '../CompactTeacherSchedule';
import { UnifiedGridView } from '../UnifiedGridView';
import type { Lesson } from '../../types';

interface TeachersViewProps {
    lessons: Lesson[];
    draggedLesson: Lesson | null;
    setDraggedLesson: (l: Lesson | null) => void;
    processTeacherDrop: (teacherId: string, day: string, period: number, externalLesson?: any) => void;
    setViewingLesson: (c: { classId: string, day: string, period: number } | null) => void;
    setEditingTeacherCell: (c: { teacherId: string, day: string, period: number } | null) => void;
    isFullScreen?: boolean;
}

export const TeachersView = memo(({
    lessons,
    draggedLesson, setDraggedLesson, processTeacherDrop,
    setViewingLesson, setEditingTeacherCell, isFullScreen
}: TeachersViewProps) => {
    const data = useDataStore(s => s.data);
    // const scheduleResponse = useScheduleStore(s => s.schedule); // Removed
    // const lessons = (scheduleResponse?.status === 'success' || scheduleResponse?.status === 'conflict') ? scheduleResponse.schedule : []; // Removed

    const isCompact = useUIStore(s => s.isCompact);
    // const setIsCompact = useUIStore(s => s.setIsCompact); // Unused
    const isEditMode = useUIStore(s => s.isEditMode);
    const perfSettings = useUIStore(s => s.perfSettings);
    const isMonochrome = useUIStore(s => s.isMonochrome);
    // const setIsMonochrome = useUIStore(s => s.setIsMonochrome); // Unused
    const userRole = useUIStore(s => s.userRole);
    const selectedTeacherId = useUIStore(s => s.selectedTeacherId);
    const setSearchQuery = useUIStore(s => s.setSearchQuery);
    const searchQuery = useUIStore(s => s.searchQuery);

    const [day, setDay] = useState<string>('Mon');
    // const [searchQuery, setSearchQuery] = useState(''); // Removed local state
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
        let list = data.teachers || [];
        if (userRole === 'teacher' && selectedTeacherId) {
            list = list.filter(t => t.id === selectedTeacherId);
        }

        const query = deferredSearchQuery.toLowerCase();
        if (query) {
            list = list.filter(t => t.name.toLowerCase().includes(query));
        }

        return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }, [data.teachers, deferredSearchQuery, userRole, selectedTeacherId]);

    const dayName = days[apiDays.indexOf(day)];

    return (
        <div className={cn("animate-in fade-in duration-300 h-full flex flex-col overflow-hidden", isCompact ? "space-y-1" : "space-y-3 lg:space-y-4")}>
            {!isFullScreen && (
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 shrink-0">
                    {!isCompact && (
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Розклад вчителів</h2>
                            <div className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest mt-1">
                                Всі викладачі • {dayName}
                            </div>
                        </div>
                    )}

                    <div className={cn("flex flex-wrap items-center gap-4")}>
                        {/* Search Input and Counter */}
                        {!isCompact && (
                            <div className="flex items-center gap-2 bg-[#18181b] rounded-xl border border-white/5 px-2.5 h-9 transition-all group focus-within:border-indigo-500/50 focus-within:shadow-lg focus-within:shadow-indigo-500/10 min-w-0">
                                <Search size={14} className="text-[#a1a1aa] group-focus-within:text-indigo-400 transition-colors shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Пошук..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent border-none focus:ring-0 text-[10px] min-[1100px]:text-xs font-bold text-white placeholder-[#a1a1aa] w-12 focus:w-24 min-[1100px]:w-20 min-[1100px]:focus:w-32 transition-all outline-none uppercase tracking-wide"
                                />

                                {/* Counter Badge */}
                                <div className="flex items-center gap-1 pl-1.5 border-l border-white/10 ml-0.5 shrink-0">
                                    <span className={cn("text-[10px] font-black transition-colors",
                                        filteredTeachers.length === 0 ? "text-red-400" : "text-indigo-400"
                                    )}>
                                        {filteredTeachers.length}
                                    </span>
                                    <span className="text-[10px] font-bold text-[#a1a1aa] select-none">/</span>
                                    <span className="text-[10px] font-bold text-[#a1a1aa] select-none">
                                        {data.teachers?.length || 0}
                                    </span>
                                </div>
                            </div>
                        )}

                        {!isCompact && (
                            <div className="flex bg-[#18181b] p-1 rounded-xl border border-white/5 overflow-x-auto">
                                {apiDays.map((d, idx) => (
                                    <button
                                        key={d}
                                        onClick={(e) => {
                                            if (e.ctrlKey || e.metaKey) {
                                                const dayLessons = lessons.filter(l => l.day === d);
                                                const newIds = dayLessons.map(l => `${l.class_id}-${l.day}-${l.period}-${l.subject_id}`);
                                                const currentSelected = useUIStore.getState().selectedLessonIds;
                                                useUIStore.getState().setSelectedLessons(Array.from(new Set([...currentSelected, ...newIds])));
                                            } else {
                                                setDay(d);
                                            }
                                        }}
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
                    </div>
                </div>
            )}

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
                    onCellClick={(teacherId, d, period, lesson, e) => {
                        const isCtrlPressed = e?.ctrlKey || e?.metaKey;
                        if (isCtrlPressed && lesson) {
                            if (e.shiftKey) {
                                const teacherLessons = lessons.filter(l => l.teacher_id === lesson.teacher_id);
                                const newIds = teacherLessons.map(l => `${l.class_id}-${l.day}-${l.period}-${l.subject_id}`);
                                const currentSelected = useUIStore.getState().selectedLessonIds;
                                useUIStore.getState().setSelectedLessons(Array.from(new Set([...currentSelected, ...newIds])));
                            } else {
                                const uniqueId = `${lesson.class_id}-${lesson.day}-${lesson.period}-${lesson.subject_id}`;
                                useUIStore.getState().toggleSelectedLesson(uniqueId);
                            }
                            return;
                        }

                        if (isEditMode) {
                            setEditingTeacherCell({ teacherId, day: d, period });
                        } else if (lesson) {
                            setViewingLesson({ classId: lesson.class_id, day: d, period });
                        }
                    }}
                    draggedLesson={draggedLesson}
                    setDraggedLesson={setDraggedLesson}
                    processTeacherDrop={processTeacherDrop}
                    isMonochrome={isMonochrome}
                    searchQuery={deferredSearchQuery}
                    perfSettings={perfSettings}
                    getClassConflicts={getClassConflicts}
                />
            ) : (
                <UnifiedGridView
                    items={filteredTeachers.map(t => ({ ...t, type: 'teacher' as const }))}
                    day={day}
                    periods={periods}
                    data={data}
                    isEditMode={isEditMode}
                    isMonochrome={isMonochrome}
                    perfSettings={perfSettings}
                    getLessons={(teacher, d, p) => findAllLessonsByTeacher(teacher.id, d, p)}
                    getConflicts={getConflicts}
                    getClassConflicts={getClassConflicts}
                    getSubjectColor={filledGetSubjectColor}
                    getRoomColor={getRoomColor}
                    getItemIdentifier={(t) => t.id}
                    renderItemInfo={(teacher) => {
                        const teacherPlan = (data.plan || []).filter((p: any) => p.teacher_id === teacher.id);
                        const mainSubject = data.subjects.find((s: any) => s.id === (teacherPlan[0]?.subject_id || ''))?.name || "—";
                        const stats = getTeacherStats(teacher.id);

                        return (
                            <>
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
                                            {stats.totalHours}г / {stats.days}д
                                        </span>
                                    </div>
                                </div>
                            </>
                        );
                    }}
                    onCellClick={(teacherId, d, p, lesson, e) => {
                        const isCtrlPressed = e?.ctrlKey || e?.metaKey;
                        if (isCtrlPressed && lesson) {
                            if (e.shiftKey) {
                                const teacherLessons = lessons.filter(l => l.teacher_id === lesson.teacher_id);
                                const newIds = teacherLessons.map(l => `${l.class_id}-${l.day}-${l.period}-${l.subject_id}`);
                                const currentSelected = useUIStore.getState().selectedLessonIds;
                                useUIStore.getState().setSelectedLessons(Array.from(new Set([...currentSelected, ...newIds])));
                            } else {
                                const uniqueId = `${lesson.class_id}-${lesson.day}-${lesson.period}-${lesson.subject_id}`;
                                useUIStore.getState().toggleSelectedLesson(uniqueId);
                            }
                            return;
                        }

                        if (isEditMode) {
                            setEditingTeacherCell({ teacherId, day: d, period: p });
                        } else if (lesson) {
                            setViewingLesson({ classId: lesson.class_id, day: d, period: p });
                        }
                    }}
                    onDrop={processTeacherDrop}
                    draggedLesson={draggedLesson}
                    setDraggedLesson={setDraggedLesson}
                    infoColumnWidth="w-[160px]"
                    onRowHeaderClick={(teacherId, e) => {
                        if (e.ctrlKey || e.metaKey) {
                            const teacherLessons = lessons.filter(l => l.teacher_id === teacherId);
                            const newIds = teacherLessons.map(l => `${l.class_id}-${l.day}-${l.period}-${l.subject_id}`);
                            const currentSelected = useUIStore.getState().selectedLessonIds;
                            useUIStore.getState().setSelectedLessons(Array.from(new Set([...currentSelected, ...newIds])));
                        }
                    }}
                />
            )}
        </div>
    );
});
