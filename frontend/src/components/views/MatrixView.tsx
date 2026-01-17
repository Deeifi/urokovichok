import { memo, useState, useMemo, useDeferredValue, useCallback } from 'react';
// import { Search, Droplet, LayoutGrid, Eye, EyeOff } from 'lucide-react'; // Removed unused icons
import { cn } from '../../utils/cn';
import { useDataStore } from '../../store/useDataStore';
// import { useScheduleStore } from '../../store/useScheduleStore'; // Removed
import { useUIStore } from '../../store/useUIStore';
import { getRoomColor, getSubjectColor } from '../../utils/gridHelpers';
import { CompactMatrixSchedule } from '../CompactMatrixSchedule';
import { UnifiedGridView } from '../UnifiedGridView';
import type { Lesson } from '../../types';

interface MatrixViewProps {
    lessons: Lesson[];
    draggedLesson: Lesson | null;
    setDraggedLesson: (l: Lesson | null) => void;
    dragOverCell: any;
    setDragOverCell: (c: any) => void;
    processDrop: (classId: string, day: string, period: number, externalLesson?: any) => void;
    setViewingLesson: (c: any) => void;
    setEditingCell: (c: any) => void;
}

export const MatrixView = memo(({
    lessons,
    draggedLesson, setDraggedLesson, dragOverCell, setDragOverCell, processDrop,
    setViewingLesson, setEditingCell
}: MatrixViewProps) => {
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
    const showIcons = useUIStore(s => s.showIcons);
    // const setShowIcons = useUIStore(s => s.setShowIcons); // Unused
    const selectedTeacherId = useUIStore(s => s.selectedTeacherId);
    const searchQuery = useUIStore(s => s.searchQuery); // Use shared state

    const [day, setDay] = useState<string>('Mon');
    const [activeGradeGroup, setActiveGradeGroup] = useState<'1-4' | '5-9' | '10-11'>('5-9');
    // const [searchQuery, setSearchQuery] = useState(''); // Removed local state
    const deferredSearchQuery = useDeferredValue(searchQuery);

    const days = ["Пн", "Вт", "Ср", "Чт", "Пт"];
    const apiDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const periods = [0, 1, 2, 3, 4, 5, 6, 7];

    const filledGetSubjectColor = useCallback((id: string) => getSubjectColor(id, data.subjects), [data.subjects]);

    const findLesson = useCallback((classId: string, d: string, p: number) => {
        return lessons.find(l => l.class_id === classId && l.day === d && l.period === p);
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

    const sortedClasses = useMemo(() =>
        ([...data.classes].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))),
        [data.classes]
    );

    const filteredClasses = useMemo(() => {
        let classes = sortedClasses;
        if (!isCompact) {
            if (activeGradeGroup === '1-4') classes = classes.filter(c => parseInt(c.name) <= 4);
            else if (activeGradeGroup === '5-9') classes = classes.filter(c => parseInt(c.name) >= 5 && parseInt(c.name) <= 9);
            else if (activeGradeGroup === '10-11') classes = classes.filter(c => parseInt(c.name) >= 10);
        }

        if (deferredSearchQuery) {
            classes = classes.filter(c => c.name.toLowerCase().includes(deferredSearchQuery.toLowerCase()));
        }
        return classes;
    }, [sortedClasses, activeGradeGroup, deferredSearchQuery, isCompact]);

    const dayName = days[apiDays.indexOf(day)];

    return (
        <div className={cn("animate-in fade-in duration-300 h-full flex flex-col overflow-hidden", isCompact ? "space-y-1" : "space-y-3 lg:space-y-4")}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                {!isCompact && (
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-black text-white tracking-tight">Матриця</h2>
                        <div className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest mt-1">
                            {dayName} • {activeGradeGroup === '1-4' ? '1-4 Класи' : activeGradeGroup === '5-9' ? '5-9 Класи' : '10-11 Класи'}
                        </div>
                    </div>
                )}

                <div className={cn("flex flex-wrap items-center gap-6", isCompact ? "ml-auto" : "")}>
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

                    {!isCompact && (
                        <div className="flex bg-[#18181b] p-1 rounded-xl border border-white/5">
                            <button onClick={() => setActiveGradeGroup('1-4')} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black transition-all", activeGradeGroup === '1-4' ? "bg-white/10 text-white" : "text-[#a1a1aa] hover:text-white")}>1-4</button>
                            <button onClick={() => setActiveGradeGroup('5-9')} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black transition-all", activeGradeGroup === '5-9' ? "bg-white/10 text-white" : "text-[#a1a1aa] hover:text-white")}>5-9</button>
                            <button onClick={() => setActiveGradeGroup('10-11')} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black transition-all", activeGradeGroup === '10-11' ? "bg-white/10 text-white" : "text-[#a1a1aa] hover:text-white")}>10-11</button>
                        </div>
                    )}
                </div>
            </div>

            {isCompact ? (
                <CompactMatrixSchedule
                    data={data}
                    lessons={lessons}
                    periods={periods}
                    apiDays={apiDays}
                    days={days}
                    getSubjectColor={filledGetSubjectColor}
                    getConflicts={getConflicts}
                    isEditMode={isEditMode}
                    onCellClick={(classId, d, period, lesson, e) => {
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
                            setEditingCell({ classId, day: d, period });
                        } else if (lesson) {
                            setViewingLesson({ classId: lesson.class_id, day: d, period });
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
                    filteredClasses={filteredClasses}
                />
            ) : (
                <UnifiedGridView
                    items={filteredClasses.map(c => ({ ...c, type: 'class' as const }))}
                    day={day}
                    periods={periods}
                    data={data}
                    isEditMode={isEditMode}
                    isMonochrome={isMonochrome}
                    perfSettings={perfSettings}
                    getLessons={(cls, d, p) => [findLesson(cls.id, d, p)].filter((l): l is Lesson => !!l)}
                    getConflicts={getConflicts}
                    getClassConflicts={getClassConflicts}
                    getSubjectColor={filledGetSubjectColor}
                    getRoomColor={getRoomColor}
                    getItemIdentifier={(c) => c.id}
                    renderItemInfo={(cls) => (
                        <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 mb-2 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500">
                                <span className="text-sm font-black">{cls.name}</span>
                            </div>
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{cls.name} КЛАС</span>
                        </div>
                    )}
                    onCellClick={(classId, d, p, lesson, e) => {
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
                            setEditingCell({ classId, day: d, period: p });
                        } else if (lesson) {
                            setViewingLesson({ classId: lesson.class_id, day: d, period: p });
                        }
                    }}
                    onDrop={processDrop}
                    draggedLesson={draggedLesson}
                    setDraggedLesson={setDraggedLesson}
                    dragOverCell={dragOverCell}
                    setDragOverCell={setDragOverCell}
                    infoColumnWidth="w-[120px]"
                    onRowHeaderClick={(classId, e) => {
                        if (e.ctrlKey || e.metaKey) {
                            const classLessons = lessons.filter(l => l.class_id === classId);
                            const newIds = classLessons.map(l => `${l.class_id}-${l.day}-${l.period}-${l.subject_id}`);
                            const currentSelected = useUIStore.getState().selectedLessonIds;
                            useUIStore.getState().setSelectedLessons(Array.from(new Set([...currentSelected, ...newIds])));
                        }
                    }}
                />
            )}
        </div>
    );
});
