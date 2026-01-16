import { memo, useCallback, useMemo } from 'react';
import { Columns, AlertTriangle, Pencil } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { ScheduleRequest, Lesson, PerformanceSettings } from '../../types';
import { getSubjectColor } from '../../utils/gridHelpers';
import { useHover } from '../../context/HoverContext';

interface ByClassViewProps {
    data: ScheduleRequest;
    selectedClassId: string;
    setSelectedClassId: (id: string) => void;
    isCompact: boolean;
    isEditMode: boolean;
    perfSettings: PerformanceSettings;
    userRole: string;
    selectedTeacherId: string | null;
    lessons: Lesson[];
    apiDays: string[];
    days: string[];
    periods: number[];
    getTeacherConflicts: (teacherId: string, day: string, period: number, excludeClassId?: string) => string[];
    getClassConflicts: (classId: string, day: string, period: number, excludeTeacherId?: string) => string[];
    draggedLesson: Lesson | null;
    setDraggedLesson: (l: Lesson | null) => void;
    dragOverCell: any;
    setDragOverCell: (c: any) => void;
    processDrop: (className: string, day: string, p: number, external?: any) => void;
    setEditingCell: (c: { classId: string, day: string, period: number } | null) => void;
    setViewingLesson: (c: { classId: string, day: string, period: number } | null) => void;
    handleExportPDF: () => void;
    isExporting: boolean;
}

export const ByClassView = memo(({
    data, selectedClassId, setSelectedClassId, isCompact, isEditMode, perfSettings,
    userRole, selectedTeacherId, lessons, apiDays, days, periods,
    getTeacherConflicts, getClassConflicts, draggedLesson, setDraggedLesson,
    dragOverCell, setDragOverCell, processDrop, setEditingCell, setViewingLesson,
    handleExportPDF, isExporting
}: ByClassViewProps) => {
    const { hoveredLesson, setHoveredLesson } = useHover();

    const findLesson = useCallback((classId: string, day: string, period: number): Lesson | null => {
        return lessons.find(l =>
            l.class_id === classId &&
            l.day === day &&
            l.period === period
        ) || null;
    }, [lessons]);

    const sortedClasses = useMemo(() => [...data.classes].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })), [data.classes]);


    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#18181b]/50 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
                <div className="flex flex-wrap gap-2">
                    {sortedClasses.map(cls => (
                        <button
                            key={cls.id}
                            onClick={() => setSelectedClassId(cls.id)}
                            className={cn(
                                "px-3 py-1.5 rounded-xl font-bold transition-all text-xs uppercase tracking-tight",
                                selectedClassId === cls.id
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                    : "text-[#a1a1aa] hover:text-white hover:bg-white/5"
                            )}
                        >
                            {cls.name}
                        </button>
                    ))}
                </div>

                <button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                >
                    {isExporting ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : <Columns size={16} />}
                    {isExporting ? 'Експорт...' : 'Експорт PDF'}
                </button>
            </div>

            <div id="class-schedule-export" className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {apiDays.map((day, dIdx) => (
                    <div key={day} className={cn("bento-card border-white/5 bg-[#1a1a1e]", isCompact ? "p-2" : "p-4")}>
                        <h4 className={cn("text-[#a1a1aa] font-black text-center uppercase tracking-widest", isCompact ? "mb-0.5 text-[10px]" : "mb-4")}>{days[dIdx]}</h4>
                        <div className={isCompact ? "space-y-1" : "space-y-3"}>
                            {periods.map(p => {
                                const lesson = findLesson(selectedClassId, day, p);
                                const isUsed = !!lesson;

                                const subColor = lesson ? getSubjectColor(lesson.subject_id, data.subjects) : 'transparent';
                                const teacher = lesson ? data.teachers.find(t => t.id === lesson.teacher_id) : null;
                                const teacherConflicts = lesson ? getTeacherConflicts(lesson.teacher_id, day, p, selectedClassId) : [];
                                const classConflicts = lesson ? getClassConflicts(selectedClassId, day, p, lesson.teacher_id) : [];

                                const isDragOver = dragOverCell?.day === day && dragOverCell?.period === p && dragOverCell?.classId === selectedClassId;
                                const isDragging = draggedLesson?.day === day && draggedLesson?.period === p && draggedLesson?.class_id === selectedClassId;
                                const isTeacherHighlighted = hoveredLesson && lesson && lesson.teacher_id === hoveredLesson.teacher_id;
                                const isTeacherConflict = isTeacherHighlighted && hoveredLesson && day === hoveredLesson.day && p === hoveredLesson.period && (teacherConflicts.length > 0 || classConflicts.length > 0);

                                const activeForRec = draggedLesson || (hoveredLesson?.isUnscheduled ? hoveredLesson : null);
                                const isRecommendedSlot = !lesson && activeForRec &&
                                    activeForRec.class_id === selectedClassId &&
                                    getTeacherConflicts(activeForRec.teacher_id, day, p, selectedClassId).length === 0;

                                return (
                                    <div
                                        key={p}
                                        onMouseEnter={() => lesson && setHoveredLesson(lesson)}
                                        onMouseLeave={() => setHoveredLesson(null)}
                                        className={cn(
                                            "relative group cursor-pointer transition-all -mx-2 border-2",
                                            isCompact ? "p-1 rounded-md" : "p-2 rounded-lg",
                                            (isDragOver || isRecommendedSlot) ? "border-indigo-500 bg-indigo-500/10 scale-105 z-10" : "border-transparent",
                                            isRecommendedSlot && "bg-emerald-500/30 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse-slow",
                                            classConflicts.length > 0 && "ring-1 ring-violet-500/50 bg-violet-500/[0.02]",
                                            teacherConflicts.length > 0 && "ring-1 ring-amber-500/50 bg-amber-500/[0.02]",
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
                                                const dataStr = e.dataTransfer.getData('lesson');
                                                const externalLesson = dataStr ? JSON.parse(dataStr) : undefined;
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
