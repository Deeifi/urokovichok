import { useState, useRef, useEffect } from 'react';
import { Settings2, Check, ChevronDown, Droplet, LayoutGrid, Eye, EyeOff, Maximize2, Minimize2 } from 'lucide-react';
import { useUIStore } from '../store/useUIStore';
import { cn } from '../utils/cn';

export const ViewOptionsDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // UI Store
    const {
        isCompact, setIsCompact,
        isMonochrome, setIsMonochrome,
        showIcons, setShowIcons,
        isFullScreen, setIsFullScreen
    } = useUIStore();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 h-10 px-3 md:px-4 rounded-xl border border-white/5 transition-all text-xs font-bold uppercase tracking-wide",
                    isOpen
                        ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                        : "bg-[#18181b] text-[#a1a1aa] hover:text-white hover:bg-white/5"
                )}
            >
                <Settings2 size={16} />
                <span className="hidden md:inline">Вигляд</span>
                <ChevronDown size={14} className={cn("transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-[#18181b] border border-white/10 rounded-2xl shadow-xl shadow-black/50 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 p-1.5 flex flex-col gap-1">

                    {/* Header */}
                    <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[#71717a]">
                        Відображення
                    </div>

                    {/* Monochrome Toggle */}
                    <button
                        onClick={() => setIsMonochrome(!isMonochrome)}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                isMonochrome ? "bg-amber-500/10 text-amber-500" : "bg-[#27272a] text-[#71717a]"
                            )}>
                                <Droplet size={16} />
                            </div>
                            <div className="text-left">
                                <div className="text-white text-xs font-bold">Кольори предметів</div>
                                <div className="text-[#a1a1aa] text-[10px] leading-tight mt-0.5">Відключає кольорове кодування</div>
                            </div>
                        </div>
                        {isMonochrome ? (
                            <div className="w-5 h-5 rounded-full bg-[#27272a] border border-white/10" />
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                                <Check size={12} strokeWidth={3} />
                            </div>
                        )}
                    </button>

                    {/* Compact Mode Toggle */}
                    <button
                        onClick={() => setIsCompact(!isCompact)}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                isCompact ? "bg-indigo-500/10 text-indigo-500" : "bg-[#27272a] text-[#71717a]"
                            )}>
                                <LayoutGrid size={16} />
                            </div>
                            <div className="text-left">
                                <div className="text-white text-xs font-bold">Компактний режим</div>
                                <div className="text-[#a1a1aa] text-[10px] leading-tight mt-0.5">Зменшує відступи та розміри</div>
                            </div>
                        </div>
                        {isCompact ? (
                            <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                                <Check size={12} strokeWidth={3} />
                            </div>
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-[#27272a] border border-white/10" />
                        )}
                    </button>

                    {/* Fullscreen Toggle */}
                    <button
                        onClick={() => setIsFullScreen(!isFullScreen)}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                isFullScreen ? "bg-purple-500/10 text-purple-500" : "bg-[#27272a] text-[#71717a]"
                            )}>
                                {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            </div>
                            <div className="text-left">
                                <div className="text-white text-xs font-bold">Повноекранний режим</div>
                                <div className="text-[#a1a1aa] text-[10px] leading-tight mt-0.5">Розгортає на весь екран</div>
                            </div>
                        </div>
                        {isFullScreen ? (
                            <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                                <Check size={12} strokeWidth={3} />
                            </div>
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-[#27272a] border border-white/10" />
                        )}
                    </button>

                    {/* Show Icons Toggle */}
                    <button
                        onClick={() => setShowIcons(!showIcons)}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                showIcons ? "bg-emerald-500/10 text-emerald-500" : "bg-[#27272a] text-[#71717a]"
                            )}>
                                {showIcons ? <Eye size={16} /> : <EyeOff size={16} />}
                            </div>
                            <div className="text-left">
                                <div className="text-white text-xs font-bold">Іконки предметів</div>
                                <div className="text-[#a1a1aa] text-[10px] leading-tight mt-0.5">Показувати графічні іконки</div>
                            </div>
                        </div>
                        {showIcons ? (
                            <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                                <Check size={12} strokeWidth={3} />
                            </div>
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-[#27272a] border border-white/10" />
                        )}
                    </button>

                </div>
            )}
        </div>
    );
};
