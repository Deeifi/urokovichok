import { memo } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../utils/cn';
import { useHover } from '../context/HoverContext';
import { useUIStore } from '../store/useUIStore'; // Import store
import type { Lesson, ScheduleRequest } from '../types';

interface UnifiedGridViewProps<T> {
    items: T[];
    day: string;
    periods: number[];
    data: ScheduleRequest;
    isEditMode: boolean;
    isMonochrome: boolean;
    perfSettings: any;

    // Core Logic
    getLessons: (item: T, day: string, period: number) => Lesson[];
    getConflicts: (teacherId: string, day: string, period: number, excludeClassId?: string) => string[];
    getClassConflicts: (classId: string, day: string, period: number, excludeTeacherId?: string) => string[];
    getSubjectColor: (subjectId: string) => string;
    getRoomColor: (room: string | undefined) => string;

    // Rendering
    renderItemInfo: (item: T) => React.ReactNode;
    getItemIdentifier: (item: T) => string;

    // Interaction
    // Interaction
    onCellClick: (itemId: string, day: string, period: number, lesson?: Lesson, e?: React.MouseEvent) => void;
    onDrop: (itemId: string, day: string, period: number, externalLesson?: any, isCopy?: boolean) => void;
    onRowHeaderClick?: (itemId: string, e: React.MouseEvent) => void;

    // Drag and Drop
    draggedLesson: Lesson | null;
    setDraggedLesson: (l: Lesson | null) => void;
    dragOverCell: any;
    setDragOverCell: (c: any) => void;

    // Label for empty cell
    emptyCellLabel?: string;
    infoColumnWidth?: string;
    minCellWidth?: string;
}

