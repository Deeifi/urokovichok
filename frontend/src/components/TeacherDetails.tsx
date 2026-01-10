import { useMemo } from 'react';
import type { ScheduleRequest } from '../types';
import { BookOpen, GraduationCap } from 'lucide-react';
import { cn } from '../utils/cn';

export function TeacherDetails({ data, teacherId }: { data: ScheduleRequest; teacherId: string }) {
    const teacherStats = useMemo(() => {
        const teacher = data.teachers.find(t => t.id === teacherId);
        if (!teacher) return null;

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
    }, [data, teacherId]);

    const getHoursStatusColor = (hours: number) => {
        if (hours >= 35) return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
        if (hours >= 25) return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
        if (hours >= 15) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
        return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    };

    if (!teacherStats) return null;

    const { teacher, totalHours, subjectBreakdown, classBreakdown } = teacherStats;
    const statusClass = getHoursStatusColor(totalHours);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
