import React from 'react';
import { Calendar, LayoutDashboard, Settings, LogOut, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';
import { useUIStore } from '../store/useUIStore';

export const Sidebar: React.FC = () => {
    const {
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        activeTab,
        setActiveTab,
        isFullScreen
    } = useUIStore();

    const menuItems = [
        { id: 'schedule', label: 'Розклад', icon: Calendar },
        { id: 'data', label: 'База даних', icon: LayoutDashboard },
        { id: 'homework', label: 'Домашка', icon: BookOpen },
        { id: 'settings', label: 'Налаштування', icon: Settings },
    ];

    return (
        <aside className={cn(
            "bg-[#0c0c0e] border-r border-white/5 flex flex-col relative group/sidebar",
            isSidebarCollapsed ? "w-20" : "w-64",
            isFullScreen && "hidden"
        )}>
            {/* Sidebar Toggle Button */}
            <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="absolute -right-3 top-20 w-6 h-6 bg-[#18181b] border border-white/10 rounded-full flex items-center justify-center text-[#a1a1aa] hover:text-white transition-all opacity-0 group-hover/sidebar:opacity-100 z-50 shadow-xl"
            >
                {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            <div className={cn("flex flex-col h-full", isSidebarCollapsed ? "p-3" : "p-6")}>
                <div className={cn("flex items-center gap-3 transition-all", isSidebarCollapsed ? "mb-8 justify-center" : "mb-10")}>
                    <div className="w-10 h-10 bg-gradient-to-br from-[#6366f1] to-[#a855f7] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                        <Calendar className="text-white" size={24} />
                    </div>
                    {!isSidebarCollapsed && (
                        <div className="flex flex-col">
                            <span className="text-xl font-black text-white tracking-tighter leading-none">УРОКОВИЧОК</span>
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">ОСВІТНЯ ПЛАТФОРМА</span>
                        </div>
                    )}
                </div>

                <nav className="flex-1 space-y-2">
                    {menuItems.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center transition-colors group rounded-xl font-bold",
                                isSidebarCollapsed ? "justify-center p-3" : "gap-4 px-4 py-3",
                                activeTab === tab.id
                                    ? "bg-indigo-600/10 text-indigo-400"
                                    : "text-[#a1a1aa] hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <tab.icon size={22} className={cn(
                                "transition-colors",
                                activeTab === tab.id ? "text-indigo-400" : "group-hover:text-white"
                            )} />
                            {!isSidebarCollapsed && <span>{tab.label}</span>}
                        </button>
                    ))}
                </nav>

                <div className={cn("mt-auto transition-all", isSidebarCollapsed ? "p-3" : "p-4")}>
                    <div className={cn(
                        "bg-[#18181b] rounded-2xl border border-white/5 flex flex-col transition-all",
                        isSidebarCollapsed ? "p-2" : "p-4"
                    )}>
                        {!isSidebarCollapsed && (
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                    <BookOpen size={20} />
                                </div>
                                <div>
                                    <div className="text-xs font-black text-white">Довідка</div>
                                    <div className="text-[10px] font-bold text-[#a1a1aa]">Вивчіть основи</div>
                                </div>
                            </div>
                        )}
                        <button className={cn(
                            "flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors font-bold",
                            isSidebarCollapsed ? "justify-center" : "text-xs"
                        )}>
                            {isSidebarCollapsed ? <BookOpen size={20} /> : (
                                <>
                                    <span>Читати гайд</span>
                                    <ChevronRight size={14} />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <button className={cn(
                    "flex items-center gap-3 rounded-xl font-bold text-red-500 hover:bg-red-500/10 transition-colors mt-4",
                    isSidebarCollapsed ? "justify-center p-3" : "px-4 py-3"
                )}>
                    <LogOut size={22} />
                    {!isSidebarCollapsed && "Вийти"}
                </button>
            </div>
        </aside>
    );
};