export const UnifiedGridView = <T extends { id: string, type: 'teacher' | 'class' }>(props: UnifiedGridViewProps<T>) => {
    const {
        items = [], periods = [], infoColumnWidth = "w-[160px]", minCellWidth = "min-w-[140px]"
    } = props;

    return (
        <div className="bento-card border-white/5 overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="flex-1 flex flex-col overflow-x-auto custom-scrollbar min-h-0">
                <div className={cn("flex-1 flex flex-col min-h-0", items.length > 5 ? "min-w-[1280px]" : "w-full")}>
                    {/* Sticky Header */}
                    <div className="flex border-b border-white/5 bg-[#18181b] sticky top-0 z-50">
                        <div className={cn("p-3 text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest text-center border-r border-white/5 shrink-0", infoColumnWidth)}>
                            ОБ'ЄКТ
                        </div>
                        {periods.map(p => (
                            <div
                                key={p}
                                onClick={(e) => {
                                    if (e.ctrlKey || e.metaKey) {
                                        const allLessons: Lesson[] = [];
                                        items.forEach(item => {
                                            const cellLessons = props.getLessons(item, props.day, p);
                                            allLessons.push(...cellLessons);
                                        });
                                        const newIds = allLessons.map(l => `${l.class_id}-${l.day}-${l.period}-${l.subject_id}`);
                                        const currentSelected = useUIStore.getState().selectedLessonIds;
                                        useUIStore.getState().setSelectedLessons(Array.from(new Set([...currentSelected, ...newIds])));
                                    }
                                }}
                                className={cn("flex-1 p-3 text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest border-r border-white/5 text-center last:border-r-0 cursor-pointer hover:bg-white/5 transition-colors", minCellWidth)}
                            >
                                {p}<br />
                                <span className="text-[8px] opacity-50 font-black">УРОК</span>
                            </div>
                        ))}
                    </div>

                    {/* Rows */}
                    <div className="flex-1 flex flex-col">
                        {items.length > 0 ? (
                            items.map((item, idx) => (
                                <UnifiedRow
                                    key={props.getItemIdentifier(item)}
                                    item={item}
                                    index={idx}
                                    {...props}
                                />
                            ))
                        ) : (
                            <div className="flex-1 flex items-center justify-center p-20 text-[#a1a1aa] font-bold uppercase tracking-widest opacity-50">
                                Дані не знайдені
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const UnifiedRow = memo(({ item, ...props }: any) => {
    const {
        day, periods = [], data, isEditMode, isMonochrome, perfSettings = {},
        getLessons, getConflicts, getClassConflicts, renderItemInfo,
        onCellClick, onDrop, setDragOverCell, setDraggedLesson,
        draggedLesson, dragOverCell, onRowHeaderClick,
        emptyCellLabel = "ДОДАТИ", infoColumnWidth, minCellWidth
    } = props;

    const { hoveredLesson, setHoveredLesson } = useHover();
    const selectedLessonIds = useUIStore(s => s.selectedLessonIds);

    return (
        <div className={cn(
            "flex border-b border-white/5 group transition-colors",
            !perfSettings?.disableAnimations && "hover:bg-white/[0.01]"
        )}>
            {/* Info Column */}
            <div
                onClick={(e) => onRowHeaderClick?.(item.id, e)}
                className={cn("p-4 border-r border-white/5 text-center shrink-0 flex flex-col items-center gap-2 justify-center bg-[#18181b] cursor-pointer hover:bg-white/5 transition-colors", infoColumnWidth)}
            >
                {renderItemInfo(item)}
            </div>

            {/* Lesson Columns */}
            {periods.map((p: number) => {
                const cellLessons = getLessons?.(item, day, p) || [];
                const hasLessons = cellLessons.length > 0;

                const activeLesson = draggedLesson || hoveredLesson;

                const isHighlighted = activeLesson && (
                    // Глобальне підсвічування вчителя
                    cellLessons.some((l: Lesson) => l.teacher_id === activeLesson.teacher_id) ||
                    // Підсвічування класу рівно в той самий час (конкретний слот)
                    (cellLessons.some((l: Lesson) => l.class_id === activeLesson.class_id) && day === activeLesson.day && p === activeLesson.period)
                );

                const hasOtherClasses = cellLessons.some((l: Lesson) => getConflicts?.(l.teacher_id, day, p, l.class_id)?.length > 0);
                const hasOtherTeachers = cellLessons.some((l: Lesson) => getClassConflicts?.(l.class_id, day, p, l.teacher_id)?.length > 0);
                const isActualConflict = isHighlighted && (cellLessons.length > 1 || hasOtherClasses || hasOtherTeachers);

                const isDragOver = dragOverCell &&
                    dragOverCell[item.type === 'teacher' ? 'teacherId' : 'classId'] === item.id &&
                    dragOverCell.day === day &&
                    dragOverCell.period === p;

                // Recommended slot logic
                const activeForRec = draggedLesson || (hoveredLesson?.isUnscheduled ? hoveredLesson : null);

                const isRecommendedSlot = !hasLessons && activeForRec && (
                    item.type === 'teacher'
                        ? (activeForRec.teacher_id === item.id && getClassConflicts?.(activeForRec.class_id, day, p)?.length === 0)
                        : (activeForRec.class_id === item.id && getConflicts?.(activeForRec.teacher_id, day, p, activeForRec.class_id)?.length === 0)
                );

                const isStaticConflict = cellLessons.length > 1 || hasOtherClasses || hasOtherTeachers;

                return (
                    <div
                        key={p}
                        className={cn(
                            "flex-1 p-2 border-r border-white/5 h-[80px] transition-all duration-300 last:border-r-0 flex flex-col justify-center relative",
                            minCellWidth,
                            isStaticConflict && (cellLessons.length > 1 || hasOtherClasses ? "bg-amber-500/5 ring-1 ring-inset ring-amber-500/20" : "bg-violet-500/5 ring-1 ring-inset ring-violet-500/20"),
                            isDragOver && "bg-indigo-500/10",
                            isHighlighted && (isActualConflict
                                ? "bg-amber-500/15 ring-1 ring-inset ring-amber-400/50 z-30 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                                : "bg-indigo-500/10 ring-1 ring-inset ring-indigo-400/30 z-20 shadow-[0_0_15px_rgba(129,140,248,0.15)]"
                            ),
                            // Specific card focus if hovered directly (not just related)
                            activeLesson && cellLessons.some((l: Lesson) =>
                                (l.teacher_id === activeLesson.teacher_id && l.class_id === activeLesson.class_id && l.day === activeLesson.day && l.period === activeLesson.period)
                            ) && "scale-[1.02] z-40 ring-2 ring-white/50 shadow-xl"
                        )}
                        onDragOver={(e) => {
                            if (isEditMode) {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = e.altKey ? 'copy' : 'move'; // Visual feedback for copy
                                setDragOverCell?.({ [item.type === 'teacher' ? 'teacherId' : 'classId']: item.id, day, period: p });
                            }
                        }}
                        onDragLeave={() => isEditMode && setDragOverCell?.(null)}
                        onDrop={(e) => {
                            if (isEditMode) {
                                e.preventDefault();
                                e.stopPropagation();
                                let externalLesson = undefined;
                                try {
                                    const dataStr = e.dataTransfer.getData('lesson');
                                    if (dataStr) {
                                        externalLesson = JSON.parse(dataStr);
                                    }
                                } catch (err) {
                                    console.warn('Failed to parse dropped lesson data:', err);
                                }
                                onDrop?.(item.id, day, p, externalLesson, e.altKey); // Pass Alt key state
                                setDragOverCell?.(null);
                            }
                        }}
                    >
                        {hasLessons ? (
                            <div className="flex flex-col gap-1 h-full justify-center">
                                {cellLessons.map((lesson: Lesson, idx: number) => {
                                    const cls = data?.classes?.find((c: any) => c.id === lesson.class_id);
                                    const teacher = data?.teachers?.find((t: any) => t.id === lesson.teacher_id);
                                    const subject = data?.subjects?.find((s: any) => s.id === lesson.subject_id);
                                    const room = lesson.room || subject?.defaultRoom;

                                    // Selection Logic
                                    // Identify lesson uniquely via ... wait, lessons in array don't have IDs?
                                    // We are adding persistent IDs? No, we use lesson props.
                                    // Ideally, lessons should have IDs.
                                    // If no IDs, we can construct one: classId-day-period (but multiple per cell?)
                                    // For now, let's assume one lesson per slot mostly, or use a composite ID.
                                    // A unique ID for selection: `${lesson.class_id}-${lesson.day}-${lesson.period}-${lesson.subject_id}`
                                    const lessonUniqueId = `${lesson.class_id}-${lesson.day}-${lesson.period}-${lesson.subject_id}`;
                                    const isSelected = selectedLessonIds.includes(lessonUniqueId);

                                    return (
                                        <div
                                            key={idx}
                                            draggable={isEditMode}
                                            onDragStart={(e) => {
                                                if (isEditMode) {
                                                    setDraggedLesson?.(lesson);
                                                    e.dataTransfer.setData('lesson', JSON.stringify(lesson));
                                                    e.dataTransfer.effectAllowed = e.altKey ? 'copy' : 'move';
                                                }
                                            }}
                                            onDragEnd={() => {
                                                if (isEditMode) {
                                                    setDraggedLesson?.(null);
                                                    setDragOverCell?.(null);
                                                }
                                            }}
                                            onMouseEnter={() => setHoveredLesson(lesson)}
                                            onMouseLeave={() => setHoveredLesson(null)}
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent cell click
                                                onCellClick?.(item.id, day, p, lesson, e);
                                            }}
                                            onDragOver={(e) => {
                                                if (isEditMode) e.preventDefault();
                                            }}
                                            className={cn(
                                                "w-full bg-white/[0.03] hover:bg-white/[0.06] rounded-lg p-2 border-l-4 transition-all duration-300 group/card cursor-pointer shadow-sm active:scale-95 relative overflow-hidden",
                                                cellLessons.length > 1 ? "flex-1" : "h-full",
                                                isHighlighted && (isActualConflict
                                                    ? "ring-1 ring-amber-400/50 z-30 brightness-[1.1] bg-amber-500/10"
                                                    : "ring-1 ring-indigo-400/30 z-20 brightness-[1.05] bg-indigo-500/5"
                                                ),
                                                isSelected && "ring-2 ring-indigo-400 bg-indigo-500/20 z-40 brightness-125",
                                                // Specific card focus
                                                activeLesson && (lesson.teacher_id === activeLesson.teacher_id && lesson.class_id === activeLesson.class_id && lesson.day === activeLesson.day && lesson.period === activeLesson.period) &&
                                                "ring-2 ring-white/80 scale-[1.03] z-50 shadow-2xl bg-white/10"
                                            )}
                                            style={{ borderLeftColor: isMonochrome ? '#a1a1aa' : (subject ? props.getSubjectColor?.(lesson.subject_id) : '#fff') }}
                                        >
                                            <div className="text-xs font-black text-white group-hover/card:text-indigo-400 transition-colors truncate relative z-0">
                                                {item.type === 'teacher' ? cls?.name : (subject?.name || "—")}
                                            </div>
                                            <div className="flex justify-between items-end mt-2">
                                                <div className="text-[10px] font-bold text-[#a1a1aa] truncate mr-2 uppercase tracking-tighter">
                                                    {item.type === 'teacher' ? (subject?.name || "") : (teacher?.name?.split(' ')[0] || "")}
                                                </div>
                                                <div className={cn(
                                                    "text-[8px] font-black px-1.5 py-0.5 rounded transition-colors uppercase tracking-tight",
                                                    props.getRoomColor?.(room)
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
                                onClick={(e) => onCellClick?.(item.id, day, p, undefined, e)}
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
                                                {isRecommendedSlot ? "ВСТАВИТИ СЮДИ" : emptyCellLabel}
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
