import { LayoutDashboard, Columns, Table, Users, RefreshCw, RotateCcw, Lock, Unlock, Layers, CalendarClock } from 'lucide-react';
import { cn } from '../utils/cn';
import { WeekSwitcher } from './WeekSwitcher';
import { useUIStore } from '../store/useUIStore';
import { useDataStore } from '../store/useDataStore';
import { useScheduleStore } from '../store/useScheduleStore';
import { exportMasterTeacherSchedule } from '../utils/excelExport';
import { getWeekId } from '../utils/scheduleHelpers';
import type { ViewType } from '../types';
import { ViewOptionsDropdown } from './ViewOptionsDropdown';
import { ExportDropdown } from './ExportDropdown';

export const ScheduleToolbar = () => {
    // UI Store
    const {
        viewType, setViewType,
        isCompact,
        activeTab,
        isEditMode, setIsEditMode,
        scheduleEditScope, setScheduleEditScope,
        userRole
    } = useUIStore();

    // Data Store
    const { data } = useDataStore();

    const effectiveIsCompact = isCompact && (viewType === 'matrix' || viewType === 'teachers');

    // Schedule Store - get both histories and current scope
    const {
        schedule,
        templateHistory,
        weekHistory,
        undo,
        selectedDate,
        resetWeekToTemplate
    } = useScheduleStore();

    // Select correct history based on edit scope
    const currentHistory = scheduleEditScope === 'template' ? templateHistory : weekHistory;
    const historyLength = currentHistory.past.length;

    const isBaseTemplate = !useScheduleStore.getState().weeklySchedules[getWeekId(new Date(selectedDate))];
    const lessons = (schedule?.status === 'success' || schedule?.status === 'conflict') ? schedule.schedule : [];
    const { teachers, subjects, classes } = data;


    if (activeTab !== 'schedule' || viewType === 'dashboard') return null;

    return (
        <div className="flex flex-col gap-4 mb-4 animate-in fade-in slide-in-from-top-4 duration-500 z-[100] relative">

            {/* Main Toolbar Container */}
            <div className="flex flex-nowrap items-center justify-between gap-1 p-1 bg-[#18181b]/50 backdrop-blur-md border border-white/5 rounded-2xl shadow-sm">

                {/* Left Group: Date & View Switches (Pinned) */}
                <div className="flex items-center gap-2 shrink-0">
                    <WeekSwitcher compact={effectiveIsCompact} />

                    {/* View Toggles */}
                    <div className="flex items-center gap-1 bg-[#18181b] p-0.5 rounded-xl border border-white/5 overflow-hidden shadow-inner shadow-black/20">
                        {[
                            { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
                            { id: 'byClass', label: 'По класах', icon: Columns },
                            { id: 'matrix', label: 'Загальний', icon: Table },
                            { id: 'teachers', label: 'Вчителі', icon: Users },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setViewType(tab.id as ViewType);
                                    if (tab.id === 'dashboard') {
                                        useScheduleStore.getState().setCurrentDate(new Date());
                                    }
                                }}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-lg font-bold transition-all relative shrink-0",
                                    "px-2 py-1.5 text-[10px] min-[1300px]:px-4 min-[1300px]:text-xs",
                                    viewType === tab.id
                                        ? "text-white bg-indigo-500/10 shadow-sm shadow-indigo-500/5 ring-1 ring-indigo-500/20"
                                        : "text-[#a1a1aa] hover:text-white hover:bg-white/5"
                                )}
                                title={tab.label}
                            >
                                <tab.icon size={14} className={cn("shrink-0", viewType === tab.id && "text-indigo-400")} />
                                <span className={cn(
                                    "hidden transition-all duration-300",
                                    viewType === tab.id ? "min-[1100px]:inline" : "min-[1500px]:inline"
                                )}>
                                    {tab.label}
                                </span>
                                {viewType === tab.id && (
                                    <div className="absolute inset-x-0 -bottom-[1px] h-[2px] bg-indigo-500 rounded-full mx-2 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Filters & Settings + Edit Mode Controls */}
                <div className="flex items-center gap-1 min-[1100px]:gap-2 shrink-0 pr-0.5">


                    {/* Edit Controls Group (Only in Schedule View) */}
                    <div className="flex items-center gap-1 min-[1100px]:gap-2">

                        {/* Export Dropdown (Admin & Teachers View Only, Hidden in Edit Mode) */}
                        {schedule && userRole === 'admin' && viewType === 'teachers' && !isEditMode && (
                            <ExportDropdown
                                teachers={teachers}
                                lessons={lessons}
                                subjects={subjects}
                                classes={classes}
                                exportFunction={exportMasterTeacherSchedule}
                            />
                        )}

                        {/* Scope Selector (Appears to the LEFT of Edit Toggle) */}
                        {isEditMode && schedule && (
                            <div className={cn(
                                "flex items-center gap-1 bg-[#18181b] rounded-xl border border-white/5 transition-all animate-in fade-in slide-in-from-right-4 duration-500 h-9 min-[1100px]:h-10 p-1 shrink-0",
                            )}>
                                <button
                                    onClick={() => setScheduleEditScope('template')}
                                    className={cn(
                                        "flex items-center gap-1.5 rounded-lg font-bold transition-all text-[10px] group relative h-full",
                                        "px-2",
                                        scheduleEditScope === 'template'
                                            ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                                            : "text-[#a1a1aa] hover:text-white hover:bg-white/5"
                                    )}
                                    title="Редагувати шаблон - зміни застосуються до всіх тижнів"
                                >
                                    <Layers size={14} />
                                    <span className="hidden min-[1450px]:inline">ШАБЛОН</span>
                                </button>
                                <button
                                    onClick={() => setScheduleEditScope('week')}
                                    className={cn(
                                        "flex items-center gap-1.5 rounded-lg font-bold transition-all text-[10px] group relative h-full",
                                        "px-2",
                                        scheduleEditScope === 'week'
                                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                            : "text-[#a1a1aa] hover:text-white hover:bg-white/5"
                                    )}
                                    title="Редагувати тиждень - зміни тільки для поточного тижня"
                                >
                                    <CalendarClock size={14} />
                                    <span className="hidden min-[1450px]:inline">ТИЖДЕНЬ</span>
                                </button>

                                {/* Separator */}
                                <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

                                {/* Reset Week Button */}
                                {!isBaseTemplate && (
                                    <button
                                        onClick={() => resetWeekToTemplate()}
                                        className={cn(
                                            "flex items-center gap-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-all active:scale-95 group h-full px-2",
                                        )}
                                        title="Скинути зміни цього тижня"
                                    >
                                        <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                                    </button>
                                )}

                                {/* Undo Button */}
                                <button
                                    onClick={undo}
                                    disabled={historyLength === 0}
                                    className={cn(
                                        "flex items-center gap-2 rounded-lg text-[#a1a1aa] hover:text-white transition-all disabled:opacity-20 active:scale-95 group h-full px-2",
                                    )}
                                    title="Скасувати останню дію"
                                >
                                    <RotateCcw size={14} className="group-hover:-rotate-45 transition-transform" />
                                    {historyLength > 0 && <span className="font-bold text-xs">{historyLength}</span>}
                                </button>
                            </div>
                        )}

                        {/* Edit Mode Toggle (Pinned to the right of Scope) */}
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={cn(
                                "flex items-center gap-2 rounded-xl font-bold transition-all duration-300 h-9 min-[1100px]:h-10 border shrink-0",
                                effectiveIsCompact
                                    ? "px-2 text-[10px]"
                                    : "px-2 min-[1100px]:px-4 text-[10px] min-[1100px]:text-xs",
                                isEditMode
                                    ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/30"
                                    : "bg-[#18181b] border-white/5 text-[#a1a1aa] hover:text-white hover:bg-white/5"
                            )}
                            title={isEditMode ? "Вимкнути режим РЕДАГУВАННЯ" : "Увімкнути режим редагування"}
                        >
                            {isEditMode ? (
                                <>
                                    <Unlock size={16} className="animate-pulse" />
                                    <span className="hidden min-[1150px]:inline">{effectiveIsCompact ? 'РЕД.' : 'РЕДАГУВАННЯ'}</span>
                                </>
                            ) : (
                                <>
                                    <Lock size={16} />
                                    <span className="hidden min-[1150px]:inline">{effectiveIsCompact ? 'РЕД.' : 'РЕДАГУВАННЯ'}</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="w-[1px] h-6 bg-white/10 mx-1" />

                    {/* Settings Dropdown */}
                    <ViewOptionsDropdown />
                </div>
            </div>
        </div>
    );
};
