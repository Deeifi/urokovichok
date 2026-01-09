import { useState, useMemo } from 'react';
import type { ScheduleRequest, Subject, ClassGroup } from '../types';
import { Plus, Trash2, Check, X, Pencil, ArrowLeft, BookOpen, Users, GraduationCap, ClipboardList, Search, ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';

interface DataEntryProps {
    data: ScheduleRequest;
    onChange: (data: ScheduleRequest) => void;
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

export function DataEntry({ data, onChange }: DataEntryProps) {
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
                    {section === 'teachers' && <TeachersEditor data={data} onChange={onChange} nextId={() => getNextId(data.teachers)} />}
                    {section === 'classes' && <ClassesEditor data={data} onChange={onChange} />}
                    {section === 'plan' && <PlanEditor data={data} onChange={onChange} />}
                </div>
            </div>
        </div>
    );
}

// --- Subjects Editor ---
function SubjectsEditor({ data, onChange, nextId }: DataEntryProps & { nextId: () => string }) {
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

    const handleDelete = (id: string) => {
        onChange({
            ...data,
            subjects: data.subjects.filter(s => s.id !== id),
            teachers: data.teachers.map(t => ({ ...t, subjects: t.subjects.filter(sid => sid !== id) })),
            plan: data.plan.filter(p => p.subject_id !== id)
        });
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSubjects.map(subject => (
                    <div key={subject.id} className="bg-white/5 hover:bg-white/[0.08] p-5 rounded-2xl border border-white/10 flex items-center justify-between transition-all group">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center font-black text-sm">
                                {subject.id}
                            </div>
                            {editingId === subject.id ? (
                                <div className="space-y-2 flex-1 mr-4">
                                    <input
                                        value={editingName}
                                        onChange={e => setEditingName(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                                        className="px-3 py-1 bg-white/5 border border-indigo-500/50 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-white w-full"
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            value={editingRoom}
                                            onChange={e => setEditingRoom(e.target.value)}
                                            className="w-16 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white"
                                            placeholder="Каб."
                                        />
                                        <input
                                            type="color"
                                            value={editingColor}
                                            onChange={e => setEditingColor(e.target.value)}
                                            className="w-8 h-6 bg-transparent border-none p-0 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="font-bold text-white text-lg flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: subject.color || '#6366f1' }} />
                                        {subject.name}
                                    </div>
                                    <div className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest mt-1">
                                        Кабінет {subject.defaultRoom || '101'}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {editingId === subject.id ? (
                                <>
                                    <button onClick={handleSaveEdit} className="p-2 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors"><Check size={18} /></button>
                                    <button onClick={() => setEditingId(null)} className="p-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"><X size={18} /></button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => {
                                        setEditingId(subject.id);
                                        setEditingName(subject.name);
                                        setEditingColor(subject.color || '#6366f1');
                                        setEditingRoom(subject.defaultRoom || '101');
                                    }} className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl hover:bg-indigo-500/30 transition-colors opacity-0 group-hover:opacity-100">
                                        <Pencil size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(subject.id)} className="p-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
                {filteredSubjects.length === 0 && (
                    <div className="col-span-full text-center py-20 bg-white/5 rounded-3xl border-2 border-dashed border-white/5">
                        <BookOpen size={48} className="mx-auto mb-4 text-white/10" />
                        <p className="font-black text-white/30 uppercase tracking-widest text-sm">
                            {searchQuery ? 'Предметів не знайдено' : 'Предмети ще не додані'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Teachers Editor ---
function TeachersEditor({ data, onChange, nextId }: DataEntryProps & { nextId: () => string }) {
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
    const [expandedId, setExpandedId] = useState<string | null>(null);

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

    const handleDelete = (id: string) => {
        onChange({
            ...data,
            teachers: data.teachers.filter(t => t.id !== id),
            plan: data.plan.filter(p => p.teacher_id !== id)
        });
    };

    const filteredTeachers = useMemo(() =>
        [...data.teachers].sort((a, b) => a.name.localeCompare(b.name, 'uk')).filter(t =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase())
        ), [data.teachers, searchQuery]);

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeachers.map(teacher => {
                    const isExpanded = expandedId === teacher.id;
                    const isEditing = editingId === teacher.id;
                    return (
                        <div key={teacher.id} className={cn(
                            "bento-card border-white/5 overflow-hidden transition-all duration-300 h-fit",
                            isExpanded ? "ring-2 ring-emerald-500/50 bg-white/5" : "bg-white/[0.02] hover:bg-white/[0.04]"
                        )}>
                            <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => !isEditing && setExpandedId(isExpanded ? null : teacher.id)}>
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center font-black overflow-hidden border border-white/5">
                                        {teacher.name.slice(0, 1).toUpperCase()}
                                    </div>
                                    {isEditing ? (
                                        <input
                                            value={editingName}
                                            onChange={e => setEditingName(e.target.value)}
                                            onClick={e => e.stopPropagation()}
                                            className="px-3 py-1 bg-white/5 border border-emerald-500/50 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none font-bold text-white"
                                            autoFocus
                                        />
                                    ) : (
                                        <div>
                                            <div className="font-black text-white text-lg tracking-tight">{teacher.name}</div>
                                            <div className="text-xs text-[#a1a1aa] font-black uppercase tracking-widest flex items-center gap-2">
                                                {teacher.subjects.length} ДИСЦИПЛІН
                                                {teacher.is_primary && (
                                                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-md border border-emerald-500/10">1-4 КЛАСИ</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {isEditing ? (
                                        <>
                                            <button onClick={e => { e.stopPropagation(); handleSaveEdit(); }} className="p-2 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30"><Check size={18} /></button>
                                            <button onClick={e => { e.stopPropagation(); setEditingId(null); }} className="p-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30"><X size={18} /></button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={e => { e.stopPropagation(); setEditingId(teacher.id); setEditingName(teacher.name); setEditingSubjects(teacher.subjects); setEditingIsPrimary(teacher.is_primary || false); setEditingPhoto(teacher.photo || null); }} className="p-2 bg-white/5 text-[#a1a1aa] rounded-xl hover:bg-white/10 hover:text-white transition-all"><Pencil size={18} /></button>
                                            <button onClick={e => { e.stopPropagation(); handleDelete(teacher.id); }} className="p-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all"><Trash2 size={18} /></button>
                                            <ChevronDown className={cn("text-white/20 transition-transform ml-2", isExpanded && "rotate-180 text-emerald-400")} size={20} />
                                        </>
                                    )}
                                </div>
                            </div>
                            {(isExpanded || isEditing) && (
                                <div className="p-4 border-t border-white/5 bg-black/20 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex flex-col sm:flex-row gap-6">
                                        {teacher.photo && !isEditing && (
                                            <div className="flex-shrink-0 flex justify-center sm:block">
                                                <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/10 shadow-xl mt-1">
                                                    <img src={teacher.photo} className="w-full h-full object-cover" alt={teacher.name} />
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-black text-[#a1a1aa] mb-3 uppercase tracking-widest">МОЖЕ ВИКЛАДАТИ:</label>
                                            <div className="flex flex-wrap gap-2">
                                                {isEditing ? data.subjects.map(sub => (
                                                    <button
                                                        key={sub.id}
                                                        onClick={() => setEditingSubjects(prev => prev.includes(sub.id) ? prev.filter(s => s !== sub.id) : [...prev, sub.id])}
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-300",
                                                            editingSubjects.includes(sub.id)
                                                                ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20"
                                                                : "bg-white/5 border-white/10 text-[#a1a1aa] hover:border-emerald-500/50"
                                                        )}
                                                    >
                                                        {sub.name}
                                                    </button>
                                                )) : teacher.subjects.map(sid => {
                                                    const sub = data.subjects.find(s => s.id === sid);
                                                    return <span key={sid} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl text-[11px] font-bold border border-emerald-500/10">{sub?.name || sid}</span>;
                                                })}
                                                {!isEditing && teacher.subjects.length === 0 && <span className="text-sm text-white/20 italic">Немає призначених предметів</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {isEditing && (
                                        <button
                                            onClick={() => setEditingIsPrimary(!editingIsPrimary)}
                                            className={cn(
                                                "w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 mt-4",
                                                editingIsPrimary
                                                    ? "bg-emerald-500/20 border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                                                    : "bg-white/5 border-white/10 hover:bg-white/10"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", editingIsPrimary ? "bg-emerald-500 border-emerald-500" : "border-white/20")}>
                                                    {editingIsPrimary && <Check size={14} className="text-white" />}
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-bold text-white text-sm">Вчитель початкових класів</div>
                                                    <div className="text-[10px] text-[#a1a1aa] font-medium">Може викладати для 1-4 класів</div>
                                                </div>
                                            </div>
                                        </button>
                                    )}

                                    {isEditing && (
                                        <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                                                    {editingPhoto ? (
                                                        <img src={editingPhoto} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <Users size={20} className="text-white/10" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="cursor-pointer group/up">
                                                        <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, true)} />
                                                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] group-hover/up:bg-white/10 group-hover/up:text-white transition-all">
                                                            {editingPhoto ? 'Змінити фото' : 'Додати фото'}
                                                        </div>
                                                    </label>
                                                    {editingPhoto && (
                                                        <button onClick={() => setEditingPhoto(null)} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/20 transition-all">
                                                            <Trash2 size={14} /> Видалити фото
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
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
        </div>
    );
}

// --- Classes Editor ---
function ClassesEditor({ data, onChange }: DataEntryProps) {
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

    const handleDelete = (id: string) => {
        onChange({
            ...data,
            classes: data.classes.filter(c => c.id !== id),
            plan: data.plan.filter(p => p.class_id !== id)
        });
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {getSortedClasses(data.classes).map(cls => (
                    <div key={cls.id} className="bento-card p-5 border-white/5 hover:bg-white/[0.04] transition-all group cursor-pointer" onClick={() => setViewingClassId(cls.id)}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="text-3xl font-black text-white tracking-tighter">{cls.name}</div>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(cls.id); }} className="p-1 text-[#a1a1aa] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                                <Trash2 size={16} />
                            </button>
                        </div>
                        <div className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-tighter">
                            {data.plan.filter(p => p.class_id === cls.id).reduce((a, p) => a + p.hours_per_week, 0)} ГОД / ТИЖД
                        </div>
                    </div>
                ))}
            </div>
            {data.classes.length === 0 && (
                <div className="text-center py-20 bg-white/5 rounded-3xl border-2 border-dashed border-white/5">
                    <GraduationCap size={48} className="mx-auto mb-4 text-white/10" />
                    <p className="font-black text-white/30 uppercase tracking-widest text-sm">Класи ще не додані</p>
                </div>
            )}
        </div>
    );
}

// --- Plan Editor ---
function PlanEditor({ data, onChange }: DataEntryProps) {
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const selectedClass = data.classes.find(c => c.id === selectedClassId);

    // Sort classes by name
    const sortedClasses = useMemo(() =>
        getSortedClasses(data.classes).filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase())
        ), [data.classes, searchQuery]);

    // Plan editing logic
    const handleUpdatePlan = (classId: string, subjectId: string, teacherId: string, hours: number) => {
        let newPlan = [...data.plan];
        const existingIndex = newPlan.findIndex(p => p.class_id === classId && p.subject_id === subjectId);

        if (hours <= 0) {
            // Remove entry
            if (existingIndex !== -1) newPlan.splice(existingIndex, 1);
        } else {
            // Add or Update
            const newItem = { class_id: classId, subject_id: subjectId, teacher_id: teacherId, hours_per_week: hours };
            if (existingIndex !== -1) {
                newPlan[existingIndex] = newItem;
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
                    const active = hours > 0;

                    // Filter teachers relevant for this subject + grade
                    const relevantTeachers = data.teachers.filter(t => {
                        if (t.subjects.includes(subject.id)) return true; // Specialist
                        if (isPrimaryGrade && t.is_primary) return true; // Primary generalist
                        return false;
                    });

                    return (
                        <div key={subject.id} className={cn(
                            "flex items-center gap-4 p-4 rounded-xl border transition-all duration-200",
                            active
                                ? "bg-amber-500/5 border-amber-500/20 shadow-[0_0_15px_-3px_rgba(245,158,11,0.1)]"
                                : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] opacity-70 hover:opacity-100"
                        )}>
                            {/* Subject Info */}
                            <div className="w-1/3 flex items-center gap-4">
                                <div className={cn(
                                    "w-3 h-12 rounded-full",
                                    active ? "bg-amber-500" : "bg-white/10"
                                )} />
                                <div>
                                    <div className={cn("font-bold text-lg", active ? "text-white" : "text-white/60")}>
                                        {subject.name}
                                    </div>
                                    <div className="text-xs font-medium text-[#a1a1aa]">
                                        {subject.defaultRoom ? `Каб. ${subject.defaultRoom}` : 'Без кабінету'}
                                    </div>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex-1 flex items-center gap-4 justify-end">
                                {/* Teacher Selector */}
                                <select
                                    value={teacherId}
                                    onChange={(e) => handleUpdatePlan(selectedClassId!, subject.id, e.target.value, hours || 1)}
                                    className={cn(
                                        "bg-[#0f0f11] border rounded-lg text-sm font-bold px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500 transition-all w-64",
                                        active ? "border-amber-500/30 text-white" : "border-white/10 text-[#a1a1aa]"
                                    )}
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
                                        onClick={() => handleUpdatePlan(selectedClassId!, subject.id, teacherId || relevantTeachers[0]?.id || "", Math.max(0, hours - 1))}
                                        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                                    >
                                        -
                                    </button>
                                    <div className={cn("w-8 text-center font-black text-lg", active ? "text-amber-500" : "text-white/30")}>
                                        {hours}
                                    </div>
                                    <button
                                        onClick={() => handleUpdatePlan(selectedClassId!, subject.id, teacherId || relevantTeachers[0]?.id || "", hours + 1)}
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
