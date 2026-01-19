import { memo } from 'react';
import {
    Video, ChevronRight, BookOpen, Calculator, FlaskConical, Languages, Book,
    Library, Globe2, Divide, Shapes, Dna, Atom, Map, Scroll, Landmark,
    Users2, Palette, Hammer, Cpu, HeartPulse, Dumbbell, Shield, Telescope, Leaf
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { BELL_SCHEDULE } from '../../constants';
import { TeacherDashboard } from '../TeacherDashboard';
import type { ScheduleRequest, Lesson, ClassGroup, PerformanceSettings } from '../../types';

interface DashboardViewProps {
    data: ScheduleRequest;
    selectedClassId: string;
    setSelectedClassId: (id: string) => void;
    timeInfo: any;
    now: Date;
    findLesson: (classId: string, day: string, period: number) => Lesson | null;
    periods: number[];
    getRoomColor: (room: string | undefined) => string;
    sortedClasses: ClassGroup[];
    perfSettings: PerformanceSettings;
    userRole: 'admin' | 'teacher';
    selectedTeacherId: string | null;
    lessons: Lesson[];
    isFullScreen?: boolean;
}

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

const IconRenderer = ({ name, size = 20, className = "", color }: { name?: string, size?: number, className?: string, color?: string }) => {
    const IconComponent = ICON_OPTIONS.find(i => i.name === name)?.icon || BookOpen;
    return <IconComponent size={size} className={className} color={color} />;
};

export const DashboardView = memo(({
    data, selectedClassId, setSelectedClassId, timeInfo, now, findLesson, periods,
    sortedClasses, perfSettings, userRole, selectedTeacherId, lessons, isFullScreen
}: DashboardViewProps) => {
    const { todayApiDay, currentPeriod, isBreak, minutesLeft, nextPeriod } = timeInfo;

    // Use enhanced dashboard for teachers
    if (userRole === 'teacher' && selectedTeacherId) {
        return (
            <TeacherDashboard
                data={data}
                teacherId={selectedTeacherId}
                schedule={lessons}
                timeInfo={timeInfo}
                now={now}
                isFullScreen={isFullScreen}
            />
        );
    }

    const todayLessons = periods.map(p => ({
        period: p,
        lesson: findLesson(selectedClassId, todayApiDay, p)
    }));

    const currentLesson = currentPeriod !== -1 ? findLesson(selectedClassId, todayApiDay, currentPeriod) : null;
    const upcomingLesson = nextPeriod !== -1 ? findLesson(selectedClassId, todayApiDay, nextPeriod) : null;

    const subject = currentLesson ? data.subjects.find(s => s.id === currentLesson.subject_id) : null;
    const teacher = currentLesson ? data.teachers.find(t => t.id === currentLesson.teacher_id) : null;

    const nextStartTime = nextPeriod !== -1 ? BELL_SCHEDULE.find(b => b.period === nextPeriod)?.start : null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none overflow-hidden">
            {/* Live Card */}
            {!isFullScreen && (
                <div
                    className="md:col-span-2 accent-card flex flex-col justify-between min-h-[320px] shadow-2xl shadow-indigo-500/20 relative overflow-hidden group transition-all duration-700"
                    style={{
                        background: (subject?.color && !isBreak)
                            ? `linear-gradient(135deg, ${subject.color}, ${subject.color}CC)`
                            : undefined
                    }}
                >
                    <div className="absolute -top-16 -right-16 p-8 opacity-[0.05] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                        <IconRenderer name={subject?.icon} size={240} color={subject?.color} />
                    </div>

                    <div>
                        <div className="status-badge mb-6 border-white/20 bg-black/20 backdrop-blur-md">
                            <div className={cn("live-dot", isBreak && "bg-amber-500 shadow-amber-500/50")} />
                            {isBreak ? (
                                `ПЕРЕРВА (до початку ${minutesLeft} хв)`
                            ) : currentPeriod !== -1 ? (
                                `ЗАРАЗ ІДЕ (${minutesLeft} хв залишилось)`
                            ) : (
                                "ЗАНЯТТЯ ЗАКІНЧЕНО"
                            )}
                        </div>
                        <h2 className="text-5xl font-black mb-2 tracking-tight group-hover:translate-x-1 transition-transform">
                            {isBreak ? "Час на каву ☕" : subject?.name || (currentPeriod === -1 ? "Вітаємо!" : "Вільне вікно")}
                        </h2>
                        <p className="text-white/80 text-xl font-bold flex items-center gap-2">
                            {isBreak ? "Готуйся до наступного уроку" : (
                                currentLesson ? (
                                    `${teacher?.name} • Кабінет ${subject?.defaultRoom || '101'}`
                                ) : "Відпочивай"
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 mt-8">
                        <a
                            href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-premium w-fit flex items-center gap-2 group/btn"
                        >
                            <Video size={20} />
                            Приєднатися до Video 📹
                            <ChevronRight size={18} className="translate-x-0 group-hover/btn:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </div>
            )}

            {/* Next Lesson Card */}
            {!isFullScreen && (
                <div className="bento-card flex flex-col justify-between border-white/5 bg-[#1a1a1e] p-5 h-full">
                    <div className="space-y-4">
                        <div className="text-[#a1a1aa] text-xs font-black uppercase tracking-widest flex justify-between items-center">
                            <span>НАСТУПНИЙ УРОК</span>
                            {!perfSettings.lowFrequencyClock && (
                                <span className="text-[10px] tabular-nums bg-white/5 px-2 py-1 rounded-md">
                                    {now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            )}
                        </div>
                        <div className="text-[#22c55e] text-5xl font-black mb-1 tabular-nums">{nextStartTime || "--:--"}</div>
                    </div>

                    <div className="mt-auto">
                        <h3 className="text-2xl font-bold mb-1 line-clamp-2">
                            {upcomingLesson ? data.subjects.find(s => s.id === upcomingLesson.subject_id)?.name : "Сьогодні все"}
                        </h3>
                        <p className="text-[#a1a1aa] font-medium text-sm">
                            {upcomingLesson ? data.teachers.find(t => t.id === upcomingLesson.teacher_id)?.name : "Чудова робота!"}
                        </p>
                    </div>
                </div>
            )}

            {/* Today's Schedule List */}
            <div className="md:col-span-3 bento-card border-white/5">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-[#a1a1aa] text-xs font-black uppercase tracking-widest">
                        РОЗКЛАД КЛАСУ НА СЬОГОДНІ
                    </h3>
                    <select
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="bg-white/5 border-none rounded-lg px-3 py-1 text-sm font-bold focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                    >
                        {sortedClasses.map(c => <option key={c.id} value={c.id} className="bg-[#18181b]">Клас {c.name}</option>)}
                    </select>
                </div>

                <div className="space-y-1">
                    {todayLessons.map(({ period, lesson }) => {
                        const sub = lesson ? data.subjects.find(s => s.id === lesson.subject_id) : null;
                        const isCurrent = period === currentPeriod;
                        const isPast = currentPeriod !== -1 && period < currentPeriod;
                        const sched = BELL_SCHEDULE.find(b => b.period === period);

                        return (
                            <div
                                key={period}
                                className={cn(
                                    "flex items-center gap-4 py-4 px-4 rounded-2xl transition-all duration-300",
                                    isCurrent ? "bg-white/5 border-l-4 border-indigo-500 translate-x-1" : "hover:bg-white/[0.02]",
                                    isPast ? "opacity-30 grayscale" : "opacity-100"
                                )}
                            >
                                <div className={cn(
                                    "w-16 font-black text-lg tabular-nums text-center",
                                    isCurrent ? "text-indigo-400" : "text-[#a1a1aa]"
                                )}>
                                    {sched?.start || "--:--"}
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                                    <IconRenderer name={sub?.icon} size={20} color={sub?.color} className={cn(!sub?.color && (isCurrent ? "text-indigo-400" : "text-white/40"))} />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-lg leading-tight">{sub?.name || "—"}</div>
                                    <div className="text-[10px] text-[#a1a1aa] font-black uppercase tracking-widest mt-0.5">
                                        {lesson ? data.teachers.find(t => t.id === lesson.teacher_id)?.name : "Вікно"}
                                    </div>
                                </div>
                                <div className={cn(
                                    "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 text-[#a1a1aa] border border-white/5",
                                    isCurrent && "border-indigo-500/30 text-indigo-400 bg-indigo-500/5"
                                )}>
                                    {lesson?.room || sub?.defaultRoom || "—"}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div >
    );
});
