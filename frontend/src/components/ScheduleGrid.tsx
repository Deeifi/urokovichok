import { useCallback, useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ScheduleRequest, ScheduleResponse, Lesson, PerformanceSettings } from '../types';
import {
    X, Check, Trash2, LayoutDashboard, Columns, Table as TableIcon, Users,
    Lock, Unlock, AlertTriangle, Pencil, Info, ArrowRightLeft, Copy
} from 'lucide-react';
import { useUIStore } from '../store/useUIStore';
import { cn } from '../utils/cn';
import { MatrixView } from './views/MatrixView';
import { TeachersView } from './views/TeachersView';
import { DashboardView } from './views/DashboardView';
import { ByClassView } from './views/ByClassView';
import { useConflicts } from '../hooks/useConflicts';
import { useScheduleOperations } from '../hooks/useScheduleOperations';
import { useTimeInfo } from '../hooks/useTimeInfo';
import { API_DAYS, DAYS, PERIODS } from '../constants';
import { getSubjectColor, getRoomColor } from '../utils/gridHelpers';
import { ConfirmationModal } from './ConfirmationModal';
import { ErrorBoundary } from './ErrorBoundary';
import { BulkActionsToolbar } from './BulkActionsToolbar';



interface ScheduleGridProps {
    data: ScheduleRequest;
    schedule: ScheduleResponse;
    onScheduleChange: (newSchedule: ScheduleResponse) => void;
    isEditMode: boolean;
    setIsEditMode: (val: boolean) => void;
    isCompact: boolean;

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


// --- Main ScheduleGrid Component ---

export function ScheduleGrid({
    data, schedule, onScheduleChange, isEditMode, setIsEditMode, isCompact, viewType, setViewType, perfSettings,
    userRole, selectedTeacherId, isHeaderCollapsed, setIsHeaderCollapsed
}: ScheduleGridProps) {
    const [selectedClassId, setSelectedClassId] = useState<string>(data.classes[0]?.id || '');
    const [editingCell, setEditingCell] = useState<{ classId: string, day: string, period: number } | null>(null);
    const [editingTeacherCell, setEditingTeacherCell] = useState<{ teacherId: string, day: string, period: number } | null>(null);
    const [viewingLesson, setViewingLesson] = useState<{ classId: string, day: string, period: number } | null>(null);

    // --- Logic & Operations Hooks ---
    const { getTeacherConflicts, getClassConflicts } = useConflicts();
    const { now, timeInfo } = useTimeInfo(perfSettings.lowFrequencyClock);
    const {
        draggedLesson, setDraggedLesson,
        dragOverCell, setDragOverCell,
        dragConfirm, setDragConfirm,
        handleSaveLesson,
        executeDragAction,
        processDrop,
        processTeacherDrop,
        deleteLessons,
        assignTeacherToLessons,
        assignRoomToLessons,
        changeSubjectForLessons,
        toggleDoubleLessons,
        shiftLessons,
        cloneLessonsToDay
    } = useScheduleOperations(schedule, onScheduleChange);


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
    const [isExporting, setIsExporting] = useState(false);
    const sortedClasses = useMemo(() =>
        ([...data.classes].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))),
        [data.classes]
    );
    const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

    // Extended Bulk Action States
    const [showBulkRoomModal, setShowBulkRoomModal] = useState(false);
    const [bulkRoomValue, setBulkRoomValue] = useState('');

    const [showBulkSubjectModal, setShowBulkSubjectModal] = useState(false);

    const [showBulkCloneModal, setShowBulkCloneModal] = useState(false);

    // Central Escape Handler for ScheduleGrid Modals
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (showBulkAssignModal) setShowBulkAssignModal(false);
                if (showBulkDeleteConfirm) setShowBulkDeleteConfirm(false);
                if (showBulkRoomModal) setShowBulkRoomModal(false);
                if (showBulkSubjectModal) setShowBulkSubjectModal(false);
                if (showBulkCloneModal) setShowBulkCloneModal(false);
                if (editingCell) setEditingCell(null);
                if (viewingLesson) setViewingLesson(null);
                if (editingTeacherCell) setEditingTeacherCell(null);
                if (dragConfirm) setDragConfirm(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        showBulkAssignModal, showBulkDeleteConfirm, showBulkRoomModal,
        showBulkSubjectModal, showBulkCloneModal, editingCell,
        viewingLesson, editingTeacherCell, dragConfirm
    ]);

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            const { default: jsPDF } = await import('jspdf');
            const { default: html2canvas } = await import('html2canvas');

            const element = document.getElementById('class-schedule-export');
            if (!element) return;

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#0f0f12',
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: canvas.width > canvas.height ? 'l' : 'p',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            const className = data.classes.find(c => c.id === selectedClassId)?.name || 'класу';
            pdf.save(`Розклад_${className}.pdf`);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
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
                className={cn("flex-1 min-h-0", (viewType === 'teachers' || viewType === 'matrix') ? "overflow-hidden flex flex-col" : "overflow-y-auto custom-scrollbar")}
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
                    <ErrorBoundary>
                        <DashboardView
                            data={data}
                            selectedClassId={selectedClassId}
                            setSelectedClassId={setSelectedClassId}
                            timeInfo={timeInfo}
                            now={now}
                            findLesson={findLesson}
                            periods={PERIODS}
                            getRoomColor={getRoomColor}
                            sortedClasses={sortedClasses}
                            perfSettings={perfSettings}
                            userRole={userRole}
                            selectedTeacherId={selectedTeacherId}
                            lessons={lessons}
                        />
                    </ErrorBoundary>
                ) : viewType === 'byClass' ? (
                    <ErrorBoundary>
                        <ByClassView
                            data={data}
                            selectedClassId={selectedClassId}
                            setSelectedClassId={setSelectedClassId}
                            isCompact={false}
                            isEditMode={userRole === 'admin' ? isEditMode : false}
                            perfSettings={perfSettings}
                            userRole={userRole}
                            selectedTeacherId={selectedTeacherId}
                            lessons={lessons}
                            apiDays={API_DAYS}
                            days={DAYS}
                            periods={PERIODS}
                            getTeacherConflicts={getTeacherConflicts}
                            getClassConflicts={getClassConflicts}
                            draggedLesson={draggedLesson}
                            setDraggedLesson={setDraggedLesson}
                            dragOverCell={dragOverCell}
                            setDragOverCell={setDragOverCell}
                            processDrop={processDrop}
                            setEditingCell={setEditingCell}
                            setViewingLesson={setViewingLesson}
                            handleExportPDF={handleExportPDF}
                            isExporting={isExporting}
                        />
                    </ErrorBoundary>

                ) : viewType === 'matrix' ? (
                    <ErrorBoundary>
                        <MatrixView
                            lessons={lessons}
                            draggedLesson={draggedLesson}
                            setDraggedLesson={setDraggedLesson}
                            dragOverCell={dragOverCell}
                            setDragOverCell={setDragOverCell}
                            processDrop={processDrop}
                            setViewingLesson={setViewingLesson}
                            setEditingCell={setEditingCell}
                        />
                    </ErrorBoundary>
                ) : (
                    <ErrorBoundary>
                        <TeachersView
                            lessons={lessons}
                            draggedLesson={draggedLesson}
                            setDraggedLesson={setDraggedLesson}
                            dragOverCell={dragOverCell}
                            setDragOverCell={setDragOverCell}
                            processTeacherDrop={processTeacherDrop}
                            setViewingLesson={setViewingLesson}
                            setEditingTeacherCell={setEditingTeacherCell}
                        />
                    </ErrorBoundary>
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
                    onSave={(cid, d, p, sid, tid, r) => {
                        handleSaveLesson(cid, d, p, sid, tid, r);
                        setEditingCell(null);
                    }}
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
                                {dragConfirm.conflicts.length > 0 ? <AlertTriangle size={24} /> : (dragConfirm.type === 'copy' ? <Copy size={24} /> : <ArrowRightLeft size={24} />)}
                            </div>
                            <div>
                                <h4 className="font-black text-white text-lg">{dragConfirm.conflicts.length > 0 ? "Увага, конфлікт!" : (dragConfirm.type === 'copy' ? "Дублювання уроку" : "Підтвердіть дію")}</h4>
                                <p className="text-sm text-[#a1a1aa]">
                                    {dragConfirm.type === 'swap' ? 'Ви хочете поміняти уроки місцями?' : (dragConfirm.type === 'copy' ? 'Ви хочете створити копію цього уроку?' : 'Ви хочете перенести урок?')}
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
                                {dragConfirm.conflicts.length > 0 ? "Все одно виконати" : (dragConfirm.type === 'copy' ? "Так, дублювати" : "Так, виконати")}
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

            <BulkActionsToolbar
                onDelete={() => setShowBulkDeleteConfirm(true)}
                onAssignTeacher={() => setShowBulkAssignModal(true)}
                onAssignRoom={() => setShowBulkRoomModal(true)}
                onChangeSubject={() => setShowBulkSubjectModal(true)}
                onToggleDouble={(ids) => {
                    const { clearSelection } = useUIStore.getState();
                    toggleDoubleLessons(ids);
                    clearSelection();
                }}
                onShift={(ids, dir) => {
                    shiftLessons(ids, dir);
                }}
                onClone={() => setShowBulkCloneModal(true)}
            />

            {showBulkAssignModal && createPortal(
                <BulkAssignModal
                    teachers={data.teachers}
                    onConfirm={(teacherId) => {
                        const { selectedLessonIds, clearSelection } = useUIStore.getState();
                        assignTeacherToLessons(selectedLessonIds, teacherId);
                        clearSelection();
                        setShowBulkAssignModal(false);
                    }}
                    onClose={() => setShowBulkAssignModal(false)}
                />,
                document.body
            )}

            {showBulkRoomModal && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setShowBulkRoomModal(false)}>
                    <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white">Призначити кабінет</h3>
                        <p className="text-sm text-[#a1a1aa]">Введіть номер кабінету (або залиште пустим щоб очистити):</p>
                        <input
                            type="text"
                            value={bulkRoomValue}
                            onChange={(e) => setBulkRoomValue(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="Напр. 101"
                            autoFocus
                        />
                        <div className="flex gap-2 justify-end pt-2">
                            <button onClick={() => setShowBulkRoomModal(false)} className="px-4 py-2 rounded-xl text-white hover:bg-white/10 transition-colors">Скасувати</button>
                            <button onClick={() => {
                                const { selectedLessonIds, clearSelection } = useUIStore.getState();
                                assignRoomToLessons(selectedLessonIds, bulkRoomValue);
                                clearSelection();
                                setShowBulkRoomModal(false);
                                setBulkRoomValue('');
                            }} className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors">Зберегти</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {showBulkSubjectModal && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setShowBulkSubjectModal(false)}>
                    <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white">Змінити предмет</h3>
                        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                            {data.subjects.map(sub => (
                                <button
                                    key={sub.id}
                                    onClick={() => {
                                        const { selectedLessonIds, clearSelection } = useUIStore.getState();
                                        changeSubjectForLessons(selectedLessonIds, sub.id);
                                        clearSelection();
                                        setShowBulkSubjectModal(false);
                                    }}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-left group w-full"
                                >
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold shadow-sm" style={{ backgroundColor: getSubjectColor(sub.id, data.subjects) + '30', color: getSubjectColor(sub.id, data.subjects) }}>
                                        {sub.name[0]}
                                    </div>
                                    <span className="font-medium text-gray-200 group-hover:text-white">{sub.name}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2 justify-end pt-2">
                            <button onClick={() => setShowBulkSubjectModal(false)} className="px-4 py-2 rounded-xl text-white hover:bg-white/10 transition-colors">Скасувати</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {showBulkCloneModal && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setShowBulkCloneModal(false)}>
                    <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white">Клонувати уроки</h3>
                        <p className="text-sm text-[#a1a1aa]">Оберіть день, на який скопіювати обрані уроки:</p>
                        <div className="grid grid-cols-2 gap-2">
                            {API_DAYS.map((day, i) => (
                                <button
                                    key={day}
                                    onClick={() => {
                                        const { selectedLessonIds, clearSelection } = useUIStore.getState();
                                        cloneLessonsToDay(selectedLessonIds, day);
                                        clearSelection();
                                        setShowBulkCloneModal(false);
                                    }}
                                    className="p-3 rounded-xl bg-white/5 hover:bg-indigo-600 hover:text-white transition-all text-center border border-white/5 hover:border-indigo-400 font-medium"
                                >
                                    {DAYS[i]}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2 justify-end pt-2">
                            <button onClick={() => setShowBulkCloneModal(false)} className="px-4 py-2 rounded-xl text-white hover:bg-white/10 transition-colors">Скасувати</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <ConfirmationModal
                isOpen={showBulkDeleteConfirm}
                onClose={() => setShowBulkDeleteConfirm(false)}
                onConfirm={() => {
                    const { selectedLessonIds, clearSelection } = useUIStore.getState();
                    deleteLessons(selectedLessonIds);
                    clearSelection();
                    setShowBulkDeleteConfirm(false);
                }}
                title="Видалити обрані уроки?"
                description={`Ви впевнені, що хочете видалити обрані уроки (${useUIStore.getState().selectedLessonIds.length})? Цю дію не можна скасувати.`}
            />
        </div>
    );
}

// --- Bulk Assign Modal ---
interface BulkAssignModalProps {
    teachers: import('../types').Teacher[];
    onConfirm: (teacherId: string) => void;
    onClose: () => void;
}

function BulkAssignModal({ teachers, onConfirm, onClose }: BulkAssignModalProps) {
    const [teacherId, setTeacherId] = useState('');
    const sortedTeachers = [...teachers].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-[#18181b] w-full max-w-sm rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <h3 className="text-lg font-black text-white">Призначити вчителя</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-[#a1a1aa] hover:text-white">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">Оберіть вчителя</label>
                        <select
                            value={teacherId}
                            onChange={e => setTeacherId(e.target.value)}
                            className="w-full bg-[#09090b] border border-white/10 rounded-xl px-4 py-3 font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                        >
                            <option value="">-- Оберіть вчителя --</option>
                            {sortedTeachers.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={() => onConfirm(teacherId)}
                        disabled={!teacherId}
                        className="w-full py-3 rounded-xl font-black text-white bg-indigo-500 hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                    >
                        Призначити
                    </button>
                </div>
            </div>
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

