import { Calendar, Loader2, Bell } from 'lucide-react';
import { cn } from '../utils/cn';
import { useUIStore } from '../store/useUIStore';
import { useDataStore } from '../store/useDataStore';

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
        isCompact,
        isHeaderCollapsed,
    } = useUIStore();

    // Data Store
    const { resetData } = useDataStore();

    const effectiveIsCompact = isCompact && activeTab === 'schedule' && (viewType === 'matrix' || viewType === 'teachers');

    const formattedDate = new Date().toLocaleDateString('uk-UA', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    }).replace(/^\w/, (c) => c.toUpperCase());

    // Hide Header content completely in Schedule View if not Dashboard (except for controls)
    const showGreeting = activeTab === 'schedule' && viewType === 'dashboard';

    return (
        <header className={cn("flex justify-between items-center px-4 transition-all duration-500 shrink-0 z-[100] relative",
            isHeaderCollapsed ? "h-0 opacity-0 mb-0 overflow-hidden" : (effectiveIsCompact ? "h-12 mb-1" : "h-16 mb-4")
        )}>
            {/* Left Section: Greeting (Only in Dashboard) */}
            <div className="flex items-center gap-4 min-w-[200px]">
                <div className={cn("transition-all duration-300", !showGreeting && "opacity-0 invisible w-0 overflow-hidden")}>
                    <h1 className={cn("font-black tracking-tight transition-all", effectiveIsCompact ? "text-xl" : "text-3xl")}>Привіт👋</h1>
                    {!effectiveIsCompact && <div className="text-[#a1a1aa] font-medium mt-0.5 uppercase text-[10px] tracking-widest">{formattedDate}</div>}
                </div>
            </div>

            {/* Right Section: Global Controls */}
            <div className="flex items-center gap-3">

                {/* Edit Controls Group - Moved to ScheduleToolbar */}

                {/* Data Tab Controls */}
                {activeTab === 'data' && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={resetData}
                            className="px-4 py-2 rounded-xl font-bold text-red-500 hover:bg-red-500/10 transition-all border border-red-500/20 active:scale-95 text-xs"
                        >
                            Скинути дані
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="bg-gradient-to-br from-[#6366f1] to-[#a855f7] text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2 text-xs"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : <Calendar size={16} />}
                            {loading ? 'Генерується...' : 'Створити Розклад'}
                        </button>
                    </div>
                )}


                {/* System Controls (FullScreen, Notifications, Profile) */}
                <div className="flex items-center gap-2">


                    <button
                        className={cn(
                            "rounded-xl bg-[#18181b] border border-white/5 text-[#a1a1aa] hover:text-white transition-all",
                            effectiveIsCompact ? "p-1.5" : "p-2"
                        )}
                        title="Сповіщення"
                    >
                        <Bell size={18} />
                    </button>

                    <div
                        className={cn(
                            "rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-white/10 shadow-lg shadow-indigo-500/10 transition-all cursor-pointer hover:scale-105",
                            effectiveIsCompact ? "w-8 h-8" : "w-9 h-9"
                        )}
                        title="Профіль"
                    />
                </div>
            </div>
        </header>
    );
};
