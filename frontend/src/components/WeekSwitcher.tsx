import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { useScheduleStore } from '../store/useScheduleStore';
import { cn } from '../utils/cn';
import { getMonday } from '../utils/scheduleHelpers';

export const WeekSwitcher: React.FC<{ compact?: boolean }> = ({ compact }) => {
    const { selectedDate, setCurrentDate } = useScheduleStore();
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);

    const date = new Date(selectedDate);
    const endDate = new Date(date);
    endDate.setDate(date.getDate() + 4); // Friday

    const formattedRange = `${date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}`;

    // Calendar state
    const [viewMonth, setViewMonth] = useState(date.getMonth());
    const [viewYear, setViewYear] = useState(date.getFullYear());

    const handlePrevWeek = () => {
        const prev = new Date(date);
        prev.setDate(prev.getDate() - 7);
        setCurrentDate(prev);
    };

    const handleNextWeek = () => {
        const next = new Date(date);
        next.setDate(next.getDate() + 7);
        setCurrentDate(next);
    };

    const handleDateClick = (clickedDate: Date) => {
        setCurrentDate(clickedDate);
        setIsCalendarOpen(false);
    };

    // Close on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
                setIsCalendarOpen(false);
            }
        };
        if (isCalendarOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isCalendarOpen]);

    // Generate calendar days for the view month
    const calendarDays = useMemo(() => {
        const firstDay = new Date(viewYear, viewMonth, 1);
        const lastDay = new Date(viewYear, viewMonth + 1, 0);
        const days: (Date | null)[] = [];

        // Pad start of month to Monday
        const startPadding = (firstDay.getDay() + 6) % 7; // Mon=0
        for (let i = 0; i < startPadding; i++) days.push(null);

        for (let d = 1; d <= lastDay.getDate(); d++) {
            days.push(new Date(viewYear, viewMonth, d));
        }
        return days;
    }, [viewMonth, viewYear]);

    const selectedMonday = getMonday(date);

    return (
        <div className="relative" ref={popupRef}>
            <div className={cn(
                "flex items-center gap-1 bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden",
                compact ? "p-0.5" : "p-1"
            )}>
                <button
                    onClick={handlePrevWeek}
                    className={cn(
                        "p-1.5 hover:bg-white/5 text-[#a1a1aa] hover:text-white transition-all rounded-xl",
                        compact && "p-1"
                    )}
                    title="Попередній тиждень"
                >
                    <ChevronLeft size={compact ? 16 : 18} />
                </button>

                <button
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 text-white transition-all rounded-xl",
                        compact && "px-2 py-1 gap-1",
                        isCalendarOpen && "bg-white/5"
                    )}
                >
                    <div className="bg-indigo-500/10 p-1 rounded-lg text-indigo-400">
                        <CalendarIcon size={compact ? 12 : 14} />
                    </div>
                    <span className={cn("font-bold text-[#a1a1aa] uppercase tracking-wider", compact ? "text-[9px]" : "text-[10px]")}>
                        {formattedRange}
                    </span>
                </button>

                <button
                    onClick={handleNextWeek}
                    className={cn(
                        "p-1.5 hover:bg-white/5 text-[#a1a1aa] hover:text-white transition-all rounded-xl",
                        compact && "p-1"
                    )}
                    title="Наступний тиждень"
                >
                    <ChevronRight size={compact ? 16 : 18} />
                </button>
            </div>

            {/* Calendar Popup */}
            {isCalendarOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-[#1a1a1d] border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-top-2 duration-200 min-w-[280px]">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <button onClick={() => setViewMonth(m => m === 0 ? (setViewYear(y => y - 1), 11) : m - 1)} className="p-1.5 hover:bg-white/5 rounded-lg text-[#a1a1aa] hover:text-white">
                            <ChevronLeft size={16} />
                        </button>
                        <span className="font-bold text-sm text-white">
                            {new Date(viewYear, viewMonth).toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={() => setViewMonth(m => m === 11 ? (setViewYear(y => y + 1), 0) : m + 1)} className="p-1.5 hover:bg-white/5 rounded-lg text-[#a1a1aa] hover:text-white">
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Day names */}
                    <div className="grid grid-cols-7 gap-1 mb-1 text-center">
                        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(d => (
                            <span key={d} className="text-[10px] font-bold text-[#a1a1aa] uppercase">{d}</span>
                        ))}
                    </div>

                    {/* Days */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((d, i) => {
                            if (!d) return <div key={`pad-${i}`} />;
                            const isSelected = getMonday(d).toDateString() === selectedMonday.toDateString();
                            const isToday = d.toDateString() === new Date().toDateString();
                            return (
                                <button
                                    key={d.toISOString()}
                                    onClick={() => handleDateClick(d)}
                                    className={cn(
                                        "w-8 h-8 rounded-lg text-xs font-medium transition-all",
                                        isSelected ? "bg-indigo-500 text-white" : "hover:bg-white/5 text-[#a1a1aa] hover:text-white",
                                        isToday && !isSelected && "ring-1 ring-indigo-500/50"
                                    )}
                                >
                                    {d.getDate()}
                                </button>
                            );
                        })}
                    </div>

                    {/* Quick actions */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                        <button onClick={() => { setCurrentDate(new Date()); setIsCalendarOpen(false); }} className="flex-1 py-1.5 text-xs font-bold bg-white/5 hover:bg-white/10 rounded-lg transition-all">
                            Сьогодні
                        </button>
                        <button onClick={() => setIsCalendarOpen(false)} className="p-1.5 hover:bg-white/5 rounded-lg text-[#a1a1aa] hover:text-white">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
