import { useState, useMemo } from 'react';
import type { ScheduleRequest, Subject, ClassGroup, ScheduleResponse } from '../types';
import { Plus, Trash2, Check, X, Pencil, ArrowLeft, Users, ClipboardList, Search, BookOpen, GraduationCap } from 'lucide-react';
import { cn } from '../utils/cn';
import { ConfirmationModal } from './ConfirmationModal';
import { TeacherDetails } from './TeacherDetails';
import { CompactTeacherSchedule } from './CompactTeacherSchedule';
import { TeacherEditModal } from './ScheduleGrid';
import type { Lesson } from '../types';

interface DataEntryProps {
    data: ScheduleRequest;
    onChange: (data: ScheduleRequest) => void;
    schedule: ScheduleResponse | null;
    onScheduleChange: (schedule: ScheduleResponse) => void;
    isEditMode: boolean;
    setIsEditMode: (v: boolean) => void;
}

// --- Helpers ---
const sortClassNames = (a: string, b: string) => {
    const parse = (name: string) => {
        const match = name.match(/^(\d+)-(.*)$/);
        if (!match) return { grade: 0, letter: name };
        return { grade: parseInt(match[1]), letter: match[2] };
    };
    const pa = parse(a);
    const pb = parse(b);
    if (pa.grade !== pb.grade) return pa.grade - pb.grade;
    return pa.letter.localeCompare(pb.letter, 'uk');
};

const getSortedClasses = (classes: ClassGroup[]) => {
    return [...classes].sort((a, b) => sortClassNames(a.name, b.name));
};

const getSortedSubjects = (subjects: Subject[]) => {
    return [...subjects].sort((a, b) => a.name.localeCompare(b.name, 'uk'));
};

type Section = 'subjects' | 'teachers' | 'classes' | 'plan';

