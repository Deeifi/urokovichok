import { useState, useRef, useEffect } from 'react';
import type { UnscheduledItem } from '../utils/scheduleHelpers';
import type { Subject, Teacher, ClassGroup } from '../types';
import { createPortal } from 'react-dom';
import { GripVertical, AlertTriangle, Pin, PinOff, Move, X } from 'lucide-react';
import { cn } from '../utils/cn';
import { useHover } from '../context/HoverContext';

interface UnscheduledPanelProps {
    items: UnscheduledItem[];
    subjects: Subject[];
    teachers: Teacher[];
    classes: ClassGroup[];
    isOpen: boolean;
    onToggle: () => void;
    mode: 'docked' | 'floating';
    setMode: (mode: 'docked' | 'floating') => void;
}

export function UnscheduledPanel({ items, subjects, teachers, classes, isOpen, onToggle, mode, setMode }: UnscheduledPanelProps) {
    const { setHoveredLesson } = useHover();
    const [position, setPosition] = useState({ x: window.innerWidth - 320, y: window.innerHeight - 300 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    // Handle Window Resize to keep panel in bounds
    useEffect(() => {
        const handleResize = () => {
            setPosition(prev => ({
                x: Math.min(prev.x, window.innerWidth - 320),
                y: Math.min(prev.y, window.innerHeight - 100)
            }));
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (isOpen && e.key === 'Escape') {
                onToggle();
            }
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onToggle]);

    // Drag Logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            setPosition({
                x: e.clientX - dragOffset.current.x,
                y: e.clientY - dragOffset.current.y
            });
        };
        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    if (items.length === 0) return null;

    const handleMouseDown = (e: React.MouseEvent) => {
        if (mode !== 'floating') return;
        setIsDragging(true);
        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    // FLOATING STYLE vs DOCKED STYLE
    const panelStyle = mode === 'floating' ? {
        left: position.x,
        top: position.y,
        width: '300px',
        transform: 'none',
        maxHeight: '60vh',
    } : {}; // Docked uses classes

    return createPortal(
        <>
            {/* Trigger Button (if closed) */}
            <div
                className={cn(
                    "fixed bottom-6 left-1/2 -translate-x-1/2 z-[40] transition-all duration-500",
                    isOpen ? "translate-y-[200px] opacity-0" : "translate-y-0 opacity-100"
                )}
            >
                <div
                    onClick={onToggle}
                    className="flex items-center gap-3 px-6 py-3 bg-[#18181b] border border-amber-500/30 rounded-full shadow-2xl shadow-amber-900/20 cursor-pointer hover:bg-[#202024] transition-all group animate-bounce-slow"
                >
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center">
                        <AlertTriangle size={16} className="group-hover:animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-black text-amber-500 uppercase tracking-wider">Нерозподілені уроки</span>
                        <span className="text-[10px] text-[#a1a1aa] font-bold">{items.reduce((acc, i) => acc + i.remaining_hours, 0)} годин</span>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[#a1a1aa] ml-2">
                        <span className="text-xs font-black">{items.length}</span>
                    </div>
                </div>
            </div>
            {/* Panel Container */}
            <div
                style={mode === 'floating' ? panelStyle : undefined}
                className={cn(
                    "z-[50] bg-[#131316] border border-white/10 shadow-2xl flex flex-col",
                    mode === 'docked' && "transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1)",
                    mode === 'docked'
                        ? "fixed bottom-0 inset-x-0 rounded-t-[32px] border-b-0 shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.5)]"
                        : "fixed rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)]",
                    mode === 'docked' && !isOpen && "translate-y-full",
                    mode === 'floating' && "w-[320px]",
                    mode === 'floating' && !isOpen && "scale-95 opacity-0 pointer-events-none" // Hide floating if closed
                )}
            >
                {/* Header / Handle */}
                <div
                    onMouseDown={handleMouseDown}
                    className={cn(
                        "flex items-center justify-between px-6 pt-4 pb-2 select-none",
                        mode === 'docked' ? "cursor-auto" : "cursor-move"
                    )}
                >
                    {mode === 'docked' && (
                        <div
                            onClick={onToggle}
                            className="absolute -top-6 left-0 right-0 h-10 flex justify-center cursor-pointer group"
                        >
                            <div className="w-16 h-1.5 bg-white/20 rounded-full mt-2 transition-all group-hover:bg-white/40 group-hover:w-24 group-active:w-20" />
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        {mode === 'floating' && <Move size={14} className="text-[#a1a1aa]" />}
                        <span className="text-xs font-black text-[#a1a1aa] uppercase tracking-wider">
                            {mode === 'floating' ? 'Панель' : ''}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 z-10">
                        <button
                            onClick={() => {
                                const newMode = mode === 'docked' ? 'floating' : 'docked';
                                setMode(newMode);
                                if (newMode === 'floating') {
                                    // Reset position to center-ish if switching to floating
                                    setPosition({ x: window.innerWidth - 350, y: window.innerHeight - 500 });
                                    if (!isOpen) onToggle(); // Auto open if floating
                                }
                            }}
                            className="p-2 hover:bg-white/5 rounded-lg text-[#a1a1aa] hover:text-white transition-colors"
                            title={mode === 'docked' ? "Відкріпити (Floating mode)" : "Прикріпити (Dock mode)"}
                        >
                            {mode === 'docked' ? <PinOff size={16} /> : <Pin size={16} />}
                        </button>

                        {mode === 'floating' && (
                            <button
                                onClick={onToggle}
                                className="p-2 hover:bg-red-500/20 rounded-lg text-[#a1a1aa] hover:text-red-500 transition-colors"
                                title="Закрити"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>

                <div className={cn(
                    "p-6 pt-0 overflow-y-auto custom-scrollbar flex-1",
                    mode === 'docked' ? "md:p-8 max-h-[40vh]" : "max-h-[60vh] p-4"
                )}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className={cn("font-black text-white tracking-tight", mode === 'floating' ? "text-lg" : "text-2xl")}>
                                    {mode === 'floating' ? "Уроки" : "Нерозподілені уроки"}
                                </h3>
                                {mode === 'docked' && (
                                    <p className="text-sm text-[#a1a1aa] font-medium">Перетягніть картки на розклад</p>
                                )}
                            </div>
                        </div>
                        <div className="bg-white/5 px-4 py-2 rounded-xl text-xs font-bold text-[#a1a1aa]">
                            <span className="text-white">{items.reduce((acc, i) => acc + i.remaining_hours, 0)}</span>
                        </div>
                    </div>

                    <div className={cn(
                        mode === 'docked' ? "flex gap-4 overflow-x-auto pb-4 px-1 scrollbar-hide" : "flex flex-col gap-3"
                    )}>
                        {items.map((item) => {
                            const subject = subjects.find(s => s.id === item.subject_id);
                            const teacher = teachers.find(t => t.id === item.teacher_id);
                            const classGroup = classes.find(c => c.id === item.class_id);
                            const color = subject?.color || '#a1a1aa';

                            return (
                                <div
                                    key={`${item.class_id}-${item.subject_id}-${item.teacher_id}`}
                                    draggable
                                    onDragStart={(e) => {
                                        const payload = {
                                            class_id: item.class_id,
                                            subject_id: item.subject_id,
                                            teacher_id: item.teacher_id,
                                            duration: 1,
                                            isUnscheduled: true
                                        };
                                        e.dataTransfer.setData('lesson', JSON.stringify(payload));
                                    }}
                                    className={cn(
                                        "shrink-0 bg-[#1a1a1d] border border-white/5 rounded-2xl hover:bg-[#202024] hover:border-amber-500/30 transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden",
                                        mode === 'docked' ? "w-64 p-4" : "w-full p-3"
                                    )}
                                    onMouseEnter={() => {
                                        setHoveredLesson({
                                            class_id: item.class_id,
                                            subject_id: item.subject_id,
                                            teacher_id: item.teacher_id,
                                            day: "",
                                            period: -1,
                                            isUnscheduled: true
                                        });
                                    }}
                                    onMouseLeave={() => setHoveredLesson(null)}
                                >
                                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-10 text-[#a1a1aa]">
                                        <GripVertical size={mode === 'docked' ? 40 : 20} />
                                    </div>

                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                                            <span className="text-xs font-black text-white uppercase tracking-wider truncate max-w-[120px]" title={subject?.name}>
                                                {subject?.name}
                                            </span>
                                        </div>
                                        <div className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-500 text-[10px] font-black border border-amber-500/10">
                                            {item.remaining_hours} год
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between p-2 rounded-xl bg-black/20 border border-white/5">
                                            <span className="text-[10px] font-bold text-[#a1a1aa] uppercase">Клас</span>
                                            <span className="text-sm font-black text-white">{classGroup?.name}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-2 rounded-xl bg-black/20 border border-white/5">
                                            <span className="text-[10px] font-bold text-[#a1a1aa] uppercase">Вчитель</span>
                                            <span className="text-xs font-bold text-white truncate max-w-[100px]" title={teacher?.name}>{teacher?.name}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}
