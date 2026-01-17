import { LayoutDashboard, Columns, Table, Users, Lock, Unlock, RotateCcw, FileSpreadsheet, GraduationCap, RefreshCw, Layers, CalendarClock, Maximize2, Minimize2, Bell, Search, Droplet, LayoutGrid, Eye, EyeOff } from 'lucide-react';
import { cn } from '../utils/cn';
import { WeekSwitcher } from './WeekSwitcher';
import { useUIStore } from '../store/useUIStore';
import { useScheduleStore } from '../store/useScheduleStore';
import { useDataStore } from '../store/useDataStore';
import { getWeekId } from '../utils/scheduleHelpers';
import { exportMasterTeacherSchedule } from '../utils/excelExport';
import type { ViewType } from '../types';

export const ScheduleToolbar = () => {
    // UI Store
    const {
        viewType, setViewType,
        isCompact,
        activeTab,
        isEditMode, setIsEditMode,
        scheduleEditScope, setScheduleEditScope,
        userRole,
        isFullScreen, setIsFullScreen,
        searchQuery, setSearchQuery,
        isMonochrome, setIsMonochrome,
        showIcons, setShowIcons
    } = useUIStore();

    // Data Store
    const { data } = useDataStore();
    const { teachers, subjects, classes } = data;

    // Schedule Store
    const { schedule, history, undo, selectedDate, resetWeekToTemplate, weeklySchedules } = useScheduleStore();
    const historyLength = history.past.length;

    const effectiveIsCompact = isCompact && (viewType === 'matrix' || viewType === 'teachers');
    const isBaseTemplate = !weeklySchedules[getWeekId(new Date(selectedDate))];
    const lessons = (schedule?.status === 'success' || schedule?.status === 'conflict') ? schedule.schedule : [];

    if (activeTab !== 'schedule') return null;

    return (
        <div className="flex flex-col gap-2 mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Top Row: View Toggles | Edit Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                {/* View Toggles */}
                <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-2xl border border-white/5 w-fit">
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
                                "flex items-center gap-2 rounded-xl font-bold transition-colors",
                                effectiveIsCompact ? "px-3 py-1 text-[10px]" : "px-4 py-2 text-xs",
                                viewType === tab.id
                                    ? "bg-white/10 text-white shadow-lg shadow-black/20"
                                    : "text-[#a1a1aa] hover:text-white"
                            )}
                        >
                            <tab.icon size={effectiveIsCompact ? 14 : 16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Edit Controls Group */}
                {viewType !== 'dashboard' && (
                    <div className="flex items-center gap-4 ml-auto">
                        {/* Full Screen Toggle */}
                        <button
                            onClick={() => setIsFullScreen(!isFullScreen)}
                            className={cn(
                                "rounded-xl bg-[#18181b] border border-white/5 text-[#a1a1aa] hover:text-white transition-all",
                                effectiveIsCompact ? "p-1.5" : "p-2.5"
                            )}
                            title={isFullScreen ? "Вийти з повноекранного режиму" : "Повноекранний режим"}
                        >
                            {isFullScreen ? <Minimize2 size={effectiveIsCompact ? 18 : 20} /> : <Maximize2 size={effectiveIsCompact ? 18 : 20} />}
                        </button>
                        <button className={cn(
                            "rounded-xl bg-[#18181b] border border-white/5 text-[#a1a1aa] hover:text-white transition-all",
                            effectiveIsCompact ? "p-1.5" : "p-2.5"
                        )}>
                            <Bell size={effectiveIsCompact ? 18 : 22} />
                        </button>
                        <div className={cn(
                            "rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-white/10 shadow-lg shadow-indigo-500/10 transition-all",
                            effectiveIsCompact ? "w-8 h-8" : "w-10 h-10"
                        )}></div>

                        {/* Edit Mode Toggle */}
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={cn(
                                "flex items-center gap-2 rounded-xl font-bold transition-all duration-300 group",
                                effectiveIsCompact ? "px-3 py-1.5 text-[10px]" : "px-4 py-2.5 text-xs",
                                isEditMode
                                    ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                                    : "bg-[#18181b] border border-white/5 text-[#a1a1aa] hover:text-white"
                            )}
                        >
                            {isEditMode ? (
                                <>
                                    <Unlock size={effectiveIsCompact ? 14 : 16} className="animate-pulse" />
                                    <span>{effectiveIsCompact ? 'РЕДАКТ.: УВІМК.' : 'Редагування УВІМК.'}</span>
                                </>
                            ) : (
                                <>
                                    <Lock size={effectiveIsCompact ? 14 : 16} />
                                    <span>{effectiveIsCompact ? 'РЕДАКТ.: ВИМК.' : 'Редагування ВИМК.'}</span>
                                </>
                            )}
                        </button>

                        {/* Edit Scope Toggle */}
                        {isEditMode && (
                            <div className={cn(
                                "flex items-center gap-0.5 bg-[#18181b] rounded-2xl border border-white/5 transition-all animate-in fade-in slide-in-from-left-4 duration-500",
                                effectiveIsCompact ? "p-0.5" : "p-1"
                            )}>
                                <button
                                    onClick={() => setScheduleEditScope('template')}
                                    className={cn(
                                        "flex items-center gap-1.5 rounded-xl font-bold transition-all",
                                        effectiveIsCompact ? "px-2 py-1 text-[9px]" : "px-3 py-1.5 text-[10px]",
                                        scheduleEditScope === 'template'
                                            ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                                            : "text-[#a1a1aa] hover:text-white hover:bg-white/5"
                                    )}
                                    title="Зміни застосовуються до всіх тижнів"
                                >
                                    <Layers size={effectiveIsCompact ? 12 : 14} />
                                    Шаблон
                                </button>
                                <button
                                    onClick={() => setScheduleEditScope('week')}
                                    className={cn(
                                        "flex items-center gap-1.5 rounded-xl font-bold transition-all",
                                        effectiveIsCompact ? "px-2 py-1 text-[9px]" : "px-3 py-1.5 text-[10px]",
                                        scheduleEditScope === 'week'
                                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                            : "text-[#a1a1aa] hover:text-white hover:bg-white/5"
                                    )}
                                    title="Зміни застосовуються тільки до цього тижня"
                                >
                                    <CalendarClock size={effectiveIsCompact ? 12 : 14} />
                                    Цей тиждень
                                </button>
                            </div>
                        )}

                        {/* Reset / Undo Group */}
                        {schedule && (
                            <div className="flex items-center gap-1">
                                {!isBaseTemplate && (
                                    <button
                                        onClick={() => resetWeekToTemplate()}
                                        className={cn(
                                            "flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 hover:bg-amber-500/20 transition-all active:scale-95 group",
                                            effectiveIsCompact ? "px-3 py-1.5" : "px-4 py-2.5"
                                        )}
                                        title="Скинути зміни цього тижня та повернутись до шаблону"
                                    >
                                        <RefreshCw size={effectiveIsCompact ? 16 : 18} className="group-hover:rotate-180 transition-transform duration-500" />
                                    </button>
                                )}
                                <button
                                    onClick={undo}
                                    disabled={historyLength === 0 || !isEditMode}
                                    className={cn(
                                        "flex items-center gap-2 bg-[#18181b] border border-white/5 rounded-xl text-[#a1a1aa] hover:text-white transition-all disabled:opacity-20 active:scale-95 group",
                                        effectiveIsCompact ? "px-3 py-1.5" : "px-4 py-2.5"
                                    )}
                                    title={!isEditMode ? "Увімкніть редагування для скасування" : "Скасувати останню дію"}
                                >
                                    <RotateCcw size={effectiveIsCompact ? 16 : 18} className="group-hover:-rotate-45 transition-transform" />
                                    <span className={cn("font-bold", effectiveIsCompact ? "text-xs" : "text-sm")}>{historyLength > 0 && `(${historyLength})`}</span>
                                </button>
                            </div>
                        )}

                        {/* Export Buttons (Admin & Teachers View Only) */}
                        {schedule && userRole === 'admin' && viewType === 'teachers' && (
                            <div className={cn("flex gap-1 bg-emerald-500/10 rounded-2xl border border-emerald-500/20", effectiveIsCompact ? "p-0.5" : "p-1")}>
                                <button
                                    onClick={() => exportMasterTeacherSchedule(teachers, lessons, subjects, classes)}
                                    className={cn(
                                        "flex items-center hover:bg-emerald-500/20 text-emerald-400 rounded-xl transition-all active:scale-95 group",
                                        effectiveIsCompact ? "px-2 py-1 gap-1" : "px-3 py-2 gap-2"
                                    )}
                                    title="Повний розклад (Всі)"
                                >
                                    <FileSpreadsheet size={effectiveIsCompact ? 14 : 16} />
                                    <span className={cn("font-black uppercase tracking-widest", effectiveIsCompact ? "text-[8px]" : "text-[10px]")}>
                                        Ex
                                    </span>
                                </button>
                                <div className={cn("bg-emerald-500/20 self-center", effectiveIsCompact ? "w-[1px] h-3" : "w-[1px] h-4")} />
                                <button
                                    onClick={() => exportMasterTeacherSchedule(teachers, lessons, subjects, classes, { onlyClassNames: true })}
                                    className={cn(
                                        "flex items-center hover:bg-emerald-500/20 text-emerald-400 rounded-xl transition-all active:scale-95 group",
                                        effectiveIsCompact ? "px-2 py-1 gap-1" : "px-3 py-2 gap-2"
                                    )}
                                    title="Тільки назви класів (Всі)"
                                >
                                    <GraduationCap size={effectiveIsCompact ? 14 : 16} />
                                    <span className={cn("font-black uppercase tracking-widest", effectiveIsCompact ? "text-[8px]" : "text-[10px]")}>
                                        Кл
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Row: Week Switcher & View Controls */}
            <div className="flex flex-wrap items-center gap-4 justify-between">
                <div className="w-fit">
                    <WeekSwitcher compact={effectiveIsCompact} />
                </div>

                {/* View Controls (Search & Toggles) - Only for Matrix/Teachers views */}
                {(viewType === 'matrix' || viewType === 'teachers') && (
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Search Input */}
                        <div className="flex items-center gap-2 bg-[#18181b] rounded-xl border border-white/5 p-1 px-3 shadow-sm h-10 w-48 transition-all focus-within:w-64 focus-within:border-indigo-500/50">
                            <Search size={14} className="text-[#a1a1aa]" />
                            <input
                                type="text"
                                placeholder={viewType === 'teachers' ? "ПОШУК ВЧИТЕЛЯ..." : "ПОШУК КЛАСУ..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-xs font-bold text-white placeholder-[#a1a1aa] w-full outline-none uppercase"
                            />
                        </div>

                        {/* Toggles Group */}
                        <div className="flex items-center gap-2 bg-[#18181b] p-1 rounded-xl border border-white/5 h-10">
                            <button
                                onClick={() => setIsMonochrome(!isMonochrome)}
                                className={cn(
                                    "flex items-center gap-2 rounded-lg text-[10px] font-black transition-all whitespace-nowrap justify-center h-full px-3",
                                    isMonochrome ? "text-[#a1a1aa] hover:text-white" : "bg-amber-600 text-white shadow-lg shadow-amber-500/20"
                                )}
                                title="Увімкнути/Вимкнути кольори предметів"
                            >
                                <Droplet size={14} className="shrink-0" />
                                {!effectiveIsCompact && (isMonochrome ? "КОЛІР: ВИМК." : "КОЛІР: УВІМК.")}
                            </button>

                            <div className="w-[1px] h-4 bg-white/10" />

                            <button
                                onClick={() => useUIStore.getState().setIsCompact(!useUIStore.getState().isCompact)}
                                className={cn(
                                    "flex items-center gap-2 rounded-lg text-[10px] font-black transition-all whitespace-nowrap justify-center h-full px-3",
                                    useUIStore.getState().isCompact ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-[#a1a1aa] hover:text-white"
                                )}
                                title="Компактний режим відображення"
                            >
                                <LayoutGrid size={14} className="shrink-0" />
                                {!effectiveIsCompact && (useUIStore.getState().isCompact ? "КОМПАКТ: УВІМК." : "КОМПАКТ: ВИМК.")}
                            </button>

                            <div className="w-[1px] h-4 bg-white/10" />

                            <button
                                onClick={() => setShowIcons(!showIcons)}
                                className={cn(
                                    "flex items-center gap-2 rounded-lg text-[10px] font-black transition-all whitespace-nowrap justify-center h-full px-3",
                                    showIcons ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "text-[#a1a1aa] hover:text-white"
                                )}
                                title="Показувати іконки предметів"
                            >
                                {showIcons ? <Eye size={14} /> : <EyeOff size={14} />}
                                {!effectiveIsCompact && (showIcons ? "ІКОНКИ: УВІМК." : "ІКОНКИ: ВИМК.")}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
