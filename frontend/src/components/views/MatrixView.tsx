import { memo, useState, useMemo, useDeferredValue, useCallback } from 'react';
import { Search, Droplet, LayoutGrid, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useDataStore } from '../../store/useDataStore';
import { useScheduleStore } from '../../store/useScheduleStore';
import { useUIStore } from '../../store/useUIStore';
import { getRoomColor, getSubjectColor } from '../../utils/gridHelpers';
import { CompactMatrixSchedule } from '../CompactMatrixSchedule';
import { useHover } from '../../context/HoverContext';
import type { Lesson } from '../../types';

interface MatrixViewProps {
    draggedLesson: Lesson | null;
    setDraggedLesson: (l: Lesson | null) => void;
    dragOverCell: any;
    setDragOverCell: (c: any) => void;
    processDrop: (classId: string, day: string, period: number, externalLesson?: any) => void;
    setViewingLesson: (c: any) => void;
    setEditingCell: (c: any) => void;
}

export const MatrixView = memo(({
    draggedLesson, setDraggedLesson, dragOverCell, setDragOverCell, processDrop,
    setViewingLesson, setEditingCell
}: MatrixViewProps) => {
    const data = useDataStore(s => s.data);
    const scheduleResponse = useScheduleStore(s => s.schedule);
    const lessons = (scheduleResponse?.status === 'success' || scheduleResponse?.status === 'conflict') ? scheduleResponse.schedule : [];

    const isCompact = useUIStore(s => s.isCompact);
    const setIsCompact = useUIStore(s => s.setIsCompact);
    const isEditMode = useUIStore(s => s.isEditMode);
    const perfSettings = useUIStore(s => s.perfSettings);
    const isMonochrome = useUIStore(s => s.isMonochrome);
    const setIsMonochrome = useUIStore(s => s.setIsMonochrome);
    const userRole = useUIStore(s => s.userRole);
    const selectedTeacherId = useUIStore(s => s.selectedTeacherId);


    const [day, setDay] = useState<string>('Mon');
    const [activeGradeGroup, setActiveGradeGroup] = useState<'1-4' | '5-9' | '10-11'>('5-9');
    const [searchQuery, setSearchQuery] = useState('');
    const [showIcons, setShowIcons] = useState(true);
    const deferredSearchQuery = useDeferredValue(searchQuery);

    const { setHoveredLesson } = useHover();

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
        if (activeGradeGroup === '1-4') classes = classes.filter(c => parseInt(c.name) <= 4);
        else if (activeGradeGroup === '5-9') classes = classes.filter(c => parseInt(c.name) >= 5 && parseInt(c.name) <= 9);
        else if (activeGradeGroup === '10-11') classes = classes.filter(c => parseInt(c.name) >= 10);

        if (deferredSearchQuery) {
            classes = classes.filter(c => c.name.toLowerCase().includes(deferredSearchQuery.toLowerCase()));
        }
        return classes;
    }, [sortedClasses, activeGradeGroup, deferredSearchQuery]);

    const dayName = days[apiDays.indexOf(day)];

    return (
        <div className={cn("animate-in fade-in duration-300 h-full flex flex-col overflow-hidden", isCompact ? "space-y-1" : "space-y-3 lg:space-y-4")}>
            {/* Header controls */}
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
                    <div className="flex items-center gap-2 bg-[#18181b]/50 backdrop-blur-md rounded-xl border border-white/5 p-1 px-3 shadow-xl">
                        <Search size={14} className="text-white/20" />
                        <input
                            type="text"
                            placeholder="ПОШУК КЛАСУ..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-xs font-bold text-white placeholder-white/20 w-32 outline-none"
                        />
                    </div>

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

                    <div className="flex bg-[#18181b] p-1 rounded-xl border border-white/5">
                        <button onClick={() => setActiveGradeGroup('1-4')} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black transition-all", activeGradeGroup === '1-4' ? "bg-white/10 text-white" : "text-[#a1a1aa] hover:text-white")}>1-4</button>
                        <button onClick={() => setActiveGradeGroup('5-9')} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black transition-all", activeGradeGroup === '5-9' ? "bg-white/10 text-white" : "text-[#a1a1aa] hover:text-white")}>5-9</button>
                        <button onClick={() => setActiveGradeGroup('10-11')} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black transition-all", activeGradeGroup === '10-11' ? "bg-white/10 text-white" : "text-[#a1a1aa] hover:text-white")}>10-11</button>
                    </div>

                    <div className="flex bg-[#18181b] p-1 rounded-xl border border-white/5">
                        <button
                            onClick={() => setIsMonochrome(!isMonochrome)}
                            className={cn(
                                "flex items-center gap-2 rounded-lg text-[10px] font-black transition-all whitespace-nowrap justify-center p-2",
                                isMonochrome ? "text-[#a1a1aa] hover:text-white" : "bg-amber-600 text-white shadow-lg shadow-amber-500/20"
                            )}
                            title="Колір"
                        >
                            <Droplet size={14} />
                        </button>
                        <button
                            onClick={() => setIsCompact(!isCompact)}
                            className={cn(
                                "flex items-center gap-2 rounded-lg text-[10px] font-black transition-all whitespace-nowrap justify-center p-2",
                                isCompact ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-[#a1a1aa] hover:text-white"
                            )}
                            title="Компактний режим"
                        >
                            <LayoutGrid size={14} />
                        </button>
                        <button
                            onClick={() => setShowIcons(!showIcons)}
                            className={cn(
                                "flex items-center gap-2 rounded-lg text-[10px] font-black transition-all whitespace-nowrap justify-center p-2",
                                showIcons ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "text-[#a1a1aa] hover:text-white"
                            )}
                            title="Іконки предметів"
                        >
                            {showIcons ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                    </div>
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
                    onCellClick={(classId, d, period, lesson) => {
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
                <div className="bento-card border-white/5 overflow-hidden flex-1 flex flex-col">
                    <div className="overflow-auto flex-1 custom-scrollbar">
                        <table className="w-full border-collapse text-left table-fixed relative">
                            <thead>
                                <tr>
                                    <th className="sticky top-0 left-0 z-20 w-[60px] bg-[#18181b] p-3 text-center text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest border-b border-r border-white/5">ЧАС</th>
                                    {filteredClasses.map(cls => (
                                        <th key={cls.id} className="sticky top-0 z-10 min-w-[120px] bg-[#18181b] p-3 text-left text-[10px] font-black text-white uppercase tracking-widest border-b border-white/5 border-r last:border-r-0">
                                            {cls.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {periods.map(p => (
                                    <tr key={p} className="border-b border-white/5 last:border-b-0">
                                        <th className="sticky left-0 z-10 w-[60px] bg-[#18181b] p-3 text-center text-[10px] font-black text-[#a1a1aa] border-r border-white/5">
                                            {p}
                                        </th>
                                        {filteredClasses.map(cls => {
                                            const lesson = findLesson(cls.id, day, p);
                                            const room = lesson?.room || data.subjects.find(s => s.id === lesson?.subject_id)?.defaultRoom;

                                            // TODO: Add conflict checks visual logic if needed here, consistent with other views

                                            return (
                                                <td
                                                    key={cls.id}
                                                    className={cn(
                                                        "p-1 h-[80px] border-r border-white/5 last:border-r-0 min-w-[120px] relative transition-colors",
                                                        !lesson && "hover:bg-white/[0.02]"
                                                    )}
                                                    onDragOver={(e) => {
                                                        if (isEditMode) {
                                                            e.preventDefault();
                                                            e.dataTransfer.dropEffect = 'move';
                                                            setDragOverCell({ classId: cls.id, day, period: p });
                                                        }
                                                    }}
                                                    onDragLeave={() => isEditMode && setDragOverCell(null)}
                                                    onDrop={(e) => {
                                                        if (isEditMode) {
                                                            e.preventDefault();
                                                            const dataStr = e.dataTransfer.getData('lesson');
                                                            const externalLesson = dataStr ? JSON.parse(dataStr) : undefined;
                                                            processDrop(cls.id, day, p, externalLesson);
                                                        }
                                                    }}
                                                >
                                                    {lesson ? (
                                                        <div
                                                            className="h-full w-full rounded bg-white/[0.05] p-2 flex flex-col justify-between border-l-2 cursor-pointer hover:bg-white/[0.1] transition-colors group"
                                                            style={{
                                                                borderLeftColor: isMonochrome ? '#a1a1aa' : filledGetSubjectColor(lesson.subject_id),
                                                                backgroundColor: isMonochrome ? 'rgba(255,255,255,0.05)' : undefined
                                                            }}
                                                            onClick={() => isEditMode ? setEditingCell({ classId: cls.id, day, period: p }) : setViewingLesson({ classId: cls.id, day, period: p })}
                                                            draggable={isEditMode}
                                                            onDragStart={(e) => {
                                                                if (isEditMode) {
                                                                    setDraggedLesson(lesson);
                                                                    e.dataTransfer.setData('lesson', JSON.stringify(lesson));
                                                                    e.dataTransfer.effectAllowed = 'move';
                                                                }
                                                            }}
                                                            onMouseEnter={() => setHoveredLesson(lesson)}
                                                            onMouseLeave={() => setHoveredLesson(null)}
                                                        >
                                                            <div className="text-[10px] font-bold text-white leading-tight line-clamp-2">
                                                                {data.subjects.find(s => s.id === lesson.subject_id)?.name}
                                                            </div>
                                                            <div className="flex justify-between items-end mt-1">
                                                                <div className="text-[8px] font-black text-[#a1a1aa] truncate max-w-[60%]">
                                                                    {data.teachers.find(t => t.id === lesson.teacher_id)?.name.split(' ')[0]}
                                                                </div>
                                                                <div className={cn("text-[8px] font-black px-1 rounded", getRoomColor(room))}>
                                                                    {room || '—'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        isEditMode && (
                                                            <div
                                                                className="h-full w-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer group"
                                                                onClick={() => setEditingCell({ classId: cls.id, day, period: p })}
                                                            >
                                                                <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-white group-hover:bg-white/10">
                                                                    +
                                                                </div>
                                                            </div>
                                                        )
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
            )}
        </div>
    );
});
