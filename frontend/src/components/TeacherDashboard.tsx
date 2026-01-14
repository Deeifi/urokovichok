import { memo, useMemo } from 'react';
import type { ScheduleRequest, Lesson } from '../types';
import {
    Video,
    ChevronRight,
    Clock,
    BookOpen,
    Calendar,
    Zap,
    Users,
    Calculator, FlaskConical, Languages, Book, Library, Globe2, Divide, Shapes, Dna, Atom, Map,
    Scroll, Landmark, Users2, Palette, Hammer, Cpu, HeartPulse, Dumbbell, Shield, Telescope, Leaf,
    FileSpreadsheet, GraduationCap
} from 'lucide-react';
import { exportTeacherSchedule } from '../utils/excelExport';

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
import { cn } from '../utils/cn';
import { BELL_SCHEDULE } from '../constants';

interface TeacherDashboardProps {
    data: ScheduleRequest;
    teacherId: string;
    schedule: Lesson[];
    timeInfo: {
        todayApiDay: string;
        currentPeriod: number;
        isBreak: boolean;
        minutesLeft: number;
        nextPeriod: number;
    };
    now: Date;
}

export const TeacherDashboard = memo(({
    data, teacherId, schedule, timeInfo, now
}: TeacherDashboardProps) => {
    const { todayApiDay, currentPeriod, isBreak, minutesLeft, nextPeriod } = timeInfo;

    const teacher = useMemo(() => data.teachers.find(t => t.id === teacherId), [data.teachers, teacherId]);

    const teacherSchedule = useMemo(() =>
        schedule.filter(l => l.teacher_id === teacherId),
        [schedule, teacherId]);

    const todayLessons = useMemo(() =>
        teacherSchedule.filter(l => l.day === todayApiDay)
            .sort((a, b) => a.period - b.period),
        [teacherSchedule, todayApiDay]);

    const currentLesson = useMemo(() =>
        todayLessons.find(l => l.period === currentPeriod),
        [todayLessons, currentPeriod]);

    const upcomingLesson = useMemo(() =>
        todayLessons.find(l => l.period === nextPeriod),
        [todayLessons, nextPeriod]);

    const stats = useMemo(() => {
        const teacherPlan = data.plan.filter(p => p.teacher_id === teacherId);
        const totalHours = teacherPlan.reduce((sum, p) => sum + p.hours_per_week, 0);
        const classesCount = new Set(teacherPlan.map(p => p.class_id)).size;

        // Progress for today
        const finishedToday = todayLessons.filter(l => currentPeriod !== -1 && l.period < currentPeriod).length;
        const totalToday = todayLessons.length;

        return { totalHours, classesCount, finishedToday, totalToday };
    }, [data.plan, teacherId, todayLessons, currentPeriod]);

    const weeklyProgress = useMemo(() => {
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
        const dayNames = ["ПН", "ВТ", "СР", "ЧТ", "ПТ"];

        return days.map((day, idx) => {
            const lessonsCount = teacherSchedule.filter(l => l.day === day).length;
            return {
                day: dayNames[idx],
                count: lessonsCount,
                isToday: day === todayApiDay
            };
        });
    }, [teacherSchedule, todayApiDay]);

    const myClasses = useMemo(() => {
        const teacherPlan = data.plan.filter(p => p.teacher_id === teacherId);
        const classIds = Array.from(new Set(teacherPlan.map(p => p.class_id)));
        return classIds.map(id => {
            const cls = data.classes.find(c => c.id === id);
            const hours = teacherPlan.filter(p => p.class_id === id).reduce((sum, p) => sum + p.hours_per_week, 0);
            return { id, name: cls?.name || id, hours };
        });
    }, [data.plan, teacherId, data.classes]);

    const subject = currentLesson ? data.subjects.find(s => s.id === currentLesson.subject_id) : null;
    const nextStartTime = nextPeriod !== -1 ? BELL_SCHEDULE.find(b => b.period === nextPeriod)?.start : null;

    if (!teacher) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Top Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Годин на тиждень', value: stats.totalHours, icon: Clock, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                    { label: 'Кількість класів', value: stats.classesCount, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'Уроків сьогодні', value: stats.totalToday, icon: BookOpen, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { label: 'Прогрес дня', value: `${stats.finishedToday}/${stats.totalToday}`, icon: Zap, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                ].map((stat, i) => (
                    <div key={i} className="bento-card border-white/5 p-4 flex items-center gap-4 group hover:scale-[1.02] transition-transform">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", stat.bg, stat.color)}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">{stat.label}</div>
                            <div className="text-2xl font-black text-white">{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Live Card */}
                <div className="lg:col-span-2 space-y-6">
                    <div
                        className="accent-card min-h-[300px] flex flex-col justify-between overflow-hidden relative group"
                        style={{
                            background: (subject?.color && !isBreak && currentPeriod !== -1)
                                ? `linear-gradient(135deg, ${subject.color}, ${subject.color}CC)`
                                : undefined
                        }}
                    >
                        <div className="absolute -top-16 -right-16 p-8 opacity-[0.05] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                            <IconRenderer name={subject?.icon} size={240} />
                        </div>

                        <div>
                            <div className="status-badge mb-6 border-white/20 bg-black/20 backdrop-blur-md">
                                <div className={cn("live-dot", isBreak ? "bg-amber-500" : "bg-emerald-500")} />
                                {isBreak ? (
                                    `ПЕРЕРВА • ${minutesLeft} хв до початку`
                                ) : currentPeriod !== -1 ? (
                                    `ЙДЕ УРОК • залишилось ${minutesLeft} хв`
                                ) : (
                                    "ЗАНЯТТЯ ЗАКІНЧЕНО"
                                )}
                            </div>

                            <h2 className="text-5xl font-black mb-2 tracking-tight">
                                {isBreak ? "Час на перерву ☕" : (currentLesson ? subject?.name : (currentPeriod === -1 ? "Гарного відпочинку!" : "Вільне вікно"))}
                            </h2>

                            <p className="text-white/80 text-xl font-bold">
                                {currentLesson ? (
                                    <>Клас {data.classes.find(c => c.id === currentLesson.class_id)?.name} • Кабінет {currentLesson.room || subject?.defaultRoom || '—'}</>
                                ) : (
                                    isBreak ? "Зберіться з силами перед наступним уроком" : "Ви сьогодні молодці!"
                                )}
                            </p>
                        </div>

                        <div className="flex items-center gap-4 mt-8">
                            <button className="btn-premium w-fit flex items-center gap-2 group/btn">
                                <Video size={20} />
                                Приєднатися до Video
                                <ChevronRight size={18} className="translate-x-0 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                            {currentLesson && (
                                <button className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all backdrop-blur-md border border-white/10 flex items-center gap-2">
                                    <IconRenderer name={subject?.icon} size={18} />
                                    Журнал класу
                                </button>
                            )}
                            <div className="flex gap-1 bg-emerald-500/10 p-1 rounded-2xl border border-emerald-500/20">
                                <button
                                    onClick={() => exportTeacherSchedule(teacher, teacherSchedule, data.subjects, data.classes)}
                                    className="px-4 py-2 hover:bg-emerald-500/20 text-emerald-400 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                    title="Повний розклад (Предмет + Клас)"
                                >
                                    <FileSpreadsheet size={14} />
                                    Excel (Повний)
                                </button>
                                <div className="w-[1px] h-4 bg-emerald-500/20 self-center" />
                                <button
                                    onClick={() => exportTeacherSchedule(teacher, teacherSchedule, data.subjects, data.classes, { onlyClassNames: true })}
                                    className="px-4 py-2 hover:bg-emerald-500/20 text-emerald-400 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                    title="Тільки назви класів"
                                >
                                    <GraduationCap size={14} />
                                    Тільки Класи
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Today's Timeline */}
                    <div className="bento-card border-white/5 p-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-black text-[#a1a1aa] uppercase tracking-[0.2em]">Мій розклад на сьогодні</h3>
                            <div className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                                {new Intl.DateTimeFormat('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' }).format(now)}
                            </div>
                        </div>

                        <div className="space-y-2">
                            {BELL_SCHEDULE.map(slot => {
                                const lesson = todayLessons.find(l => l.period === slot.period);
                                const isCurrent = slot.period === currentPeriod;
                                const isPast = currentPeriod !== -1 && slot.period < currentPeriod;
                                const sub = lesson ? data.subjects.find(s => s.id === lesson.subject_id) : null;

                                return (
                                    <div
                                        key={slot.period}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-2xl transition-all border",
                                            isCurrent ? "bg-white/5 border-indigo-500/30 ring-1 ring-indigo-500/20" : "bg-transparent border-transparent",
                                            isPast ? "opacity-30 grayscale" : "opacity-100"
                                        )}
                                    >
                                        <div className={cn("w-16 tabular-nums font-black text-lg", isCurrent ? "text-indigo-400" : "text-[#a1a1aa]")}>
                                            {slot.start}
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                                            <IconRenderer name={sub?.icon} size={20} className={isCurrent ? "text-indigo-400" : "text-white/40"} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-lg leading-tight">{sub?.name || (lesson ? "Урок" : "—")}</div>
                                            <div className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest mt-0.5">
                                                {lesson ? `Клас ${data.classes.find(c => c.id === lesson.class_id)?.name}` : "Вільний час"}
                                            </div>
                                        </div>
                                        {lesson && (
                                            <div className={cn(
                                                "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 text-[#a1a1aa] border border-white/5",
                                                isCurrent && "border-indigo-500/30 text-indigo-400 bg-indigo-500/5"
                                            )}>
                                                Каб. {lesson.room || sub?.defaultRoom || '—'}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Sidebar Widgets */}
                <div className="space-y-6">
                    {/* Weekly Load Widget */}
                    <div className="bento-card border-white/5 p-6">
                        <h3 className="text-xs font-black text-[#a1a1aa] uppercase tracking-[0.2em] mb-6">Тижневе навантаження</h3>
                        <div className="flex justify-between items-end h-40 px-2">
                            {weeklyProgress.map((day, i) => (
                                <div key={i} className="flex flex-col items-center gap-3 w-8">
                                    <div className="relative flex-1 w-full flex items-end">
                                        <div className="absolute inset-0 bg-white/[0.02] rounded-full" />
                                        <div
                                            className={cn(
                                                "w-full rounded-full transition-all duration-1000 origin-bottom",
                                                day.isToday ? "bg-indigo-500 shadow-lg shadow-indigo-500/20" : "bg-white/10"
                                            )}
                                            style={{ height: `${(day.count / 8) * 100}%` }}
                                        />
                                    </div>
                                    <span className={cn("text-[10px] font-black tracking-widest", day.isToday ? "text-white" : "text-[#a1a1aa]")}>{day.day}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Next Activity Widget */}
                    <div className="bento-card border-white/5 p-6 bg-gradient-to-br from-indigo-500/10 to-transparent">
                        <div className="flex items-center gap-2 text-indigo-400 mb-4">
                            <Calendar size={18} />
                            <h3 className="text-xs font-black uppercase tracking-[0.2em]">Наступний урок</h3>
                        </div>
                        {upcomingLesson ? (
                            <div className="space-y-2">
                                <div className="text-3xl font-black text-white">{nextStartTime}</div>
                                <div className="text-lg font-bold text-white/90">{data.subjects.find(s => s.id === upcomingLesson.subject_id)?.name}</div>
                                <div className="text-sm font-medium text-[#a1a1aa]">Клас {data.classes.find(c => c.id === upcomingLesson.class_id)?.name}</div>
                            </div>
                        ) : (
                            <div className="text-[#a1a1aa] font-bold py-2 italic text-sm">Сьогодні уроків більше немає</div>
                        )}
                    </div>

                    {/* My Classes Widget */}
                    <div className="bento-card border-white/5 p-6">
                        <div className="flex items-center gap-2 text-emerald-400 mb-6">
                            <Users size={18} />
                            <h3 className="text-xs font-black uppercase tracking-[0.2em]">Мої класи</h3>
                        </div>
                        <div className="space-y-3">
                            {myClasses.map((cls, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black text-xs">
                                            {cls.name.slice(0, 1)}
                                        </div>
                                        <span className="font-bold text-sm text-white">{cls.name}</span>
                                    </div>
                                    <div className="text-[10px] font-black text-[#a1a1aa] group-hover:text-white transition-colors">
                                        {cls.hours} год/тижд
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
