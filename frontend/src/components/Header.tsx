import { Lock, Unlock, RotateCcw, FileSpreadsheet, GraduationCap, Calendar, Loader2, Maximize2, Bell, RefreshCw, Layers, CalendarClock } from 'lucide-react';
import { cn } from '../utils/cn';
import { getWeekId } from '../utils/scheduleHelpers';
import { exportMasterTeacherSchedule } from '../utils/excelExport';
import { useUIStore } from '../store/useUIStore';
import { useDataStore } from '../store/useDataStore';
import { useScheduleStore } from '../store/useScheduleStore';

interface HeaderProps {
    handleGenerate: () => void;
    loading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
    handleGenerate,
    loading
}) => {
    // UI Store
    const {
        viewType,
        activeTab,
        isEditMode, setIsEditMode,
        isCompact,
        userRole,
        setIsFullScreen,
        isHeaderCollapsed,
        scheduleEditScope,
        setScheduleEditScope
    } = useUIStore();

    // Data Store
    const { data, resetData } = useDataStore();
    const { teachers, subjects, classes } = data;

    // Schedule Store
    const { schedule, history, undo } = useScheduleStore();
    const historyLength = history.past.length;

    const effectiveIsCompact = isCompact && activeTab === 'schedule' && (viewType === 'matrix' || viewType === 'teachers');

    const formattedDate = new Date().toLocaleDateString('uk-UA', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    }).replace(/^\w/, (c) => c.toUpperCase());

    const { selectedDate, resetWeekToTemplate } = useScheduleStore();
    const isBaseTemplate = !useScheduleStore.getState().weeklySchedules[getWeekId(new Date(selectedDate))];

    const lessons = (schedule?.status === 'success' || schedule?.status === 'conflict') ? schedule.schedule : [];

    // Hide Header completely in Schedule View (except Dashboard) as controls are now in ScheduleToolbar
    if (activeTab === 'schedule' && viewType !== 'dashboard') {
        return null;
    }

    return (
        <header className={cn("flex justify-between items-center px-2 transition-all duration-500 shrink-0",
            isHeaderCollapsed ? "h-0 opacity-0 mb-0 overflow-hidden" : (effectiveIsCompact ? "h-8 mb-1" : (viewType === 'dashboard' ? "h-16 mb-4 lg:mb-6" : "h-16 mb-4"))
        )}>
            <div className="flex items-center gap-4">
                <div className={cn("transition-all duration-300", (activeTab !== 'schedule' || viewType !== 'dashboard') && "opacity-0 invisible w-0 overflow-hidden")}>
                    <h1 className={cn("font-black tracking-tight transition-all", effectiveIsCompact ? "text-xl" : (viewType === 'dashboard' ? "text-2xl md:text-3xl" : "text-3xl"))}>Привіт👋</h1>
                    {!effectiveIsCompact && <div className="text-[#a1a1aa] font-medium mt-0.5 uppercase text-[9px] md:text-[10px] tracking-widest">{formattedDate}</div>}
                </div>

                {/* Navigation removed, moved to ScheduleToolbar */}

            </div>

            <div className="flex items-center gap-4">
                {activeTab === 'schedule' && viewType !== 'dashboard' && (
                    <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={cn(
                            "flex items-center gap-2 rounded-xl font-bold transition-all duration-300 group animate-in fade-in slide-in-from-right-4",
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
                )}

                {activeTab === 'schedule' && viewType !== 'dashboard' && isEditMode && (
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

                {activeTab === 'schedule' && schedule && (
                    <div className="flex items-center gap-1">
                        {!isBaseTemplate && (
                            <button
                                onClick={() => resetWeekToTemplate()}
                                className={cn(
                                    "flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 hover:bg-amber-500/20 transition-all active:scale-95 group",
                                    isCompact ? "px-3 py-1.5" : "px-4 py-2.5"
                                )}
                                title="Скинути зміни цього тижня та повернутись до шаблону"
                            >
                                <RefreshCw size={isCompact ? 16 : 18} className="group-hover:rotate-180 transition-transform duration-500" />
                                <span className={cn("font-bold", isCompact ? "text-xs" : "text-sm")}>Скинути</span>
                            </button>
                        )}
                        <button
                            onClick={undo}
                            disabled={historyLength === 0 || !isEditMode}
                            className={cn(
                                "flex items-center gap-2 bg-[#18181b] border border-white/5 rounded-xl text-[#a1a1aa] hover:text-white transition-all disabled:opacity-20 active:scale-95 group",
                                isCompact ? "px-3 py-1.5" : "px-4 py-2.5"
                            )}
                            title={!isEditMode ? "Увімкніть редагування для скасування" : "Скасувати останню дію"}
                        >
                            <RotateCcw size={isCompact ? 16 : 18} className="group-hover:-rotate-45 transition-transform" />
                            <span className={cn("font-bold", isCompact ? "text-xs" : "text-sm")}>Скасувати {historyLength > 0 && `(${historyLength})`}</span>
                        </button>
                    </div>
                )}

                {activeTab === 'schedule' && schedule && userRole === 'admin' && viewType === 'teachers' && (
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
                                {effectiveIsCompact ? "Excel" : "Excel (Всі)"}
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
                                Класи
                            </span>
                        </button>
                    </div>
                )}
                {activeTab === 'data' && (
                    <>
                        <button
                            onClick={resetData}
                            className="px-6 py-2.5 rounded-xl font-bold text-red-500 hover:bg-red-500/10 transition-all border border-red-500/20 active:scale-95"
                        >
                            Скинути дані
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="bg-gradient-to-br from-[#6366f1] to-[#a855f7] text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Calendar size={20} />}
                            {loading ? 'Генерується...' : 'Створити Розклад'}
                        </button>
                    </>
                )}

                {/* Full Screen & Notifications Group */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsFullScreen(true)}
                        className={cn(
                            "rounded-xl bg-[#18181b] border border-white/5 text-[#a1a1aa] hover:text-white transition-all",
                            effectiveIsCompact ? "p-1.5" : "p-2.5"
                        )}
                        title="Повноекранний режим"
                    >
                        <Maximize2 size={effectiveIsCompact ? 18 : 22} />
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
                </div>
            </div>
        </header>
    );
};
