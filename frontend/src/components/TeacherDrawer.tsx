import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { ScheduleRequest, Teacher, Subject } from '../types';
import {
    X, Check, Camera, Trash2,
    User, BookOpen, GraduationCap, Info, AlertTriangle, AlertCircle, Clock
} from 'lucide-react';
import { cn } from '../utils/cn';

interface TeacherDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    teacher: Teacher | null;
    allSubjects: Subject[];
    data: ScheduleRequest;
    onSave: (updatedTeacher: Teacher) => void;
}

export function TeacherDrawer({ isOpen, onClose, teacher, allSubjects, data, onSave }: TeacherDrawerProps) {
    const [name, setName] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [isPrimary, setIsPrimary] = useState(false);
    const [prefersPeriodZero, setPrefersPeriodZero] = useState(false);
    const [photo, setPhoto] = useState<string | null>(null);
    const [availability, setAvailability] = useState<Record<string, number[]>>({});

    useEffect(() => {
        if (teacher) {
            setName(teacher.name);
            setSelectedSubjects(teacher.subjects);
            setIsPrimary(teacher.is_primary || false);
            setPrefersPeriodZero(teacher.prefers_period_zero || false);
            setPhoto(teacher.photo || null);
            setAvailability(teacher.availability || {});
        }
    }, [teacher]);

    // Scroll Lock & Esc listener
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (isOpen && e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);


    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhoto(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = () => {
        if (!teacher || !name.trim()) return;
        onSave({
            ...teacher,
            name: name.trim(),
            subjects: selectedSubjects,
            is_primary: isPrimary,
            prefers_period_zero: prefersPeriodZero,
            photo: photo || undefined,
            availability: availability
        });
    };

    const currentLoad = useMemo(() => {
        if (!teacher) return 0;
        return data.plan
            .filter(p => p.teacher_id === teacher.id)
            .reduce((acc, p) => acc + p.hours_per_week, 0);
    }, [data.plan, teacher]);

    const loadPercentage = Math.min((currentLoad / 35) * 100, 100);
    const loadColor = currentLoad > 30 ? 'bg-rose-500' : currentLoad > 20 ? 'bg-amber-500' : 'bg-emerald-500';
    const loadText = currentLoad > 30 ? 'text-rose-400' : currentLoad > 20 ? 'text-amber-400' : 'text-emerald-400';

    const conflicts = useMemo(() => {
        const issues = [];
        if (currentLoad > 30) {
            issues.push({
                type: 'warning',
                icon: <AlertTriangle size={14} />,
                msg: `Критичне навантаження: ${currentLoad} год. Рекомендується до 30 год.`
            });
        }

        const totalBlocked = Object.values(availability).flat().length;
        const totalPossible = 40; // 5 days * 8 periods
        const availableSlots = totalPossible - totalBlocked;
        if (availableSlots < currentLoad) {
            issues.push({
                type: 'error',
                icon: <AlertCircle size={14} />,
                msg: `Недостатньо вікон (${availableSlots}) для навантаження (${currentLoad} год).`
            });
        }

        if (isPrimary && selectedSubjects.length > 0) {
            issues.push({
                type: 'info',
                icon: <Info size={14} />,
                msg: "Вчитель початкових класів вже має доступ до всіх предметів 1-4 класів."
            });
        }

        return issues;
    }, [currentLoad, availability, isPrimary, selectedSubjects]);

    if (!isOpen && !teacher) return null;

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-500",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={cn(
                    "fixed top-0 right-0 h-full w-full max-w-xl bg-[#0f0f11] z-[101] shadow-2xl transition-transform duration-500 ease-out border-l border-white/5 flex flex-col",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <User size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white leading-tight">Редагування вчителя</h2>
                            <p className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-[0.2em]">Профіль та преференції</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-white/5 text-[#a1a1aa] rounded-2xl hover:bg-white/10 hover:text-white transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                    {/* Conflicts / Insights Section */}
                    {conflicts.length > 0 && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                            {conflicts.map((issue, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                                        issue.type === 'error' ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                                            issue.type === 'warning' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                                                "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                                        issue.type === 'error' ? "bg-rose-500/20" :
                                            issue.type === 'warning' ? "bg-amber-500/20" :
                                                "bg-indigo-500/20"
                                    )}>
                                        {issue.icon}
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                                        {issue.msg}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Basic Info */}
                    <div className="grid grid-cols-[160px,1fr] gap-10 items-start animate-in fade-in slide-in-from-right-4 duration-500">
                        {/* Photo & Name Section */}
                        <div className="flex gap-8 items-start">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-[32px] bg-white/5 border border-white/10 overflow-hidden shadow-2xl relative">
                                    {photo ? (
                                        <img src={photo} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[#a1a1aa]">
                                            <User size={48} strokeWidth={1.5} />
                                        </div>
                                    )}
                                    <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <Camera size={24} className="text-white mb-2" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Змінити</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                    </label>
                                </div>
                                {photo && (
                                    <button
                                        onClick={() => setPhoto(null)}
                                        className="absolute -top-2 -right-2 p-2 bg-rose-500 text-white rounded-xl shadow-lg hover:bg-rose-600 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">ПІБ Вчителя</label>
                                    <input
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-white text-xl placeholder:text-white/10 transition-all"
                                        placeholder="Коваленко О.І."
                                    />
                                </div>

                                {/* Load Indicator */}
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
                                    <div className="flex justify-between items-end">
                                        <div className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">Поточне навантаження</div>
                                        <div className={cn("text-lg font-black", loadText)}>{currentLoad} год / тижд</div>
                                    </div>
                                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-1000", loadColor)}
                                            style={{ width: `${loadPercentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Preferences Section */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest block">Тип вчителя та пріоритети</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setIsPrimary(!isPrimary)}
                                    className={cn(
                                        "flex flex-col items-start p-6 rounded-3xl border transition-all duration-300 gap-4 text-left",
                                        isPrimary ? "bg-emerald-500/20 border-emerald-500/40 shadow-lg shadow-emerald-500/10" : "bg-white/5 border-white/10 hover:bg-white/10"
                                    )}
                                >
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-inner", isPrimary ? "bg-emerald-500 text-white" : "bg-white/5 text-[#a1a1aa]")}>
                                        <GraduationCap size={20} />
                                    </div>
                                    <div>
                                        <div className="font-black text-white text-sm mb-1 uppercase tracking-tight">Початкові класи</div>
                                        <div className="text-[10px] text-[#a1a1aa] font-bold leading-relaxed">Може викладати будь-що в 1–4 класах</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setPrefersPeriodZero(!prefersPeriodZero)}
                                    className={cn(
                                        "flex flex-col items-start p-6 rounded-3xl border transition-all duration-300 gap-4 text-left",
                                        prefersPeriodZero ? "bg-indigo-500/20 border-indigo-500/40 shadow-lg shadow-emerald-500/10" : "bg-white/5 border-white/10 hover:bg-white/10"
                                    )}
                                >
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-inner", prefersPeriodZero ? "bg-indigo-500 text-white" : "bg-white/5 text-[#a1a1aa]")}>
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <div className="font-black text-white text-sm mb-1 uppercase tracking-tight">Перевага 0 уроку</div>
                                        <div className="text-[10px] text-[#a1a1aa] font-bold leading-relaxed">Надає пріоритет раннім заняттям о 7:30</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Subjects Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest flex items-center gap-2">
                                    <BookOpen size={14} /> Дисципліни вчителя
                                </label>
                                <span className="text-[10px] font-black text-indigo-400 uppercase bg-indigo-500/10 px-2 py-1 rounded-lg">Обрано: {selectedSubjects.length}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 max-h-[250px] overflow-y-auto custom-scrollbar p-1">
                                {allSubjects.map(sub => (
                                    <button
                                        key={sub.id}
                                        onClick={() => setSelectedSubjects(prev => prev.includes(sub.id) ? prev.filter(id => id !== sub.id) : [...prev, sub.id])}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-xs font-black border transition-all flex items-center gap-2",
                                            selectedSubjects.includes(sub.id)
                                                ? "bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20"
                                                : "bg-white/5 border-white/10 text-[#a1a1aa] hover:border-white/20"
                                        )}
                                    >
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.color || '#6366f1' }} />
                                        {sub.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Availability Matrix Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest flex items-center gap-2">
                                    <X size={14} className="text-rose-500" /> Графік доступності
                                </label>
                                <span className="text-[10px] font-bold text-[#a1a1aa] uppercase bg-white/5 px-2 py-1 rounded-lg">Клікніть для блокування</span>
                            </div>

                            <div className="bg-white/[0.02] border border-white/5 rounded-[24px] p-5 overflow-hidden">
                                <div className="grid grid-cols-[32px_repeat(5,1fr)] gap-1.5 Small">
                                    {/* Empty Corner */}
                                    <div className="w-8" />

                                    {/* Days Header */}
                                    {["Пн", "Вт", "Ср", "Чт", "Пт"].map((d, i) => (
                                        <div key={i} className="text-[9px] font-black text-[#a1a1aa] text-center uppercase pb-1 opacity-50">
                                            {d}
                                        </div>
                                    ))}

                                    {/* Periods */}
                                    {[0, 1, 2, 3, 4, 5, 6, 7].map(p => (
                                        <React.Fragment key={p}>
                                            <div className="flex items-center justify-end pr-3 text-[9px] font-black text-white/10">
                                                {p}
                                            </div>
                                            {["Mon", "Tue", "Wed", "Thu", "Fri"].map(day => {
                                                const isBlocked = availability[day]?.includes(p);
                                                return (
                                                    <button
                                                        key={`${day}-${p}`}
                                                        onClick={() => {
                                                            setAvailability(prev => {
                                                                const daySlots = prev[day] || [];
                                                                const newDaySlots = daySlots.includes(p)
                                                                    ? daySlots.filter(s => s !== p)
                                                                    : [...daySlots, p];
                                                                return { ...prev, [day]: newDaySlots };
                                                            });
                                                        }}
                                                        className={cn(
                                                            "h-8 rounded-md border transition-all flex items-center justify-center relative overflow-hidden group",
                                                            isBlocked
                                                                ? "bg-rose-500/20 border-rose-500/30 text-rose-500"
                                                                : "bg-white/5 border-white/5 hover:border-white/10 text-white/5 hover:text-white/20"
                                                        )}
                                                        title={`${day}, урок ${p}`}
                                                    >
                                                        {isBlocked && (
                                                            <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,currentColor_2px,currentColor_4px)]" />
                                                        )}
                                                        <div className={cn(
                                                            "w-1 h-1 rounded-full transition-all",
                                                            isBlocked ? "bg-rose-500 scale-125" : "bg-white/10 group-hover:bg-white/40"
                                                        )} />
                                                    </button>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer - Fixed at bottom */}
                <div className="p-8 border-t border-white/5 bg-[#141416] flex gap-4 mt-auto">
                    <button
                        onClick={onClose}
                        className="px-8 py-4 bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5 flex items-center justify-center gap-2"
                    >
                        Скасувати
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!name.trim()}
                        className="flex-[2] btn-premium from-indigo-500 to-purple-600 shadow-indigo-500/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Check size={18} /> Зберегти зміни
                    </button>
                </div>
            </div>
        </>,
        document.body
    );
}