export function DataEntry({ data, onChange, schedule, onScheduleChange, isEditMode, setIsEditMode }: DataEntryProps) {
    const getNextId = (items: { id: string }[]) => {
        const ids = items.map(i => parseInt(i.id)).filter(id => !isNaN(id));
        return ids.length === 0 ? "1" : (Math.max(...ids) + 1).toString();
    };

    const [section, setSection] = useState<Section>('subjects');

    // Summary stats
    const stats = useMemo(() => ({
        subjects: data.subjects.length,
        teachers: data.teachers.length,
        classes: data.classes.length,
        planItems: data.plan.length,
        totalHours: data.plan.reduce((acc, p) => acc + p.hours_per_week, 0)
    }), [data]);

    const sections: { key: Section; label: string; icon: React.ReactNode; count: number; gradient: string }[] = [
        { key: 'subjects', label: 'Предмети', icon: <BookOpen size={20} />, count: stats.subjects, gradient: 'from-blue-500 to-indigo-600' },
        { key: 'teachers', label: 'Вчителі', icon: <Users size={20} />, count: stats.teachers, gradient: 'from-emerald-500 to-teal-600' },
        { key: 'classes', label: 'Класи', icon: <GraduationCap size={20} />, count: stats.classes, gradient: 'from-violet-500 to-purple-600' },
        { key: 'plan', label: 'Навчальний План', icon: <ClipboardList size={20} />, count: stats.planItems, gradient: 'from-amber-500 to-orange-600' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Section Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {sections.map(s => (
                    <button
                        key={s.key}
                        onClick={() => setSection(s.key)}
                        className={cn(
                            "bento-card p-6 border-white/5 transition-all duration-300 text-left group relative overflow-hidden",
                            section === s.key
                                ? "ring-2 ring-indigo-500/50 bg-white/5"
                                : "hover:bg-white/[0.02]"
                        )}
                    >
                        {/* Decorative background gradient */}
                        {section === s.key && (
                            <div className={cn("absolute -right-4 -top-4 w-24 h-24 blur-2xl opacity-20 rounded-full bg-gradient-to-br", s.gradient)} />
                        )}

                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-500",
                            section === s.key
                                ? cn("bg-gradient-to-br text-white shadow-lg", s.gradient)
                                : "bg-white/5 text-[#a1a1aa] group-hover:bg-white/10"
                        )}>
                            {s.icon}
                        </div>
                        <div className="text-xs font-black text-[#a1a1aa] uppercase tracking-widest mb-1">{s.label}</div>
                        <div className="text-3xl font-black text-white">{s.count}</div>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="bento-card border-white/5 bg-[#18181b]/50 backdrop-blur-xl min-h-[500px]">
                <div className="p-8">
                    {section === 'subjects' && <SubjectsEditor data={data} onChange={onChange} nextId={() => getNextId(data.subjects)} />}
                    {section === 'teachers' && (
                        <TeachersEditor
                            data={data}
                            onChange={onChange}
                            nextId={() => getNextId(data.teachers)}
                            schedule={schedule}
                            onScheduleChange={onScheduleChange}
                            isEditMode={isEditMode}
                            setIsEditMode={setIsEditMode}
                        />
                    )}
                    {section === 'classes' && <ClassesEditor data={data} onChange={onChange} />}
                    {section === 'plan' && <PlanEditor data={data} onChange={onChange} />}
                </div>
            </div>
        </div>
    );
}

// --- Subjects Editor ---
interface SubjectsEditorProps {
    data: ScheduleRequest;
    onChange: (data: ScheduleRequest) => void;
    nextId: () => string;
}

function SubjectsEditor({ data, onChange, nextId }: SubjectsEditorProps) {
    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [editingColor, setEditingColor] = useState('#6366f1');
    const [editingRoom, setEditingRoom] = useState('101');
    const [newColor, setNewColor] = useState('#6366f1');
    const [newRoom, setNewRoom] = useState('101');
    const [searchQuery, setSearchQuery] = useState('');

    const PRESETS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#f97316'];

    const handleAdd = () => {
        if (!newName.trim()) return;
        onChange({
            ...data,
            subjects: [...data.subjects, { id: nextId(), name: newName.trim(), color: newColor, defaultRoom: newRoom }]
        });
        setNewName('');
        setNewColor('#6366f1');
        setNewRoom('101');
    };

    const handleSaveEdit = () => {
        if (!editingId || !editingName.trim()) return;
        onChange({
            ...data,
            subjects: data.subjects.map(s => s.id === editingId ? { ...s, name: editingName.trim(), color: editingColor, defaultRoom: editingRoom } : s)
        });
        setEditingId(null);
    };

    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (!deleteId) return;
        onChange({
            ...data,
            subjects: data.subjects.filter(s => s.id !== deleteId),
            teachers: data.teachers.map(t => ({ ...t, subjects: t.subjects.filter(sid => sid !== deleteId) })),
            plan: data.plan.filter(p => p.subject_id !== deleteId)
        });
        setDeleteId(null);
    };

    const filteredSubjects = useMemo(() =>
        getSortedSubjects(data.subjects).filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        ), [data.subjects, searchQuery]);

    return (
        <div className="space-y-8">
            {/* Add Form */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 p-4 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none">
                    <Plus size={160} />
                </div>
                <h3 className="font-black text-white mb-6 flex items-center gap-2 uppercase tracking-widest text-xs">
                    Додати новий предмет
                </h3>
                <div className="space-y-4">
                    <input
                        placeholder="Назва предмету (напр. Математика)"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-white placeholder:text-white/20 transition-all"
                    />
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex-1 flex gap-2">
                            <input
                                placeholder="Кабінет"
                                value={newRoom}
                                onChange={e => setNewRoom(e.target.value)}
                                className="w-24 px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-white text-sm"
                            />
                            <div className="flex gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5">
                                {PRESETS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setNewColor(c)}
                                        className={cn("w-6 h-6 rounded-md transition-all active:scale-95", newColor === c ? "ring-2 ring-white scale-110" : "opacity-60 hover:opacity-100")}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                                <input
                                    type="color"
                                    value={newColor}
                                    onChange={e => setNewColor(e.target.value)}
                                    className="w-6 h-6 rounded-md bg-transparent border-none p-0 cursor-pointer overflow-hidden"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleAdd}
                            disabled={!newName.trim()}
                            className="btn-premium flex items-center gap-2 whitespace-nowrap"
                        >
                            <Plus size={20} /> Додати
                        </button>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Пошук предметів..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-white placeholder:text-white/20 transition-all"
                />
            </div>

            {/* List */}
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredSubjects.map(subject => {
                    const isEditing = editingId === subject.id;
                    const hours = data.plan.filter(p => p.subject_id === subject.id).reduce((acc, p) => acc + p.hours_per_week, 0);
                    const color = subject.color || "#6366f1";

                    return (
                        <div key={subject.id} className={cn(
                            "bento-card p-6 border-white/5 transition-all duration-300 group relative overflow-hidden",
                            isEditing ? "ring-2 ring-indigo-500 bg-indigo-500/10" : "bg-white/[0.04] hover:bg-white/[0.08]"
                        )}>
                            <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700 pointer-events-none">
                                <BookOpen size={140} />
                            </div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border border-white/5 shadow-inner" style={{ backgroundColor: `${color}20`, color: color }}>
                                        {subject.id}
                                    </div>
                                    <div className="flex gap-1">
                                        {isEditing ? (
                                            <>
                                                <button onClick={handleSaveEdit} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"><Check size={16} /></button>
                                                <button onClick={() => setEditingId(null)} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"><X size={16} /></button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => {
                                                    setEditingId(subject.id);
                                                    setEditingName(subject.name);
                                                    setEditingColor(subject.color || '#6366f1');
                                                    setEditingRoom(subject.defaultRoom || '101');
                                                }} className="p-2 bg-white/5 text-[#a1a1aa] rounded-lg hover:bg-white/10 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                                                    <Pencil size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(subject.id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {isEditing ? (
                                    <div className="space-y-3">
                                        <input
                                            value={editingName}
                                            onChange={e => setEditingName(e.target.value)}
                                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl focus:border-indigo-500 outline-none font-bold text-white text-lg transition-all"
                                            placeholder="Назва..."
                                            autoFocus
                                        />
                                        <div className="flex gap-2">
                                            <input
                                                value={editingRoom}
                                                onChange={e => setEditingRoom(e.target.value)}
                                                className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-bold text-white"
                                                placeholder="Кабінет"
                                            />
                                            <input
                                                type="color"
                                                value={editingColor}
                                                onChange={e => setEditingColor(e.target.value)}
                                                className="w-12 h-9 bg-transparent border-none p-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-2xl font-black text-white tracking-tighter mb-4 leading-tight min-h-[3.5rem]">
                                            {subject.name}
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">
                                                <span>Годин в плані</span>
                                                <span className="text-white">{hours}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">
                                                <span>Кабінет</span>
                                                <span className="text-white">{subject.defaultRoom || '101'}</span>
                                            </div>
                                        </div>

                                        <div className="mt-5 w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                                            <div className="h-full rounded-full transition-all duration-700" style={{ width: '100%', backgroundColor: color }} />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
                {filteredSubjects.length === 0 && (
                    <div className="col-span-full text-center py-20 bg-white/5 rounded-3xl border-2 border-dashed border-white/5">
                        <BookOpen size={48} className="mx-auto mb-4 text-white/10" />
                        <p className="font-black text-white/30 uppercase tracking-widest text-sm">
                            {searchQuery ? 'Предметів не знайдено' : 'Предмети ще не додані'}
                        </p>
                    </div>
                )}
            </div>
            <ConfirmationModal
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Видалити предмет?"
                description={`Ви впевнені, що хочете видалити "${data.subjects.find(s => s.id === deleteId)?.name}"? Це також видалить його з планів та вчителів.`}
            />
        </div>
    );
}

// --- Teachers Editor ---
interface TeachersEditorProps {
    data: ScheduleRequest;
    onChange: (data: ScheduleRequest) => void;
    nextId: () => string;
    schedule: ScheduleResponse | null;
    onScheduleChange: (schedule: ScheduleResponse) => void;
    isEditMode: boolean;
    setIsEditMode: (v: boolean) => void;
}

function TeachersEditor({ data, onChange, nextId, schedule, onScheduleChange, isEditMode, setIsEditMode }: TeachersEditorProps) {
    const [viewMode, setViewMode] = useState<'list' | 'details' | 'schedule'>('list');
    const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
    const [editingTeacherCell, setEditingTeacherCell] = useState<{ teacherId: string, day: string, period: number } | null>(null);
    const [draggedLesson, setDraggedLesson] = useState<Lesson | null>(null);
    const [dragOverCell, setDragOverCell] = useState<any>(null);

    const periods = [0, 1, 2, 3, 4, 5, 6, 7];
    const days = ["Пн", "Вт", "Ср", "Чт", "Пт"];
    const apiDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];

    const lessons = useMemo(() =>
        (schedule?.status === 'success' || schedule?.status === 'conflict') ? schedule.schedule : [],
        [schedule]);

    const getSubjectColor = (subjectId: string) => {
        const subject = data.subjects.find(s => s.id === subjectId);
        if (subject?.color) return subject.color;
        const palette = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
        const index = data.subjects.findIndex(s => s.id === subjectId);
        return palette[index % palette.length] || '#6366f1';
    };

    const getConflicts = (teacherId: string, day: string, period: number, excludeClassId?: string): string[] => {
        return lessons
            .filter(l =>
                l.teacher_id === teacherId &&
                l.day === day &&
                l.period === period &&
                l.class_id !== excludeClassId
            )
            .map(l => data.classes.find(c => c.id === l.class_id)?.name || '???');
    };

    const handleSaveTeacherLesson = (classId: string, day: string, period: number, subjectId: string, teacherId: string, room?: string) => {
        if (!schedule) return;
        let updatedLessons = [...lessons];
        updatedLessons = updatedLessons.filter(l => !(l.teacher_id === teacherId && l.day === day && l.period === period && l.class_id === classId));
        if (subjectId && teacherId && classId) {
            updatedLessons.push({ class_id: classId, subject_id: subjectId, teacher_id: teacherId, day, period, room });
        }
        onScheduleChange({ ...schedule, schedule: updatedLessons } as any);
        setEditingTeacherCell(null);
    };

    const processTeacherDrop = (targetTeacherId: string, targetDay: string, targetPeriod: number) => {
        if (!draggedLesson || !schedule) return;
        let updatedLessons = [...lessons].filter(l => !(l.class_id === draggedLesson.class_id && l.day === draggedLesson.day && l.period === draggedLesson.period));
        updatedLessons.push({ ...draggedLesson, teacher_id: targetTeacherId, day: targetDay, period: targetPeriod });
        onScheduleChange({ ...schedule, schedule: updatedLessons } as any);
        setDraggedLesson(null);
        setDragOverCell(null);
    };

    const [name, setName] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [photo, setPhoto] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [editingSubjects, setEditingSubjects] = useState<string[]>([]);
    const [editingPhoto, setEditingPhoto] = useState<string | null>(null);
    const [is_primary, setIsPrimary] = useState(false);
    const [editingIsPrimary, setEditingIsPrimary] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            if (isEditing) setEditingPhoto(result);
            else setPhoto(result);
        };
        reader.readAsDataURL(file);
    };

    const handleAdd = () => {
        if (!name.trim()) return;
        onChange({
            ...data,
            teachers: [...data.teachers, { id: nextId(), name: name.trim(), subjects: selectedSubjects, is_primary, photo: photo || undefined }]
        });
        setName('');
        setSelectedSubjects([]);
        setIsPrimary(false);
        setPhoto(null);
    };

    const handleSaveEdit = () => {
        if (!editingId || !editingName.trim()) return;
        onChange({
            ...data,
            teachers: data.teachers.map(t => t.id === editingId ? { ...t, name: editingName.trim(), subjects: editingSubjects, is_primary: editingIsPrimary, photo: editingPhoto || undefined } : t)
        });
        setEditingId(null);
        setEditingPhoto(null);
    };

    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (!deleteId) return;
        onChange({
            ...data,
            teachers: data.teachers.filter(t => t.id !== deleteId),
            plan: data.plan.filter(p => p.teacher_id !== deleteId)
        });
        setDeleteId(null);
    };

    const filteredTeachers = useMemo(() =>
        [...data.teachers].sort((a, b) => a.name.localeCompare(b.name, 'uk')).filter(t =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase())
        ), [data.teachers, searchQuery]);

    if (selectedTeacherId) {
        const teacher = data.teachers.find(t => t.id === selectedTeacherId);
        if (teacher) {
            return (
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => { setSelectedTeacherId(null); setViewMode('list'); }}
                            className="flex items-center gap-2 text-[#a1a1aa] hover:text-white transition-colors font-black text-[10px] uppercase tracking-widest group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Назад до списку вчителів
                        </button>

                        <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
                            <button
                                onClick={() => setViewMode('details')}
                                className={cn(
                                    "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    viewMode === 'details' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-[#a1a1aa] hover:text-white"
                                )}
                            >
                                Статистика
                            </button>
                            <button
                                onClick={() => setViewMode('schedule')}
                                className={cn(
                                    "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    viewMode === 'schedule' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "text-[#a1a1aa] hover:text-white"
                                )}
                            >
                                Розклад
                            </button>
                        </div>
                    </div>

                    {viewMode === 'details' ? (
                        <TeacherDetails data={data} key={teacher.id} teacherId={teacher.id} />
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between bg-white/5 p-6 rounded-3xl border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black border border-emerald-500/10">
                                        {teacher.name.slice(0, 1).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white">{teacher.name}</h3>
                                        <p className="text-xs font-bold text-[#a1a1aa] uppercase tracking-widest">Персональний розклад</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsEditMode(!isEditMode)}
                                        className={cn(
                                            "flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2",
                                            isEditMode ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400" : "bg-white/5 border-white/10 text-[#a1a1aa] hover:bg-white/10"
                                        )}
                                    >
                                        {isEditMode ? "Редагування УВІМК." : "Редагування ВИМК."}
                                    </button>
                                </div>
                            </div>

                            {/* Schedule Component */}
                            <div className="h-[600px] border border-white/5 rounded-[32px] overflow-hidden">
                                <CompactTeacherSchedule
                                    data={{ ...data, teachers: data.teachers.filter(t => t.id === selectedTeacherId) }}
                                    lessons={lessons}
                                    periods={periods}
                                    apiDays={apiDays}
                                    days={days}
                                    getSubjectColor={getSubjectColor}
                                    getConflicts={getConflicts}
                                    isEditMode={isEditMode}
                                    onCellClick={(tId, d, p) => setEditingTeacherCell({ teacherId: tId, day: d, period: p })}
                                    draggedLesson={draggedLesson}
                                    setDraggedLesson={setDraggedLesson}
                                    dragOverCell={dragOverCell}
                                    setDragOverCell={setDragOverCell}
                                    processTeacherDrop={processTeacherDrop}
                                    perfSettings={{
                                        disableAnimations: false,
                                        hidePhotos: false,
                                        lowFrequencyClock: false,
                                        disableBlur: false,
                                        disableShadows: false
                                    }}
                                    getClassConflicts={() => []}
                                    hoveredLesson={null}
                                    setHoveredLesson={() => { }}
                                />
                            </div>

                            {editingTeacherCell && (
                                <TeacherEditModal
                                    data={data}
                                    schedule={lessons}
                                    teacherId={editingTeacherCell.teacherId}
                                    day={editingTeacherCell.day}
                                    period={editingTeacherCell.period}
                                    onSave={handleSaveTeacherLesson}
                                    onClose={() => setEditingTeacherCell(null)}
                                />
                            )}
                        </div>
                    )}
                </div>
            );
        }
    }

    return (
        <div className="space-y-8">
            {/* Add Form */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 p-4 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none">
                    <Users size={160} />
                </div>
                <h3 className="font-black text-white mb-6 flex items-center gap-2 uppercase tracking-widest text-xs">
                    Додати вчителя
                </h3>
                <div className="space-y-6">
                    <div className="flex gap-4 items-start">
                        <div className="flex flex-col gap-3 flex-1">
                            <input
                                placeholder="Ім'я вчителя"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                className="flex-1 px-5 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-white placeholder:text-white/20 transition-all"
                            />
                            <div className="flex items-center gap-3">
                                <label className="cursor-pointer group/upload">
                                    <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, false)} />
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-[#a1a1aa] group-hover/upload:bg-white/10 group-hover/upload:text-white transition-all">
                                        {photo ? <Check size={14} className="text-emerald-500" /> : <Plus size={14} />}
                                        {photo ? 'Фото завантажено' : 'Завантажити фото'}
                                    </div>
                                </label>
                                {photo && (
                                    <button onClick={() => setPhoto(null)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"><X size={14} /></button>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleAdd}
                            disabled={!name.trim()}
                            className="btn-premium from-emerald-500 to-teal-600 flex items-center gap-2 whitespace-nowrap shadow-emerald-500/20"
                        >
                            <Plus size={20} /> Додати
                        </button>
                    </div>

                    <button
                        onClick={() => setIsPrimary(!is_primary)}
                        className={cn(
                            "w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300",
                            is_primary
                                ? "bg-emerald-500/20 border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                                : "bg-white/5 border-white/10 hover:bg-white/10"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", is_primary ? "bg-emerald-500 border-emerald-500" : "border-white/20")}>
                                {is_primary && <Check size={14} className="text-white" />}
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-white text-sm">Вчитель початкових класів</div>
                                <div className="text-[10px] text-[#a1a1aa] font-medium">Може викладати будь-який предмет для 1-4 класів</div>
                            </div>
                        </div>
                    </button>

                    <div>
                        <label className="block text-[10px] font-black text-[#a1a1aa] mb-3 uppercase tracking-widest">Дисципліни:</label>
                        <div className="flex flex-wrap gap-2">
                            {data.subjects.length > 0 ? getSortedSubjects(data.subjects).map(sub => (
                                <button
                                    key={sub.id}
                                    onClick={() => setSelectedSubjects(prev => prev.includes(sub.id) ? prev.filter(s => s !== sub.id) : [...prev, sub.id])}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-300",
                                        selectedSubjects.includes(sub.id)
                                            ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                                            : "bg-white/5 border-white/10 text-[#a1a1aa] hover:border-emerald-500/50"
                                    )}
                                >
                                    {sub.name}
                                </button>
                            )) : <span className="text-sm text-white/30">Спочатку додайте предмети</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-400 transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Пошук вчителів..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-white placeholder:text-white/20 transition-all"
                />
            </div>

            {/* List */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredTeachers.map(teacher => {
                    const isEditing = editingId === teacher.id;
                    const hours = data.plan.filter(p => p.teacher_id === teacher.id).reduce((acc, p) => acc + p.hours_per_week, 0);

                    return (
                        <div key={teacher.id} className={cn(
                            "bento-card p-6 border-white/5 transition-all duration-300 group relative overflow-hidden",
                            isEditing ? "ring-2 ring-emerald-500 bg-emerald-500/10 shadow-2xl shadow-emerald-500/10" : "bg-white/[0.04] hover:bg-white/[0.08]"
                        )}>
                            <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700 pointer-events-none">
                                <Users size={160} />
                            </div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-[24px] flex items-center justify-center font-black overflow-hidden border border-white/10 shadow-xl group-hover:scale-110 transition-transform">
                                        {teacher.photo ? (
                                            <img src={teacher.photo} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <span className="text-2xl">{teacher.name.slice(0, 1).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="flex gap-1.5">
                                        {isEditing ? (
                                            <>
                                                <button onClick={handleSaveEdit} className="p-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 shadow-lg shadow-green-500/20"><Check size={18} /></button>
                                                <button onClick={() => setEditingId(null)} className="p-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-lg shadow-red-500/20"><X size={18} /></button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setSelectedTeacherId(teacher.id);
                                                        setViewMode('details');
                                                    }}
                                                    className="p-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 transition-all"
                                                    title="Статистика та розклад"
                                                >
                                                    <ClipboardList size={18} />
                                                </button>
                                                <button onClick={() => { setEditingId(teacher.id); setEditingName(teacher.name); setEditingSubjects(teacher.subjects); setEditingIsPrimary(teacher.is_primary || false); setEditingPhoto(teacher.photo || null); }} className="p-2.5 bg-white/5 text-[#a1a1aa] rounded-xl hover:bg-white/10 hover:text-white transition-all opacity-0 group-hover:opacity-100"><Pencil size={18} /></button>
                                                <button onClick={() => handleDelete(teacher.id)} className="p-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {isEditing ? (
                                    <div className="space-y-4">
                                        <input
                                            value={editingName}
                                            onChange={e => setEditingName(e.target.value)}
                                            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl focus:border-emerald-500 outline-none font-black text-white text-xl"
                                            placeholder="Прізвище І.О."
                                        />
                                        <div className="space-y-3">
                                            <label className="block text-[10px] font-black text-[#a1a1aa] uppercase tracking-[0.2em]">Дисципліни</label>
                                            <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                                                {data.subjects.map(sub => (
                                                    <button
                                                        key={sub.id}
                                                        onClick={() => setEditingSubjects(prev => prev.includes(sub.id) ? prev.filter(s => s !== sub.id) : [...prev, sub.id])}
                                                        className={cn(
                                                            "px-3 py-2 rounded-xl text-[10px] font-bold border transition-all text-left",
                                                            editingSubjects.includes(sub.id) ? "bg-emerald-500 border-emerald-400 text-white" : "bg-white/5 border-white/10 text-[#a1a1aa]"
                                                        )}
                                                    >
                                                        {sub.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-3xl font-black text-white tracking-tighter mb-4 leading-[1.1]">
                                            {teacher.name.split(' ').map((p, i) => <div key={i}>{p}</div>)}
                                        </div>

                                        <div className="space-y-3 mt-auto">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">Load</span>
                                                <span className={cn("text-xs font-black", hours > 30 ? "text-red-400" : "text-emerald-400")}>{hours}h / week</span>
                                            </div>
                                            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                                                <div
                                                    className={cn("h-full rounded-full transition-all duration-1000 delay-100", hours > 30 ? "bg-red-500" : "bg-emerald-500")}
                                                    style={{ width: `${Math.min(hours / 35 * 100, 100)}%` }}
                                                />
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {teacher.subjects.slice(0, 3).map(sid => (
                                                    <span key={sid} className="px-2 py-0.5 bg-white/5 text-[9px] font-black text-[#a1a1aa] rounded-md border border-white/5 uppercase">
                                                        {data.subjects.find(s => s.id === sid)?.name.slice(0, 6) || sid}
                                                    </span>
                                                ))}
                                                {teacher.subjects.length > 3 && <span className="text-[9px] font-black text-white/20">+{teacher.subjects.length - 3}</span>}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
                {filteredTeachers.length === 0 && (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border-2 border-dashed border-white/5">
                        <Users size={48} className="mx-auto mb-4 text-white/10" />
                        <p className="font-black text-white/30 uppercase tracking-widest text-sm">
                            {searchQuery ? 'Вчителів не знайдено' : 'Вчителі ще не додані'}
                        </p>
                    </div>
                )}
            </div>
            <ConfirmationModal
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Видалити вчителя?"
                description={`Ви впевнені, що хочете видалити вчителя "${data.teachers.find(t => t.id === deleteId)?.name}"?`}
            />
        </div>
    );
}

// --- Classes Editor ---
interface ClassesEditorProps {
    data: ScheduleRequest;
    onChange: (data: ScheduleRequest) => void;
}

function ClassesEditor({ data, onChange }: ClassesEditorProps) {
    const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
    const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
    const [viewingClassId, setViewingClassId] = useState<string | null>(null);
    const [editingPlanSubjectId, setEditingPlanSubjectId] = useState<string | null>(null);
    const [tempTeacherId, setTempTeacherId] = useState('');
    const [tempHours, setTempHours] = useState(1);

    const grades = Array.from({ length: 11 }, (_, i) => (i + 1).toString());
    const letters = ['А', 'Б', 'В', 'Г', 'Д'];

    const viewingClass = data.classes.find(c => c.id === viewingClassId);
    const classPlan = data.plan.filter(p => p.class_id === viewingClassId);

    const getNextId = (items: { id: string }[]) => {
        const ids = items.map(i => parseInt(i.id)).filter(id => !isNaN(id));
        return ids.length === 0 ? "1" : (Math.max(...ids) + 1).toString();
    };

    const handleAdd = () => {
        if (!selectedGrade || selectedLetters.length === 0) return;
        let newClasses = [...data.classes];
        selectedLetters.forEach(letter => {
            const className = `${selectedGrade}-${letter}`;
            if (!newClasses.some(c => c.name === className)) {
                newClasses.push({ id: getNextId(newClasses), name: className });
            }
        });
        onChange({ ...data, classes: newClasses });
        setSelectedLetters([]);
    };

    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (!deleteId) return;
        onChange({
            ...data,
            classes: data.classes.filter(c => c.id !== deleteId),
            plan: data.plan.filter(p => p.class_id !== deleteId)
        });
        setDeleteId(null);
    };

    const handleSavePlanEdit = (subjectId: string) => {
        if (!viewingClassId) return;
        let newPlan = [...data.plan];
        const existingIdx = newPlan.findIndex(p => p.class_id === viewingClassId && p.subject_id === subjectId);

        if (tempHours <= 0) {
            if (existingIdx !== -1) newPlan.splice(existingIdx, 1);
        } else if (tempTeacherId) {
            const newItem = { class_id: viewingClassId, subject_id: subjectId, teacher_id: tempTeacherId, hours_per_week: tempHours };
            if (existingIdx !== -1) newPlan[existingIdx] = newItem;
            else newPlan.push(newItem);
        }
        onChange({ ...data, plan: newPlan });
        setEditingPlanSubjectId(null);
    };

    if (viewingClassId && viewingClass) {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between bg-white/5 p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute -top-12 -right-12 p-4 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none">
                        <GraduationCap size={160} />
                    </div>
                    <div className="flex items-center gap-5">
                        <button onClick={() => setViewingClassId(null)} className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h3 className="text-3xl font-black text-white tracking-tight">Клас {viewingClass.name}</h3>
                            <p className="text-sm font-black text-[#a1a1aa] uppercase tracking-widest">Навчальний план</p>
                        </div>
                    </div>
                    <div className="bg-violet-500/20 text-violet-400 px-5 py-2 rounded-xl text-lg font-black border border-violet-500/10">
                        {classPlan.reduce((acc, p) => acc + p.hours_per_week, 0)} год/тиждень
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getSortedSubjects(data.subjects).map(subject => {
                        const planItem = classPlan.find(p => p.subject_id === subject.id);
                        const teacher = planItem ? data.teachers.find(t => t.id === planItem.teacher_id) : null;
                        const isEditing = editingPlanSubjectId === subject.id;

                        const grade = parseInt(viewingClass.name);
                        const isPrimaryGrade = !isNaN(grade) && grade >= 1 && grade <= 4;

                        const subjectTeachers = data.teachers.filter(t => {
                            if (t.subjects.includes(subject.id)) return true;
                            if (isPrimaryGrade && t.is_primary) return true;
                            return false;
                        });

                        return (
                            <div key={subject.id} className={cn(
                                "bento-card p-5 border-white/5 transition-all duration-300",
                                isEditing ? "ring-2 ring-violet-500/50 bg-white/5" : planItem ? "bg-white/[0.04]" : "bg-white/[0.01] opacity-50"
                            )}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg",
                                            planItem ? "bg-violet-500/20 text-violet-400" : "bg-white/5 text-white/20"
                                        )}>
                                            {planItem?.hours_per_week || 0}
                                        </div>
                                        <div>
                                            <div className="font-black text-white text-lg tracking-tight">{subject.name}</div>
                                            {isEditing ? (
                                                <div className="flex gap-2 mt-3">
                                                    <select value={tempTeacherId} onChange={e => setTempTeacherId(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg text-sm font-bold text-white px-3 py-1 outline-none focus:ring-1 focus:ring-violet-500 max-w-[150px]">
                                                        <option value="" className="bg-[#18181b]">Вчитель</option>
                                                        {subjectTeachers.map(t => (
                                                            <option key={t.id} value={t.id} className="bg-[#18181b]">
                                                                {t.name} {t.is_primary && !t.subjects.includes(subject.id) ? "(Поч.)" : ""}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <input type="number" min={0} value={tempHours} onChange={e => setTempHours(parseInt(e.target.value) || 0)} className="w-16 bg-white/5 border border-white/10 rounded-lg text-sm font-bold text-white px-2 py-1 outline-none text-center focus:ring-1 focus:ring-violet-500" />
                                                </div>
                                            ) : (
                                                <div className="text-xs text-[#a1a1aa] font-black uppercase tracking-widest">{teacher?.name || 'Вчителя не призначено'}</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {isEditing ? (
                                            <>
                                                <button onClick={() => handleSavePlanEdit(subject.id)} className="p-2 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-all"><Check size={20} /></button>
                                                <button onClick={() => setEditingPlanSubjectId(null)} className="p-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all"><X size={20} /></button>
                                            </>
                                        ) : (
                                            <button onClick={() => { setEditingPlanSubjectId(subject.id); setTempTeacherId(planItem?.teacher_id || ''); setTempHours(planItem?.hours_per_week || 1); }} className="p-2 bg-white/5 text-[#a1a1aa] rounded-xl hover:bg-white/10 hover:text-white transition-all"><Pencil size={18} /></button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Add Form */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 p-4 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none">
                    <GraduationCap size={160} />
                </div>
                <h3 className="font-black text-white mb-6 flex items-center gap-2 uppercase tracking-widest text-xs">
                    Додати класи
                </h3>
                <div className="space-y-8">
                    <div>
                        <label className="block text-[10px] font-black text-[#a1a1aa] mb-4 uppercase tracking-widest">ПАРАЛЕЛЬ:</label>
                        <div className="flex flex-wrap gap-2">
                            {grades.map(grade => (
                                <button
                                    key={grade}
                                    onClick={() => setSelectedGrade(grade)}
                                    className={cn(
                                        "w-12 h-12 rounded-xl font-black text-lg transition-all duration-300 border-2",
                                        selectedGrade === grade
                                            ? "bg-violet-500 border-violet-400 text-white shadow-lg shadow-violet-500/20"
                                            : "bg-white/5 border-white/5 text-[#a1a1aa] hover:border-violet-500/50"
                                    )}
                                >
                                    {grade}
                                </button>
                            ))}
                        </div>
                    </div>
                    {selectedGrade && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                            <label className="block text-[10px] font-black text-[#a1a1aa] mb-4 uppercase tracking-widest">ЛІТЕРИ:</label>
                            <div className="flex gap-2">
                                {letters.map(letter => (
                                    <button
                                        key={letter}
                                        onClick={() => setSelectedLetters(prev => prev.includes(letter) ? prev.filter(l => l !== letter) : [...prev, letter])}
                                        className={cn(
                                            "w-12 h-12 rounded-full font-black text-lg transition-all duration-300 border-2",
                                            selectedLetters.includes(letter)
                                                ? "bg-violet-500/20 border-violet-400 text-violet-400 shadow-lg"
                                                : "bg-white/5 border-white/5 text-white/20 hover:border-violet-500/50"
                                        )}
                                    >
                                        {letter}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleAdd}
                        disabled={!selectedGrade || selectedLetters.length === 0}
                        className="btn-premium from-violet-500 to-purple-600 w-full flex items-center justify-center gap-2 shadow-violet-500/20 py-4"
                    >
                        <Plus size={20} /> Додати {selectedLetters.length > 0 ? `${selectedGrade}-${selectedLetters.join(', ')}` : 'класи'}
                    </button>
                </div>
            </div>

            {/* Class Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {getSortedClasses(data.classes).map(cls => {
                    const hours = data.plan.filter(p => p.class_id === cls.id).reduce((acc, p) => acc + p.hours_per_week, 0);
                    const subjectsCount = data.plan.filter(p => p.class_id === cls.id).length;

                    return (
                        <div key={cls.id} className="bento-card p-6 border-white/5 hover:bg-white/[0.04] transition-all group cursor-pointer relative overflow-hidden" onClick={() => setViewingClassId(cls.id)}>
                            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform">
                                <ClipboardList size={60} />
                            </div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="text-4xl font-black text-white tracking-tighter">{cls.name}</div>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(cls.id); }} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">
                                    <span>Годин / Тиждень</span>
                                    <span className={cn(hours > 30 ? "text-red-400" : "text-violet-400")}>{hours}</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">
                                    <span>Предметів</span>
                                    <span className="text-white">{subjectsCount}</span>
                                </div>
                            </div>

                            <div className="mt-4 w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-500", hours > 30 ? "bg-red-500" : "bg-violet-500")}
                                    style={{ width: `${Math.min(hours / 35 * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
            {data.classes.length === 0 && (
                <div className="text-center py-20 bg-white/5 rounded-3xl border-2 border-dashed border-white/5">
                    <GraduationCap size={48} className="mx-auto mb-4 text-white/10" />
                    <p className="font-black text-white/30 uppercase tracking-widest text-sm">Класи ще не додані</p>
                </div>
            )}
            <ConfirmationModal
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Видалити клас?"
                description={`Ви впевнені, що хочете видалити клас "${data.classes.find(c => c.id === deleteId)?.name}"? Це також видалить весь його навчальний план.`}
            />
        </div>
    );
}

// --- Plan Editor ---
interface PlanEditorProps {
    data: ScheduleRequest;
    onChange: (data: ScheduleRequest) => void;
}

function PlanEditor({ data, onChange }: PlanEditorProps) {
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const selectedClass = data.classes.find(c => c.id === selectedClassId);

    // Sort classes by name
    const sortedClasses = useMemo(() =>
        getSortedClasses(data.classes).filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase())
        ), [data.classes, searchQuery]);

    // Plan editing logic
    // Plan editing logic
    const handleUpdatePlan = (classId: string, subjectId: string, teacherId: string, hours: number, room?: string) => {
        let newPlan = [...data.plan];
        const existingIndex = newPlan.findIndex(p => p.class_id === classId && p.subject_id === subjectId);

        if (hours <= 0) {
            // Remove entry
            if (existingIndex !== -1) newPlan.splice(existingIndex, 1);
        } else {
            // Add or Update
            // If room is not provided but exists in previous item, keep it? 
            // Better to pass everything explicitly. 
            // If room is undefined, check if we should keep existing room. 
            // Here we assume 'room' arg is the CURRENT value we want.
            const newItem = {
                class_id: classId,
                subject_id: subjectId,
                teacher_id: teacherId,
                hours_per_week: hours,
                room: room
            };

            if (existingIndex !== -1) {
                // Determine room: if passed explicitly, use it. If undefined (e.g. valid update of hours), preserve existing. 
                // However, the caller should pass the current room if they don't want to change it.
                // Let's assume the UI passes full state.
                newPlan[existingIndex] = { ...newPlan[existingIndex], ...newItem };
            } else {
                newPlan.push(newItem);
            }
        }
        onChange({ ...data, plan: newPlan });
    };

    // View 1: Class Selection Grid
    if (!selectedClass) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-white">Навчальний План</h2>
                        <p className="text-[#a1a1aa] font-medium mt-1">Оберіть клас для редагування навантаження</p>
                    </div>
                    <div className="relative group w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-amber-400 transition-colors" size={20} />
                        <input type="text" placeholder="Пошук класу..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-amber-500 transition-all" />
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {sortedClasses.map(cls => {
                        const hours = data.plan.filter(p => p.class_id === cls.id).reduce((acc, p) => acc + p.hours_per_week, 0);
                        const subjectsCount = data.plan.filter(p => p.class_id === cls.id).length;

                        return (
                            <button
                                key={cls.id}
                                onClick={() => setSelectedClassId(cls.id)}
                                className="bento-card p-6 border-white/5 hover:bg-white/[0.04] transition-all group text-left relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform">
                                    <ClipboardList size={60} />
                                </div>
                                <div className="text-3xl font-black text-white tracking-tighter mb-2">{cls.name}</div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs font-bold text-[#a1a1aa]">
                                        <span>ГОДИН</span>
                                        <span className={cn(hours > 30 ? "text-red-400" : "text-amber-400")}>{hours}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs font-bold text-[#a1a1aa]">
                                        <span>ПРЕДМЕТІВ</span>
                                        <span className="text-white">{subjectsCount}</span>
                                    </div>
                                </div>
                                <div className="mt-4 w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                    <div className={cn("h-full rounded-full", hours > 30 ? "bg-red-500" : "bg-amber-500")} style={{ width: `${Math.min(hours / 35 * 100, 100)}%` }} />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // View 2: Class Details (Matrix)
    const grade = parseInt(selectedClass.name);
    const isPrimaryGrade = !isNaN(grade) && grade >= 1 && grade <= 4;
    const sortedSubjects = getSortedSubjects(data.subjects);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between bg-white/5 p-6 rounded-2xl border border-white/5">
                <div className="flex items-center gap-6">
                    <button onClick={() => setSelectedClassId(null)} className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all group">
                        <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h3 className="text-3xl font-black text-white tracking-tight">Клас {selectedClass.name}</h3>
                        <p className="text-sm font-bold text-[#a1a1aa] uppercase tracking-widest mt-1">Редагування плану</p>
                    </div>
                </div>
                <div className="bg-amber-500/10 text-amber-500 px-6 py-3 rounded-xl border border-amber-500/20 text-right">
                    <div className="text-2xl font-black">
                        {data.plan.filter(p => p.class_id === selectedClassId).reduce((acc, p) => acc + p.hours_per_week, 0)}
                    </div>
                    <div className="text-[10px] uppercase font-black tracking-wider opacity-70">Годин на тиждень</div>
                </div>
            </div>

            {/* Matrix */}
            <div className="grid grid-cols-1 gap-3">
                {sortedSubjects.map(subject => {
                    const planItem = data.plan.find(p => p.class_id === selectedClassId && p.subject_id === subject.id);
                    const hours = planItem?.hours_per_week || 0;
                    const teacherId = planItem?.teacher_id || "";
                    const room = planItem?.room || "";
                    const active = hours > 0;
                    const color = subject.color || "#f59e0b"; // Default amber-500

                    // Filter teachers relevant for this subject + grade
                    const relevantTeachers = data.teachers.filter(t => {
                        if (t.subjects.includes(subject.id)) return true; // Specialist
                        if (isPrimaryGrade && t.is_primary) return true; // Primary generalist
                        return false;
                    });

                    return (
                        <div key={subject.id}
                            className={cn(
                                "flex items-center gap-4 p-4 rounded-xl border transition-all duration-200",
                                !active && "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] opacity-70 hover:opacity-100"
                            )}
                            style={active ? {
                                backgroundColor: `${color}10`, // 10% opacity
                                borderColor: `${color}30`,
                                boxShadow: `0 0 15px -3px ${color}20`
                            } : undefined}
                        >
                            {/* Subject Info */}
                            <div className="w-1/3 flex items-center gap-4">
                                <div
                                    className="w-3 h-12 rounded-full"
                                    style={{ backgroundColor: active ? color : 'rgba(255,255,255,0.1)' }}
                                />
                                <div>
                                    <div
                                        className="font-bold text-lg"
                                        style={{ color: active ? 'white' : 'rgba(255,255,255,0.6)' }}
                                    >
                                        {subject.name}
                                    </div>
                                    <div className="text-xs font-medium text-[#a1a1aa]">
                                        {subject.defaultRoom ? `Стандартний каб. ${subject.defaultRoom}` : 'Без стандартного кабінету'}
                                    </div>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex-1 flex items-center gap-4 justify-end">
                                {/* Room Input */}
                                <input
                                    type="text"
                                    placeholder={subject.defaultRoom || "Каб."}
                                    value={room}
                                    onChange={(e) => handleUpdatePlan(selectedClassId!, subject.id, teacherId || relevantTeachers[0]?.id || "", hours || 1, e.target.value)}
                                    className={cn(
                                        "bg-[#0f0f11] border rounded-lg text-sm font-bold px-3 py-2 outline-none transition-all w-24 text-center",
                                        active ? "text-white" : "border-white/10 text-[#a1a1aa]"
                                    )}
                                    style={active ? { borderColor: `${color}50` } : undefined}
                                />

                                {/* Teacher Selector */}
                                <select
                                    value={teacherId}
                                    onChange={(e) => handleUpdatePlan(selectedClassId!, subject.id, e.target.value, hours || 1, room)}
                                    className={cn(
                                        "bg-[#0f0f11] border rounded-lg text-sm font-bold px-3 py-2 outline-none transition-all w-64",
                                        active ? "text-white" : "border-white/10 text-[#a1a1aa]"
                                    )}
                                    style={active ? { borderColor: `${color}50` } : undefined}
                                >
                                    <option value="">-- Оберіть вчителя --</option>
                                    {relevantTeachers.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} {t.is_primary && !t.subjects.includes(subject.id) ? "(Поч.)" : ""}
                                        </option>
                                    ))}
                                </select>

                                {/* Hours Stepper */}
                                <div className="flex items-center gap-2 bg-[#0f0f11] p-1 rounded-lg border border-white/10">
                                    <button
                                        onClick={() => handleUpdatePlan(selectedClassId!, subject.id, teacherId || relevantTeachers[0]?.id || "", Math.max(0, hours - 1), room)}
                                        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                                    >
                                        -
                                    </button>
                                    <div
                                        className="w-8 text-center font-black text-lg"
                                        style={{ color: active ? color : 'rgba(255,255,255,0.3)' }}
                                    >
                                        {hours}
                                    </div>
                                    <button
                                        onClick={() => handleUpdatePlan(selectedClassId!, subject.id, teacherId || relevantTeachers[0]?.id || "", hours + 1, room)}
                                        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {sortedSubjects.length === 0 && (
                <div className="text-center py-20 bg-white/5 rounded-3xl border-2 border-dashed border-white/5">
                    <BookOpen size={48} className="mx-auto mb-4 text-white/10" />
                    <p className="font-black text-white/30 uppercase tracking-widest text-sm">Предмети відсутні. Додайте їх у вкладці "Предмети"</p>
                </div>
            )}
        </div>
    );
}
