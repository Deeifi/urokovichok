import { useState, useMemo } from 'react';
import type { ScheduleRequest, Teacher } from '../types';
import { Users, BookOpen, GraduationCap, Clock, Search, SortAsc, SortDesc, ChevronRight, ArrowLeft } from 'lucide-react';
import { cn } from '../utils/cn';

interface TeacherDetailsProps {
    data: ScheduleRequest;
}

interface TeacherStats {
    teacher: Teacher;
    totalHours: number;
    subjectBreakdown: {
        subjectId: string;
        subjectName: string;
        classes: { classId: string; className: string; hours: number }[];
        totalHours: number;
    }[];
    classBreakdown: {
        classId: string;
        className: string;
        subjects: { subjectId: string; subjectName: string; hours: number }[];
        totalHours: number;
    }[];
}

type SortBy = 'name' | 'hours';
type SortOrder = 'asc' | 'desc';

export function TeacherDetails({ data }: TeacherDetailsProps) {
    const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortBy>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    // Calculate statistics for all teachers
    const teacherStats = useMemo<TeacherStats[]>(() => {
        return data.teachers.map(teacher => {
            const teacherPlan = data.plan.filter(p => p.teacher_id === teacher.id);
            const totalHours = teacherPlan.reduce((sum, p) => sum + p.hours_per_week, 0);

            const subjectMap = new Map<string, { subjectId: string; subjectName: string; classes: { classId: string; className: string; hours: number }[] }>();
            teacherPlan.forEach(planItem => {
                const subject = data.subjects.find(s => s.id === planItem.subject_id);
                const cls = data.classes.find(c => c.id === planItem.class_id);
                if (!subjectMap.has(planItem.subject_id)) {
                    subjectMap.set(planItem.subject_id, { subjectId: planItem.subject_id, subjectName: subject?.name || planItem.subject_id, classes: [] });
                }
                subjectMap.get(planItem.subject_id)!.classes.push({ classId: planItem.class_id, className: cls?.name || planItem.class_id, hours: planItem.hours_per_week });
            });

            const subjectBreakdown = Array.from(subjectMap.values()).map(s => ({
                ...s,
                totalHours: s.classes.reduce((sum, c) => sum + c.hours, 0)
            })).sort((a, b) => b.totalHours - a.totalHours);

            const classMap = new Map<string, { classId: string; className: string; subjects: { subjectId: string; subjectName: string; hours: number }[] }>();
            teacherPlan.forEach(planItem => {
                const subject = data.subjects.find(s => s.id === planItem.subject_id);
                const cls = data.classes.find(c => c.id === planItem.class_id);
                if (!classMap.has(planItem.class_id)) {
                    classMap.set(planItem.class_id, { classId: planItem.class_id, className: cls?.name || planItem.class_id, subjects: [] });
                }
                classMap.get(planItem.class_id)!.subjects.push({ subjectId: planItem.subject_id, subjectName: subject?.name || planItem.subject_id, hours: planItem.hours_per_week });
            });

            const classBreakdown = Array.from(classMap.values()).map(c => ({
                ...c,
                totalHours: c.subjects.reduce((sum, s) => sum + s.hours, 0)
            })).sort((a, b) => a.className.localeCompare(b.className, undefined, { numeric: true }));

            return { teacher, totalHours, subjectBreakdown, classBreakdown };
        });
    }, [data]);

    const filteredAndSortedTeachers = useMemo(() => {
        let result = teacherStats.filter(ts => ts.teacher.name.toLowerCase().includes(searchQuery.toLowerCase()));
        result.sort((a, b) => {
            let comparison = sortBy === 'name' ? a.teacher.name.localeCompare(b.teacher.name, 'uk') : a.totalHours - b.totalHours;
            return sortOrder === 'asc' ? comparison : -comparison;
        });
        return result;
    }, [teacherStats, searchQuery, sortBy, sortOrder]);

    const summaryStats = useMemo(() => {
        const totalTeachers = data.teachers.length;
        const totalHours = teacherStats.reduce((sum, ts) => sum + ts.totalHours, 0);
        const avgHours = totalTeachers > 0 ? (totalHours / totalTeachers).toFixed(1) : 0;
        const hoursList = teacherStats.map(ts => ts.totalHours);
        const maxHours = hoursList.length > 0 ? Math.max(...hoursList) : 0;
        const minHours = hoursList.length > 0 ? Math.min(...hoursList) : 0;
        return { totalTeachers, totalHours, avgHours, maxHours, minHours };
    }, [teacherStats, data.teachers.length]);

    const getHoursStatusColor = (hours: number) => {
        if (hours >= 35) return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
        if (hours >= 25) return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
        if (hours >= 15) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
        return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    };

    const toggleSort = (newSortBy: SortBy) => {
        if (sortBy === newSortBy) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        else { setSortBy(newSortBy); setSortOrder('asc'); }
    };

    const selectedTeacherStats = useMemo(() =>
        teacherStats.find(ts => ts.teacher.id === selectedTeacherId),
        [teacherStats, selectedTeacherId]);

    // --- Detail View ---
    if (selectedTeacherStats) {
        const { teacher, totalHours, subjectBreakdown, classBreakdown } = selectedTeacherStats;
        const statusClass = getHoursStatusColor(totalHours);

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button
                    onClick={() => setSelectedTeacherId(null)}
                    className="flex items-center gap-2 text-[#a1a1aa] hover:text-white transition-colors font-black text-[10px] uppercase tracking-widest group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Назад до списку
                </button>

                <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                    <div className="flex items-center gap-8">
                        <div className="w-24 h-24 rounded-3xl bg-indigo-500 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-indigo-500/20 overflow-hidden border-2 border-white/10">
                            {teacher.photo ? (
                                <img src={teacher.photo} className="w-full h-full object-cover" alt="" />
                            ) : (
                                teacher.name.slice(0, 1).toUpperCase()
                            )}
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-white tracking-tight leading-none mb-3">{teacher.name}</h2>
                            <div className="flex gap-4">
                                <span className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest flex items-center gap-2">
                                    <BookOpen size={14} className="text-indigo-400" />
                                    {subjectBreakdown.length} ПРЕДМЕТІВ
                                </span>
                                <span className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest flex items-center gap-2">
                                    <GraduationCap size={14} className="text-emerald-400" />
                                    {classBreakdown.length} КЛАСІВ
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-end gap-6 bg-white/5 p-6 rounded-[32px] border border-white/5 backdrop-blur-xl">
                        <div className="text-right">
                            <div className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest mb-1">Загальне навантаження</div>
                            <div className={cn("text-4xl font-black tracking-tighter", statusClass.split(' ')[0])}>
                                {totalHours} <span className="text-sm font-bold opacity-50 uppercase ml-1">год/тиждень</span>
                            </div>
                        </div>
                        <div className="w-1 h-12 bg-white/10 rounded-full" />
                        <div className="w-32 h-3 bg-white/10 rounded-full overflow-hidden self-center">
                            <div
                                className={cn("h-full rounded-full transition-all duration-1000", statusClass.split(' ')[0].replace('text-', 'bg-'))}
                                style={{ width: `${Math.min(100, (totalHours / 40) * 100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* By Subject */}
                    <div className="bento-card border-white/5 p-8 bg-black/20">
                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-8">
                            <BookOpen size={16} /> Розподіл по предметах
                        </h4>
                        <div className="space-y-4">
                            {subjectBreakdown.map(subject => (
                                <div key={subject.subjectId} className="bg-white/5 p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="font-black text-white text-xl tracking-tight leading-none">{subject.subjectName}</span>
                                        <span className="px-4 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-xl font-black text-sm border border-indigo-500/10">
                                            {subject.totalHours} год
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {subject.classes.map(cls => (
                                            <span key={cls.classId} className="px-3 py-1.5 bg-black/30 text-[#a1a1aa] rounded-xl text-[10px] font-black border border-white/5 tracking-wider uppercase">
                                                {cls.className} <span className="text-white ml-1">{cls.hours}Г</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* By Class */}
                    <div className="bento-card border-white/5 p-8 bg-black/20">
                        <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2 mb-8">
                            <GraduationCap size={16} /> Розподіл по класах
                        </h4>
                        <div className="space-y-4">
                            {classBreakdown.map(cls => (
                                <div key={cls.classId} className="bg-white/5 p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest leading-none">Клас</span>
                                            <span className="font-black text-white text-xl tracking-tight leading-none">{cls.className}</span>
                                        </div>
                                        <span className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl font-black text-sm border border-emerald-500/10">
                                            {cls.totalHours} год
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {cls.subjects.map(subj => (
                                            <span key={subj.subjectId} className="px-3 py-1.5 bg-black/30 text-[#a1a1aa] rounded-xl text-[10px] font-black border border-white/5 tracking-wider uppercase">
                                                {subj.subjectName} <span className="text-white ml-1">{subj.hours}Г</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Grid View ---
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                {[
                    { label: 'Всього вчителів', value: summaryStats.totalTeachers, icon: <Users size={20} />, gradient: 'from-blue-500 to-indigo-600' },
                    { label: 'Всього годин', value: summaryStats.totalHours, icon: <Clock size={20} />, gradient: 'from-emerald-500 to-teal-600' },
                    { label: 'Середнє', value: summaryStats.avgHours, icon: <Clock size={20} />, gradient: 'from-violet-500 to-purple-600' },
                    { label: 'Макс. навантаж.', value: summaryStats.maxHours, icon: <SortDesc size={20} />, gradient: 'from-rose-500 to-orange-600' },
                    { label: 'Мін. навантаж.', value: summaryStats.minHours, icon: <SortAsc size={20} />, gradient: 'from-slate-500 to-slate-700' },
                ].map((s, i) => (
                    <div key={i} className="bento-card p-6 border-white/5 relative overflow-hidden group">
                        <div className={cn("absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-10 rounded-full bg-gradient-to-br", s.gradient)} />
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br text-white shadow-lg", s.gradient)}>
                            {s.icon}
                        </div>
                        <div className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest mb-1">{s.label}</div>
                        <div className="text-3xl font-black text-white tracking-tight">{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="bento-card p-4 border-white/5 bg-[#18181b]/50 backdrop-blur-xl flex flex-col md:flex-row gap-4 items-center shadow-2xl shadow-black/40">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Пошук вчителя за ім'ям або предметом..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-white placeholder:text-white/20"
                    />
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={() => toggleSort('name')}
                        className={cn(
                            "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border-2",
                            sortBy === 'name' ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400" : "bg-white/5 border-white/5 text-[#a1a1aa] hover:border-white/10"
                        )}
                    >
                        За ім'ям {sortBy === 'name' && (sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />)}
                    </button>
                    <button
                        onClick={() => toggleSort('hours')}
                        className={cn(
                            "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border-2",
                            sortBy === 'hours' ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-white/5 border-white/5 text-[#a1a1aa] hover:border-white/10"
                        )}
                    >
                        За годинами {sortBy === 'hours' && (sortOrder === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />)}
                    </button>
                </div>
            </div>

            {/* Teacher Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedTeachers.map(({ teacher, totalHours, subjectBreakdown, classBreakdown }) => {
                    const statusClass = getHoursStatusColor(totalHours);

                    return (
                        <div
                            key={teacher.id}
                            onClick={() => setSelectedTeacherId(teacher.id)}
                            className="bento-card border-white/5 bg-white/[0.02] hover:bg-white/[0.05] p-6 transition-all duration-300 group cursor-pointer hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/10 active:scale-[0.98]"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white text-2xl font-black group-hover:bg-indigo-500 group-hover:shadow-lg group-hover:shadow-indigo-500/20 transition-all duration-500 overflow-hidden border border-white/5">
                                    {teacher.photo ? (
                                        <img src={teacher.photo} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                                    ) : (
                                        teacher.name.slice(0, 1).toUpperCase()
                                    )}
                                </div>
                                <div className={cn("px-4 py-2 rounded-xl font-black text-sm border", statusClass)}>
                                    {totalHours} ГОД
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-white tracking-tight leading-none mb-4 group-hover:text-indigo-400 transition-colors uppercase">
                                {teacher.name}
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-[#a1a1aa] flex items-center gap-2">
                                        <BookOpen size={12} className="text-indigo-500/50" />
                                        Предмети
                                    </span>
                                    <span className="text-white">{subjectBreakdown.length}</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-[#a1a1aa] flex items-center gap-2">
                                        <GraduationCap size={12} className="text-emerald-500/50" />
                                        Класи
                                    </span>
                                    <span className="text-white">{classBreakdown.length}</span>
                                </div>

                                <div className="pt-4 flex items-center justify-between border-t border-white/5">
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mr-4">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-1000", statusClass.split(' ')[0].replace('text-', 'bg-'))}
                                            style={{ width: `${Math.min(100, (totalHours / 40) * 100)}%` }}
                                        />
                                    </div>
                                    <ChevronRight size={16} className="text-white/20 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredAndSortedTeachers.length === 0 && (
                    <div className="col-span-full text-center py-24 bg-white/5 rounded-[32px] border-2 border-dashed border-white/5">
                        <Search size={64} className="mx-auto mb-6 text-white/5" />
                        <p className="font-black text-white/30 uppercase tracking-widest">Вчителів не знайдено</p>
                    </div>
                )}
            </div>
        </div>
    );
}
