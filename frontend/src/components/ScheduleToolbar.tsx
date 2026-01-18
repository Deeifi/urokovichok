import { useMemo } from 'react';
import { LayoutDashboard, Columns, Table, Users, Search, RefreshCw, RotateCcw, Lock, Unlock, Layers, CalendarClock } from 'lucide-react';
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
        searchQuery, setSearchQuery
    } = useUIStore();

    // Data Store
    const { data } = useDataStore();

    const effectiveIsCompact = isCompact && (viewType === 'matrix' || viewType === 'teachers');

    // Schedule Store
    const { schedule, history, undo, selectedDate, resetWeekToTemplate } = useScheduleStore();
    const historyLength = history.past.length;

    // UI Store Actions
    const {
        isEditMode, setIsEditMode,
        scheduleEditScope, setScheduleEditScope,
        userRole
    } = useUIStore();

    const isBaseTemplate = !useScheduleStore.getState().weeklySchedules[getWeekId(new Date(selectedDate))];
    const lessons = (schedule?.status === 'success' || schedule?.status === 'conflict') ? schedule.schedule : [];
    const { teachers, subjects, classes } = data;

    // Calculate filtered counts
    const filteredCount = useMemo(() => {
        if (viewType === 'teachers') {
            let list = data.teachers || [];
            if (activeTab === 'schedule' && searchQuery) {
                list = list.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
            }
            return list.length;
        }
        return 0;
    }, [viewType, data.teachers, searchQuery, activeTab]);

    const totalCount = viewType === 'teachers' ? (data.teachers?.length || 0) : 0;

    if (activeTab !== 'schedule') return null;

    return (
        <div className="flex flex-col gap-4 mb-4 animate-in fade-in slide-in-from-top-4 duration-500 z-[100] relative">

            {/* Main Toolbar Container */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-[#18181b]/50 backdrop-blur-md border border-white/5 rounded-2xl shadow-sm">

                {/* Left: Week Switcher */}
                <div className="w-fit">
                    <WeekSwitcher compact={effectiveIsCompact} />
                </div>

                {/* Center: View Toggles */}
                <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-xl border border-white/5 overflow-hidden">
                    {[
                        { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
                        { id: 'byClass', label: 'По класах', icon: Columns },
                        { id: 'matrix', label: 'Загальний', icon: Table },
                        { id: 'teachers', label: 'Вчителі', icon: Users },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setViewType(tab.id as ViewType)}
                            className={cn(
                                "flex items-center gap-2 rounded-lg font-bold transition-all relative",
                                effectiveIsCompact ? "px-3 py-1.5 text-[10px]" : "px-4 py-2 text-xs",
                                viewType === tab.id
                                    ? "text-white bg-white/10 shadow-sm"
                                    : "text-[#a1a1aa] hover:text-white hover:bg-white/5"
                            )}
                        >
                            <tab.icon size={effectiveIsCompact ? 14 : 16} className={cn(viewType === tab.id && "text-indigo-400")} />
                            <span>{tab.label}</span>
                            {viewType === tab.id && (
                                <div className="absolute inset-x-0 -bottom-[1px] h-[2px] bg-indigo-500 rounded-full mx-2" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Right: Filters & Settings + Edit Mode Controls */}
                <div className="flex items-center gap-2 ml-auto">

                    {/* Edit Controls Group (Only in Schedule View) */}
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 mr-2">

                        {/* Export Dropdown (Admin & Teachers View Only) */}
                        {schedule && userRole === 'admin' && viewType === 'teachers' && (
                            <ExportDropdown
                                teachers={teachers}
                                lessons={lessons}
                                subjects={subjects}
                                classes={classes}
                                exportFunction={exportMasterTeacherSchedule}
                                compact={effectiveIsCompact}
                            />
                        )}



                        {/* Edit Mode Toggle */}
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={cn(
                                "flex items-center gap-2 rounded-xl font-bold transition-all duration-300 h-10 border",
                                effectiveIsCompact ? "px-3 text-[10px]" : "px-4 text-xs",
                                isEditMode
                                    ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/30"
                                    : "bg-[#18181b] border-white/5 text-[#a1a1aa] hover:text-white hover:bg-white/5"
                            )}
                            title={isEditMode ? "Вимкнути режим РЕДАГУВАННЯ" : "Увімкнути режим редагування"}
                        >
                            {isEditMode ? (
                                <>
                                    <Unlock size={16} className="animate-pulse" />
                                    <span>{effectiveIsCompact ? 'РЕДАГУВАННЯ' : 'РЕДАГУВАННЯ'}</span>
                                </>
                            ) : (
                                <>
                                    <Lock size={16} />
                                    <span>{effectiveIsCompact ? 'РЕДАГУВАННЯ' : 'РЕДАГУВАННЯ'}</span>
                                </>
                            )}
                        </button>

                        {/* Scope Selector */}
                        {isEditMode && schedule && (
                            <div className={cn(
                                "flex items-center gap-1 bg-[#18181b] rounded-xl border border-white/5 transition-all animate-in fade-in slide-in-from-left-4 duration-500 ml-1 h-10 p-1",
                            )}>
                                <button
                                    onClick={() => setScheduleEditScope('template')}
                                    className={cn(
                                        "flex items-center gap-1.5 rounded-lg font-bold transition-all text-[10px] group relative h-full px-2",
                                        scheduleEditScope === 'template'
                                            ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                                            : "text-[#a1a1aa] hover:text-white hover:bg-white/5"
                                    )}
                                    title="Редагувати шаблон - зміни застосуються до всіх тижнів"
                                >
                                    <Layers size={14} />
                                    {!effectiveIsCompact && <span>ШАБЛОН</span>}
                                </button>
                                <button
                                    onClick={() => setScheduleEditScope('week')}
                                    className={cn(
                                        "flex items-center gap-1.5 rounded-lg font-bold transition-all text-[10px] group relative h-full px-2",
                                        scheduleEditScope === 'week'
                                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                            : "text-[#a1a1aa] hover:text-white hover:bg-white/5"
                                    )}
                                    title="Редагувати тиждень - зміни тільки для поточного тижня"
                                >
                                    <CalendarClock size={14} />
                                    {!effectiveIsCompact && <span>ТИЖДЕНЬ</span>}
                                </button>

                                {/* Separator */}
                                <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

                                {/* Reset Week Button */}
                                {!isBaseTemplate && (
                                    <button
                                        onClick={() => resetWeekToTemplate()}
                                        className={cn(
                                            "flex items-center gap-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-all active:scale-95 group h-full px-2.5",
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
                                        "flex items-center gap-2 rounded-lg text-[#a1a1aa] hover:text-white transition-all disabled:opacity-20 active:scale-95 group h-full px-2.5",
                                    )}
                                    title="Скасувати останню дію"
                                >
                                    <RotateCcw size={14} className="group-hover:-rotate-45 transition-transform" />
                                    {historyLength > 0 && <span className="font-bold text-xs">{historyLength}</span>}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="w-[1px] h-6 bg-white/10 mx-1" />

                    {/* Search Input (Only for Matrix/Teachers) */}
                    {(viewType === 'matrix' || viewType === 'teachers') && (
                        <div className="flex items-center gap-2 bg-[#18181b] rounded-xl border border-white/5 px-3 h-10 transition-all group focus-within:border-indigo-500/50 focus-within:shadow-lg focus-within:shadow-indigo-500/10">
                            <Search size={14} className="text-[#a1a1aa] group-focus-within:text-indigo-400 transition-colors" />
                            <input
                                type="text"
                                placeholder={viewType === 'teachers' ? "Пошук вчителя..." : "Пошук класу..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-xs font-bold text-white placeholder-[#a1a1aa] w-32 focus:w-48 transition-all outline-none uppercase tracking-wide"
                            />

                            {/* Counter Badge inside Search */}
                            {viewType === 'teachers' && (
                                <div className="flex items-center gap-1.5 pl-2 border-l border-white/10 ml-1">
                                    <span className={cn("text-[10px] font-black transition-colors",
                                        filteredCount === 0 ? "text-red-400" : "text-indigo-400"
                                    )}>
                                        {filteredCount}
                                    </span>
                                    <span className="text-[10px] font-bold text-[#a1a1aa] select-none">/</span>
                                    <span className="text-[10px] font-bold text-[#a1a1aa] select-none">
                                        {totalCount}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="w-[1px] h-6 bg-white/10 mx-1" />

                    {/* Settings Dropdown */}
                    <ViewOptionsDropdown />
                </div>
            </div>
        </div>
    );
};
