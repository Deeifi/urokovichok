import React from 'react';
import { LayoutDashboard, Columns, Table, Users, Lock, Unlock, RotateCcw, FileSpreadsheet, GraduationCap, Calendar, Loader2, Maximize2, Bell } from 'lucide-react';
import { cn } from '../utils/cn';
import type { ScheduleResponse, Teacher, Subject, ClassGroup, ViewType } from '../types';
import { exportMasterTeacherSchedule } from '../utils/excelExport';

interface HeaderProps {
    viewType: ViewType;
    setViewType: (view: ViewType) => void;
    activeTab: string;
    setActiveTab: (tab: any) => void;
    isEditMode: boolean;
    setIsEditMode: (edit: boolean) => void;
    schedule: ScheduleResponse | null;
    historyLength: number;
    handleUndo: () => void;
    isCompact: boolean;
    effectiveIsCompact: boolean;
    userRole: 'admin' | 'teacher';
    teachers: Teacher[];
    subjects: Subject[];
    classes: ClassGroup[];
    handleReset: () => void;
    handleGenerate: () => void;
    loading: boolean;
    setIsFullScreen: (full: boolean) => void;
    isHeaderCollapsed: boolean;
}

export const Header: React.FC<HeaderProps> = ({
    viewType,
    setViewType,
    activeTab,
    isEditMode,
    setIsEditMode,
    schedule,
    historyLength,
    handleUndo,
    isCompact,
    effectiveIsCompact,
    userRole,
    teachers,
    subjects,
    classes,
    handleReset,
    handleGenerate,
    loading,
    setIsFullScreen,
    isHeaderCollapsed
}) => {
    const formattedDate = new Date().toLocaleDateString('uk-UA', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    }).replace(/^\w/, (c) => c.toUpperCase());

    const lessons = (schedule?.status === 'success' || schedule?.status === 'conflict') ? schedule.schedule : [];

    return (
        <header className={cn("flex justify-between items-center px-2 transition-all duration-500 overflow-hidden shrink-0",
            isHeaderCollapsed ? "h-0 opacity-0 mb-0" : (effectiveIsCompact ? "h-8 mb-1" : (viewType === 'dashboard' ? "h-16 mb-4 lg:mb-6" : "h-16 mb-4"))
        )}>
            <div className="flex items-center gap-4">
                <div className={cn("transition-all duration-300", (activeTab !== 'schedule' || viewType !== 'dashboard') && "opacity-0 invisible w-0 overflow-hidden")}>
                    <h1 className={cn("font-black tracking-tight transition-all", effectiveIsCompact ? "text-xl" : (viewType === 'dashboard' ? "text-2xl md:text-3xl" : "text-3xl"))}>Привіт👋</h1>
                    {!effectiveIsCompact && <div className="text-[#a1a1aa] font-medium mt-0.5 uppercase text-[9px] md:text-[10px] tracking-widest">{formattedDate}</div>}
                </div>

                {activeTab === 'schedule' && viewType !== 'dashboard' && (
                    <div className={cn("flex items-center gap-2 bg-[#18181b] rounded-2xl border border-white/5 transition-all animate-in fade-in slide-in-from-left-4 duration-500", effectiveIsCompact ? "p-1" : "p-1.5")}>
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
                )}
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

                {activeTab === 'schedule' && schedule && (
                    <button
                        onClick={handleUndo}
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
                )}

                {activeTab === 'schedule' && schedule && userRole === 'admin' && viewType === 'teachers' && (
                    <div className="flex gap-1 bg-emerald-500/10 p-1 rounded-2xl border border-emerald-500/20">
                        <button
                            onClick={() => exportMasterTeacherSchedule(teachers, lessons, subjects, classes)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 hover:bg-emerald-500/20 text-emerald-400 rounded-xl transition-all active:scale-95 group"
                            )}
                            title="Повний розклад (Всі)"
                        >
                            <FileSpreadsheet size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Excel (Всі)</span>
                        </button>
                        <div className="w-[1px] h-4 bg-emerald-500/20 self-center" />
                        <button
                            onClick={() => exportMasterTeacherSchedule(teachers, lessons, subjects, classes, { onlyClassNames: true })}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 hover:bg-emerald-500/20 text-emerald-400 rounded-xl transition-all active:scale-95 group"
                            )}
                            title="Тільки назви класів (Всі)"
                        >
                            <GraduationCap size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Класи</span>
                        </button>
                    </div>
                )}
                {activeTab === 'data' && (
                    <>
                        <button
                            onClick={handleReset}
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
