import { useState, useRef, useEffect, useMemo } from 'react';
import {
    Users, Check, BookOpen, Calculator, FlaskConical, Languages, Book, Library, Globe2, Divide,
    Shapes, Dna, Atom, Map, Scroll, Landmark, Users2, Palette, Hammer, Cpu, HeartPulse,
    Dumbbell, Shield, Telescope, Leaf
} from 'lucide-react';
import { cn } from '../utils/cn';
import type { Subject, Teacher } from '../types';

const ICON_OPTIONS = [
    { name: 'BookOpen', icon: BookOpen },
    { name: 'Calculator', icon: Calculator },
    { name: 'FlaskConical', icon: FlaskConical },
    { name: 'Languages', icon: Languages },
    { name: 'Book', icon: Book },
    { name: 'Library', icon: Library },
    { name: 'Globe2', icon: Globe2 },
    { name: 'Divide', icon: Divide },
    { name: 'Shapes', icon: Shapes },
    { name: 'Dna', icon: Dna },
    { name: 'Atom', icon: Atom },
    { name: 'Map', icon: Map },
    { name: 'Scroll', icon: Scroll },
    { name: 'Landmark', icon: Landmark },
    { name: 'Users2', icon: Users2 },
    { name: 'Palette', icon: Palette },
    { name: 'Hammer', icon: Hammer },
    { name: 'Cpu', icon: Cpu },
    { name: 'HeartPulse', icon: HeartPulse },
    { name: 'Dumbbell', icon: Dumbbell },
    { name: 'Shield', icon: Shield },
    { name: 'Telescope', icon: Telescope },
    { name: 'Leaf', icon: Leaf },
];

const IconRenderer = ({ name, size = 20, className = "" }: { name?: string, size?: number, className?: string }) => {
    const IconComponent = ICON_OPTIONS.find(i => i.name === name)?.icon || BookOpen;
    return <IconComponent size={size} className={className} />;
};

// Extracted Card Component for Plan Editor
interface PlanSubjectCardProps {
    subject: Subject;
    planItem?: { hours_per_week: number; teacher_id: string; room?: string };
    classGrade: number;
    teachers: Teacher[];
    onUpdate: (hours: number, teacherId: string, room: string) => void;
}

export function PlanSubjectCard({ subject, planItem, classGrade, teachers, onUpdate }: PlanSubjectCardProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const hours = planItem?.hours_per_week || 0;
    const teacherId = planItem?.teacher_id || "";
    const activeTeacher = teachers.find(t => t.id === teacherId);
    const room = planItem?.room || subject.defaultRoom || "";
    const active = hours > 0;
    const color = subject.color || "#f59e0b";

    const isPrimaryGrade = !isNaN(classGrade) && classGrade >= 1 && classGrade <= 4;

    const relevantTeachers = useMemo(() => {
        const specialists = teachers.filter(t => t.subjects.includes(subject.id));
        const generalists = isPrimaryGrade ? teachers.filter(t => t.is_primary && !t.subjects.includes(subject.id)) : [];
        return [...specialists, ...generalists];
    }, [teachers, subject.id, isPrimaryGrade]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div
            className={cn(
                "bento-card p-4 border-white/5 transition-all duration-300 relative group select-none", // removed overflow-hidden for dropdown
                !active && "bg-white/[0.02] border-white/5 opacity-60 hover:opacity-100",
                isDropdownOpen && "z-[100]"
            )}
            style={active ? {
                backgroundColor: `${color}05`,
                borderColor: `${color}20`,
                boxShadow: `0 4px 20px -10px ${color}10`
            } : undefined}
        >
            {/* Decorative background icon */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <div className="absolute -right-2 -top-2 opacity-[0.015] group-hover:scale-110 transition-all duration-700">
                    <IconRenderer name={subject.icon} size={80} />
                </div>
            </div>

            {/* Top Row: Name and Room */}
            <div className="flex justify-between items-start mb-2 relative z-10">
                <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <div className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center border border-white/5 shadow-inner transition-transform group-hover:scale-105" style={{ backgroundColor: `${color}20`, color: color }}>
                        <IconRenderer name={subject.icon} size={16} />
                    </div>
                    <div className="font-black text-white text-lg leading-tight truncate pr-2" title={subject.name}>
                        {subject.name}
                    </div>
                </div>
                <div className="relative group/room">
                    <div className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-md border transition-all cursor-pointer text-center min-w-[3rem]",
                        active ? "text-white border-white/10 bg-white/5 hover:bg-white/10" : "text-[#a1a1aa] border-transparent"
                    )}>
                        {room || "Каб."}
                    </div>
                    <input
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-center"
                        value={room}
                        onChange={(e) => onUpdate(hours, teacherId, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            </div>

            {/* Middle Row: Large Counter & Teacher */}
            <div className="flex items-center gap-4 relative z-10">
                {/* Large Counter */}
                <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onUpdate(Math.max(0, hours - 1), teacherId, room)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/30 hover:text-white transition-colors"
                        >
                            -
                        </button>
                        <div
                            className="text-4xl font-black cursor-pointer tabular-nums select-none active:scale-95 transition-transform"
                            style={{ color: active ? color : 'rgba(255,255,255,0.1)' }}
                            onClick={() => onUpdate(hours + 1, teacherId, room)}
                        >
                            {hours}
                        </div>
                        <button
                            onClick={() => onUpdate(hours + 1, teacherId, room)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/30 hover:text-white transition-colors"
                        >
                            +
                        </button>
                    </div>
                    <div className="text-[9px] uppercase font-bold text-[#a1a1aa] tracking-widest opacity-60">
                        Годин
                    </div>
                </div>

                {/* Teacher Selector (Custom) */}
                <div className={cn("flex-1 min-w-0 relative", isDropdownOpen && "z-[100]")} ref={dropdownRef}>
                    <div
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={cn(
                            "w-full py-2 px-3 rounded-xl border border-dashed flex items-center justify-between transition-all cursor-pointer",
                            active && teacherId
                                ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                                : "border-white/10 text-[#a1a1aa] hover:border-white/20"
                        )}
                    >
                        <div className="flex items-center gap-2 truncate">
                            <Users size={14} className={teacherId ? "text-violet-400" : "opacity-30"} />
                            <span className="text-sm font-bold truncate">
                                {activeTeacher ? activeTeacher.name : "Вчитель..."}
                            </span>
                        </div>
                        <div className={cn("opacity-30 text-[10px] transition-transform duration-200", isDropdownOpen ? "-rotate-90" : "rotate-90")}>▶</div>
                    </div>

                    {/* Custom Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 min-w-[200px]">
                            <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                                <button
                                    onClick={() => { onUpdate(hours, "", room); setIsDropdownOpen(false); }}
                                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-[#a1a1aa] hover:bg-white/5 hover:text-white transition-colors"
                                >
                                    -- Без вчителя --
                                </button>
                                {relevantTeachers.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => { onUpdate(hours, t.id, room); setIsDropdownOpen(false); }}
                                        className={cn(
                                            "w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-between group/item",
                                            t.id === teacherId ? "bg-violet-500/20 text-violet-300" : "text-white/70 hover:bg-white/5 hover:text-white"
                                        )}
                                    >
                                        <span>{t.name}</span>
                                        {t.id === teacherId && <Check size={12} />}
                                    </button>
                                ))}
                                {relevantTeachers.length === 0 && (
                                    <div className="px-3 py-2 text-xs text-white/30 font-medium text-center">
                                        Немає відповідних вчителів
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

