import { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ScheduleRequest, Subject, ClassGroup, ScheduleResponse } from '../types';
import {
    Plus, Trash2, Check, X, Pencil, ArrowLeft, Users, ClipboardList, Search, BookOpen, GraduationCap,
    LayoutGrid, List, Filter, Clock, GripVertical, Minimize2, Lock,
    Calculator, FlaskConical, Languages, Book, Library, Globe2, Divide, Shapes, Dna, Atom, Map,
    Scroll, Landmark, Users2, Palette, Hammer, Cpu, HeartPulse, Dumbbell, Shield, Telescope, Leaf
} from 'lucide-react';
import { cn } from '../utils/cn';
import { ConfirmationModal } from './ConfirmationModal';
import { TeacherDetails } from './TeacherDetails';
import { CompactTeacherSchedule } from './CompactTeacherSchedule';
import { TeacherEditModal } from './ScheduleGrid';
import type { Lesson, Teacher } from '../types';
import { PlanSubjectCard } from './PlanSubjectCard';
import { TeacherDrawer } from './TeacherDrawer';

interface BulkEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (subjects: string[], workload?: number) => void;
    allSubjects: Subject[];
    selectedCount: number;
}

function BulkEditModal({ isOpen, onClose, onSave, allSubjects, selectedCount }: BulkEditModalProps) {
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [workload, setWorkload] = useState<number | undefined>(undefined);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />
            <div className="bg-[#1a1a1c] border border-white/10 w-full max-w-xl rounded-[32px] overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-300">
                <div className="p-10">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tighter mb-2 leading-none italic uppercase">
                                Редагувати групу
                            </h2>
                            <p className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-[0.2em]">Меню масових налаштувань • {selectedCount} вчителів</p>
                        </div>
                        <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl transition-all text-[#a1a1aa] hover:text-white">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-10">
                        <div>
                            <label className="block text-[10px] font-black text-[#a1a1aa] mb-6 uppercase tracking-widest">ДОДАТИ ДИСЦИПЛІНИ:</label>
                            <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto pr-4 custom-scrollbar">
                                {allSubjects.map(sub => (
                                    <button
                                        key={sub.id}
                                        onClick={() => setSelectedSubjects(prev => prev.includes(sub.id) ? prev.filter(s => s !== sub.id) : [...prev, sub.id])}
                                        className={cn(
                                            "px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300",
                                            selectedSubjects.includes(sub.id)
                                                ? "bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/20"
                                                : "bg-white/5 border-white/5 text-[#a1a1aa] hover:border-indigo-400/50"
                                        )}
                                    >
                                        {sub.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-[#a1a1aa] mb-4 uppercase tracking-widest italic">Годин на КОЖЕН предмет:</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    value={workload || ''}
                                    onChange={(e) => setWorkload(e.target.value ? parseInt(e.target.value) : undefined)}
                                    placeholder="Напр. 18"
                                    className="w-32 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                                />
                                <p className="text-[9px] font-bold text-indigo-400 uppercase leading-tight bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20">
                                    ВАЖЛИВО: Це змінить години<br />для всіх предметів вчителя
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-white/5 border-t border-white/5 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-widest text-[#a1a1aa] hover:bg-white/5 transition-all"
                    >
                        Скасувати
                    </button>
                    <button
                        onClick={() => onSave(selectedSubjects, workload)}
                        disabled={selectedSubjects.length === 0 && workload === undefined}
                        className="flex-[2] py-5 rounded-[24px] bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-30 flex items-center justify-center gap-2"
                    >
                        Застосувати до {selectedCount} вчителів
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

interface DataEntryProps {
    data: ScheduleRequest;
    onChange: (data: ScheduleRequest) => void;
    schedule: ScheduleResponse | null;
    onScheduleChange: (schedule: ScheduleResponse) => void;
    isEditMode: boolean;
    setIsEditMode: (v: boolean) => void;
    isPerformanceMode?: boolean;
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

export function DataEntry({ data, onChange, schedule, onScheduleChange, isEditMode, setIsEditMode, isPerformanceMode = false }: DataEntryProps) {
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
                            isPerformanceMode={isPerformanceMode}
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
    const [isAdding, setIsAdding] = useState(false);

    const PRESETS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#f97316'];

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

    const [newIcon, setNewIcon] = useState('BookOpen');
    const [editingIcon, setEditingIcon] = useState('BookOpen');

    const IconRenderer = ({ name, size = 20, className = "" }: { name?: string, size?: number, className?: string }) => {
        const IconComponent = ICON_OPTIONS.find(i => i.name === name)?.icon || BookOpen;
        return <IconComponent size={size} className={className} />;
    };

    const handleAdd = () => {
        if (!newName.trim()) return;
        onChange({
            ...data,
            subjects: [...data.subjects, { id: nextId(), name: newName.trim(), color: newColor, defaultRoom: newRoom, icon: newIcon }]
        });
        setNewName('');
        setNewColor('#6366f1');
        setNewRoom('101');
        setNewIcon('BookOpen');
    };

    const handleSaveEdit = () => {
        if (!editingId || !editingName.trim()) return;
        onChange({
            ...data,
            subjects: data.subjects.map(s => s.id === editingId ? { ...s, name: editingName.trim(), color: editingColor, defaultRoom: editingRoom, icon: editingIcon } : s)
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
                {/* Ghost Card / Add Form */}
                <div className={cn(
                    "bento-card p-3 transition-all duration-300 overflow-hidden relative min-h-[140px]",
                    isAdding
                        ? "col-span-1 border-indigo-500/50 bg-indigo-500/5 shadow-lg shadow-indigo-500/10"
                        : "border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 cursor-pointer group"
                )}>
                    {!isAdding ? (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full h-full flex flex-col items-center justify-center gap-3"
                        >
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#a1a1aa] group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                                <Plus size={24} />
                            </div>
                            <span className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-[0.2em] group-hover:text-white transition-colors">Додати</span>
                        </button>
                    ) : (
                        <div className="flex flex-col h-full animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Нова дисципліна</span>
                                <button onClick={() => setIsAdding(false)} className="p-1 text-[#a1a1aa] hover:text-white transition-colors">
                                    <X size={14} />
                                </button>
                            </div>

                            <div className="space-y-2">
                                <input
                                    placeholder="Назва..."
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    className="w-full px-2.5 py-2 bg-black/40 border border-white/10 rounded-lg text-xs font-bold text-white outline-none focus:border-indigo-500 transition-all placeholder:text-white/10"
                                    autoFocus
                                />
                                <div className="grid grid-cols-[1fr_2fr] gap-2 items-start">
                                    <input
                                        placeholder="Каб."
                                        value={newRoom}
                                        onChange={e => setNewRoom(e.target.value)}
                                        className="w-full px-2.5 py-2 bg-black/40 border border-white/10 rounded-lg text-[10px] font-bold text-white placeholder:text-white/10"
                                    />
                                    <div className="flex flex-wrap gap-1 p-1 bg-black/20 rounded-lg border border-white/5">
                                        {PRESETS.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setNewColor(c)}
                                                className={cn(
                                                    "w-4 h-4 rounded-sm transition-all active:scale-90",
                                                    newColor === c ? "ring-1 ring-white scale-110 shadow-lg shadow-white/20" : "opacity-40 hover:opacity-100"
                                                )}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                        <div className="relative w-4 h-4 rounded-sm overflow-hidden border border-white/10 ml-auto">
                                            <input
                                                type="color"
                                                value={newColor}
                                                onChange={e => setNewColor(e.target.value)}
                                                className="absolute inset-[-10px] w-[50px] h-[50px] cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-6 gap-1 p-1 bg-black/40 rounded-lg border border-white/5">
                                    {ICON_OPTIONS.slice(0, 12).map(opt => (
                                        <button
                                            key={opt.name}
                                            onClick={() => setNewIcon(opt.name)}
                                            className={cn(
                                                "w-6 h-6 rounded-md flex items-center justify-center transition-all",
                                                newIcon === opt.name ? "bg-indigo-500 text-white" : "text-[#a1a1aa] hover:bg-white/5"
                                            )}
                                        >
                                            <opt.icon size={12} />
                                        </button>
                                    ))}
                                </div>

                                <div className="flex gap-1.5 pt-1">
                                    <button
                                        onClick={() => setIsAdding(false)}
                                        className="flex-1 py-2 rounded-lg bg-white/5 text-[#a1a1aa] text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                    >
                                        Скас.
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleAdd();
                                            setIsAdding(false);
                                        }}
                                        disabled={!newName.trim()}
                                        className="flex-[2] py-2 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-30 transition-all"
                                    >
                                        Додати
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {filteredSubjects.map(subject => {
                    const isEditing = editingId === subject.id;
                    const hours = data.plan.filter(p => p.subject_id === subject.id).reduce((acc, p) => acc + p.hours_per_week, 0);
                    const color = subject.color || "#6366f1";

                    return (
                        <div key={subject.id} className={cn(
                            "bento-card p-3 border-white/5 transition-all duration-300 group relative flex flex-col hover:z-50",
                            isEditing ? "ring-2 ring-indigo-500 bg-indigo-500/10" : "bg-white/[0.04] hover:bg-white/[0.08]"
                        )}
                            style={!isEditing ? {
                                backgroundColor: `${color}05`,
                                borderColor: `${color}20`,
                                boxShadow: `0 4px 15px -10px ${color}10`
                            } : undefined}>
                            {/* Decorative background icon - wrapped in overflow-hidden container */}
                            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                                <div className="absolute -right-2 -top-2 opacity-[0.015] group-hover:scale-110 transition-all duration-700">
                                    <IconRenderer name={subject.icon} size={60} />
                                </div>
                            </div>

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex justify-between items-center mb-2 gap-2">
                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                        <div className="w-6 h-6 shrink-0 rounded-md flex items-center justify-center border border-white/5 shadow-inner transition-transform group-hover:scale-105" style={{ backgroundColor: `${color}20`, color: color }}>
                                            <IconRenderer name={subject.icon} size={12} />
                                        </div>
                                        {!isEditing && (
                                            <div className="flex items-center gap-1.5 opacity-60">
                                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                                                    <Clock size={20} className="text-[#a1a1aa]" />
                                                    <span className="text-[9px] font-black text-white">{hours}</span>
                                                </div>
                                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                                                    <div className="w-1 h-1 rounded-full" style={{ backgroundColor: color }} />
                                                    <span className="text-[9px] font-black text-white">{subject.defaultRoom || '---'}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        {isEditing ? (
                                            <>
                                                <button onClick={handleSaveEdit} className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"><Check size={14} /></button>
                                                <button onClick={() => setEditingId(null)} className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"><X size={14} /></button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => {
                                                    setEditingId(subject.id);
                                                    setEditingName(subject.name);
                                                    setEditingColor(subject.color || '#6366f1');
                                                    setEditingRoom(subject.defaultRoom || '101');
                                                    setEditingIcon(subject.icon || 'BookOpen');
                                                }} className="p-1.5 bg-white/5 text-[#a1a1aa] rounded hover:bg-white/10 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                                                    <Pencil size={12} />
                                                </button>
                                                <button onClick={() => handleDelete(subject.id)} className="p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {isEditing ? (
                                    <div className="space-y-1.5">
                                        <input
                                            value={editingName}
                                            onChange={e => setEditingName(e.target.value)}
                                            className="w-full px-2 py-1 bg-black/40 border border-white/10 rounded focus:border-indigo-500 outline-none font-bold text-white text-xs transition-all"
                                            placeholder="Назва..."
                                            autoFocus
                                        />
                                        <div className="flex gap-1.5">
                                            <input
                                                value={editingRoom}
                                                onChange={e => setEditingRoom(e.target.value)}
                                                className="flex-1 px-2 py-1 bg-black/40 border border-white/10 rounded text-[9px] font-bold text-white"
                                                placeholder="К..."
                                            />
                                            <input
                                                type="color"
                                                value={editingColor}
                                                onChange={e => setEditingColor(e.target.value)}
                                                className="w-8 h-6 bg-transparent border-none p-0 cursor-pointer"
                                            />
                                        </div>
                                        <div className="grid grid-cols-6 gap-1 bg-black/40 p-1.5 rounded border border-white/5">
                                            {ICON_OPTIONS.slice(0, 12).map(opt => (
                                                <button
                                                    key={opt.name}
                                                    onClick={() => setEditingIcon(opt.name)}
                                                    className={cn(
                                                        "w-6 h-6 rounded flex items-center justify-center transition-all",
                                                        editingIcon === opt.name
                                                            ? "bg-indigo-500 text-white"
                                                            : "text-[#a1a1aa] hover:bg-white/5"
                                                    )}
                                                >
                                                    <opt.icon size={12} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm font-bold text-white tracking-tight leading-tight line-clamp-2 min-h-[2.5rem] flex items-center mt-1">
                                        {subject.name}
                                    </div>
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
                description={`Ви впевнені, що хочете видалити "${data.subjects.find(s => s.id === deleteId)?.name}" ? Це також видалить його з планів та вчителів.`}
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
    isPerformanceMode?: boolean;
}

function TeachersEditor({ data, onChange, nextId, schedule, onScheduleChange, isEditMode, setIsEditMode, isPerformanceMode = false }: TeachersEditorProps) {
    const [viewMode, setViewMode] = useState<'list' | 'details' | 'schedule'>('list');
    const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
    const [editingTeacherCell, setEditingTeacherCell] = useState<{ teacherId: string, day: string, period: number } | null>(null);
    const [isAddFormOpen, setIsAddFormOpen] = useState(false);
    const [draggedLesson, setDraggedLesson] = useState<Lesson | null>(null);
    const [dragOverCell, setDragOverCell] = useState<any>(null);
    const [listMode, setListMode] = useState<'grid' | 'table'>('grid');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [draggedSubjectId, setDraggedSubjectId] = useState<string | null>(null);

    const [selectedPaletteSubjectIds, setSelectedPaletteSubjectIds] = useState<string[]>([]);
    const [paletteSearch, setPaletteSearch] = useState('');
    const [palettePosition, setPalettePosition] = useState({ x: 0, y: 0 });
    const paletteRef = useRef<HTMLDivElement>(null);
    const dragData = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0, currentX: 0, currentY: 0 });

    // Reset palette position when performance mode is toggled on
    useEffect(() => {
        if (isPerformanceMode) {
            setPalettePosition({ x: 0, y: 0 });
            if (paletteRef.current) {
                paletteRef.current.style.transform = '';
            }
        }
    }, [isPerformanceMode]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragData.current.isDragging) return;

            const dx = e.clientX - dragData.current.startX;
            const dy = e.clientY - dragData.current.startY;

            const newX = dragData.current.initialX + dx;
            const newY = dragData.current.initialY + dy;

            dragData.current.currentX = newX;
            dragData.current.currentY = newY;

            if (paletteRef.current) {
                paletteRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
            }
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (!dragData.current.isDragging) return;

            const dx = e.clientX - dragData.current.startX;
            const dy = e.clientY - dragData.current.startY;

            setPalettePosition({
                x: dragData.current.initialX + dx,
                y: dragData.current.initialY + dy
            });

            dragData.current.isDragging = false;
            document.body.style.userSelect = '';
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    useLayoutEffect(() => {
        if (paletteRef.current) {
            if (dragData.current.isDragging) {
                paletteRef.current.style.transform = `translate(${dragData.current.currentX}px, ${dragData.current.currentY}px)`;
            } else {
                paletteRef.current.style.transform = `translate(${palettePosition.x}px, ${palettePosition.y}px)`;
            }
        }
    });


    const handleSubjectDrop = (teacherId: string, subjectData: string) => {
        // Parse payload: it can be a single ID or a JSON string of multiple IDs
        let subjectIdsToAssign: string[] = [];
        try {
            const parsed = JSON.parse(subjectData);
            if (Array.isArray(parsed)) {
                subjectIdsToAssign = parsed;
            } else {
                subjectIdsToAssign = [subjectData];
            }
        } catch (e) {
            subjectIdsToAssign = [subjectData];
        }

        // Determine Target Teachers
        // If the teacher we dropped on is in the selected list, we apply to ALL selected teachers
        // Otherwise, we apply ONLY to the target teacher
        const targetTeacherIds = selectedIds.includes(teacherId)
            ? [...new Set([...selectedIds, teacherId])] // Ensure target is included if somehow consistent
            : [teacherId];

        onChange({
            ...data,
            teachers: data.teachers.map(t => {
                if (!targetTeacherIds.includes(t.id)) return t;

                // Add all subjects to this teacher, avoiding duplicates
                const newSubjects = [...t.subjects];
                subjectIdsToAssign.forEach(sid => {
                    if (!newSubjects.includes(sid)) {
                        newSubjects.push(sid);
                    }
                });
                return { ...t, subjects: newSubjects };
            })
        });

        // Auto-clear palette selection
        setSelectedPaletteSubjectIds([]);
    };
    const [filterSubjects, setFilterSubjects] = useState<string[]>([]);
    const [filterWorkload, setFilterWorkload] = useState<'all' | 'under' | 'over' | 'normal'>('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);

    const handleBulkDelete = () => {
        setIsBulkDeleteModalOpen(true);
    };

    const confirmBulkDelete = () => {
        onChange({
            ...data,
            teachers: data.teachers.filter(t => !selectedIds.includes(t.id)),
            plan: data.plan.filter(p => !selectedIds.includes(p.teacher_id))
        });
        setSelectedIds([]);
        setIsBulkDeleteModalOpen(false);
    };

    const handleBulkEditAction = (subjectsToAdd: string[], newWorkload?: number) => {
        onChange({
            ...data,
            teachers: data.teachers.map(t => {
                if (!selectedIds.includes(t.id)) return t;

                let updatedTeacher = { ...t };

                // Add unique subjects if any
                if (subjectsToAdd.length > 0) {
                    updatedTeacher.subjects = [...new Set([...updatedTeacher.subjects, ...subjectsToAdd])];
                }

                return updatedTeacher;
            }),
            // If workload is set, we need to find or create plan items for these teachers
            // Simplified for now: we'll only update existing plan items if we had a single subject,
            // but for bulk it's complex. Let's just update the teachers' list and maybe handle workload differently?
            // Actually, the user likely wants to set the limit in the plan.
            plan: data.plan.map(p => {
                if (selectedIds.includes(p.teacher_id) && newWorkload !== undefined) {
                    return { ...p, hours_per_week: newWorkload };
                }
                return p;
            })
        });
        setIsBulkEditModalOpen(false);
        setSelectedIds([]);
    };

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [teacherToEdit, setTeacherToEdit] = useState<Teacher | null>(null);

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
    const [is_primary, setIsPrimary] = useState(false);
    const [prefersPeriodZero, setPrefersPeriodZero] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleOpenDrawer = (teacher: Teacher) => {
        setTeacherToEdit(teacher);
        setIsDrawerOpen(true);
    };

    const handleSaveFromDrawer = (updatedTeacher: Teacher) => {
        onChange({
            ...data,
            teachers: data.teachers.map(t => t.id === updatedTeacher.id ? updatedTeacher : t)
        });
        setIsDrawerOpen(false);
        setTeacherToEdit(null);
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setPhoto(result);
        };
        reader.readAsDataURL(file);
    };

    const handleAdd = () => {
        if (!name.trim()) return;
        onChange({
            ...data,
            teachers: [...data.teachers, { id: nextId(), name: name.trim(), subjects: selectedSubjects, is_primary, prefers_period_zero: prefersPeriodZero, photo: photo || undefined }]
        });
        setName('');
        setSelectedSubjects([]);
        setIsPrimary(false);
        setPrefersPeriodZero(false);
        setPhoto(null);
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

    const filteredTeachers = useMemo(() => {
        let result = [...data.teachers];

        // Name Search
        if (searchQuery) {
            result = result.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        // Subject Filter
        if (filterSubjects.length > 0) {
            result = result.filter(t => filterSubjects.some(sid => t.subjects.includes(sid)));
        }

        // Workload Filter
        if (filterWorkload !== 'all') {
            result = result.filter(t => {
                const hours = data.plan.filter(p => p.teacher_id === t.id).reduce((acc, p) => acc + p.hours_per_week, 0);
                if (filterWorkload === 'under') return hours < 15;
                if (filterWorkload === 'over') return hours > 22;
                if (filterWorkload === 'normal') return hours >= 15 && hours <= 22;
                return true;
            });
        }

        return result.sort((a, b) => a.name.localeCompare(b.name, 'uk'));
    }, [data.teachers, searchQuery, filterSubjects, filterWorkload, data.plan]);

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
                        <TeacherDetails data={data} key={teacher.id} teacherId={teacher.id} schedule={schedule} />
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
                                        disableShadows: false,
                                        disableHoverEffects: false,
                                    }}
                                    getClassConflicts={() => []}
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
            {/* Search, Filter and View Toggle */}

            {/* Search, Filter and View Toggle */}
            <div className="flex gap-4">
                <div className="relative group flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Пошук вчителів за ім'ям..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-white placeholder:text-white/20 transition-all font-black"
                    />
                </div>

                <div className="relative">
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={cn(
                            "h-full px-6 rounded-2xl border flex items-center gap-3 transition-all font-black text-[10px] uppercase tracking-widest whitespace-nowrap",
                            isFilterOpen || filterSubjects.length > 0 || filterWorkload !== 'all'
                                ? "bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/20"
                                : "bg-white/5 border-white/10 text-[#a1a1aa] hover:bg-white/10 border-white/10"
                        )}
                    >
                        <Filter size={18} />
                        Фільтри
                        {(filterSubjects.length > 0 || filterWorkload !== 'all') && (
                            <span className="w-5 h-5 bg-white text-indigo-600 rounded-lg flex items-center justify-center text-[10px] font-black">
                                {(filterSubjects.length > 0 ? 1 : 0) + (filterWorkload !== 'all' ? 1 : 0)}
                            </span>
                        )}
                    </button>

                    {isFilterOpen && (
                        <>
                            <div className="fixed inset-0 z-[70]" onClick={() => setIsFilterOpen(false)} />
                            <div className="absolute right-0 mt-4 w-[360px] bg-[#1a1c1e] border border-white/10 rounded-[32px] p-8 shadow-2xl z-[80] animate-in zoom-in-95 fade-in duration-300">
                                <div className="space-y-8">
                                    {/* Subject Filter */}
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">Дисципліни:</label>
                                            {filterSubjects.length > 0 && (
                                                <button onClick={() => setFilterSubjects([])} className="text-[10px] font-black text-rose-400 hover:text-rose-300 uppercase underline">Скинути</button>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                                            {data.subjects.map(sub => (
                                                <button
                                                    key={sub.id}
                                                    onClick={() => setFilterSubjects(prev => prev.includes(sub.id) ? prev.filter(s => s !== sub.id) : [...prev, sub.id])}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all",
                                                        filterSubjects.includes(sub.id)
                                                            ? "bg-indigo-500 border-indigo-400 text-white"
                                                            : "bg-white/5 border-white/5 text-[#a1a1aa] hover:border-indigo-400/30"
                                                    )}
                                                >
                                                    {sub.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Workload Filter */}
                                    <div>
                                        <label className="block text-[10px] font-black text-[#a1a1aa] mb-4 uppercase tracking-widest leading-none">Навантаження:</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { id: 'all', label: 'Всі' },
                                                { id: 'under', label: '< 15 год' },
                                                { id: 'normal', label: '15-22 год' },
                                                { id: 'over', label: '> 22 год' }
                                            ].map(opt => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setFilterWorkload(opt.id as any)}
                                                    className={cn(
                                                        "px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                                        filterWorkload === opt.id
                                                            ? "bg-indigo-500 border-indigo-400 text-white"
                                                            : "bg-white/5 border-white/5 text-[#a1a1aa] hover:border-indigo-400/30"
                                                    )}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setFilterSubjects([]);
                                            setFilterWorkload('all');
                                            setIsFilterOpen(false);
                                        }}
                                        className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all"
                                    >
                                        Очистити все
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex p-1 bg-white/[0.03] rounded-2xl border border-white/5 h-fit self-center">
                    <button
                        onClick={() => setListMode('grid')}
                        className={cn(
                            "p-3 rounded-xl transition-all",
                            listMode === 'grid' ? "bg-white/10 text-white shadow-xl" : "text-[#a1a1aa] hover:text-white"
                        )}
                        title="Сітка"
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button
                        onClick={() => setListMode('table')}
                        className={cn(
                            "p-3 rounded-xl transition-all",
                            listMode === 'table' ? "bg-white/10 text-white shadow-xl" : "text-[#a1a1aa] hover:text-white"
                        )}
                        title="Таблиця"
                    >
                        <List size={20} />
                    </button>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={cn(
                            "p-3 rounded-xl border flex items-center gap-2 px-4",
                            isSidebarOpen
                                ? "bg-indigo-600 text-white border-indigo-500"
                                : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500 hover:text-white"
                        )}
                        title={isSidebarOpen ? "Закрити DND Панель" : "Призначити предмети (Drop)"}
                    >
                        <BookOpen size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">DND Панель</span>
                    </button>
                </div>
            </div>

            {/* List and Sidebar Container */}
            <div className="flex gap-8 items-start relative pb-20">
                <div className="flex-1 min-w-0">
                    {listMode === 'grid' ? (
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {/* Teacher Ghost Card */}
                            {!isAddFormOpen ? (
                                <button
                                    onClick={() => setIsAddFormOpen(true)}
                                    className="bento-card p-8 border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 group hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all min-h-[300px]"
                                >
                                    <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-lg">
                                        <Plus size={32} />
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm font-black text-white uppercase tracking-widest mb-1">Додати вчителя</div>
                                        <div className="text-[10px] text-[#a1a1aa] font-bold">Створити новий профіль</div>
                                    </div>
                                </button>
                            ) : (
                                <div className="bento-card p-5 border-emerald-500/30 bg-emerald-500/5 flex flex-col gap-4 animate-in zoom-in-95 duration-200 min-h-[300px] shadow-2xl shadow-emerald-500/10">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                        <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Новий вчитель</div>
                                        <button onClick={() => setIsAddFormOpen(false)} className="p-1 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
                                            <X size={16} />
                                        </button>
                                    </div>

                                    <div className="space-y-4 flex-1">
                                        <div className="flex gap-3">
                                            <div className="w-14 h-14 bg-black/40 border border-emerald-500/20 rounded-2xl flex items-center justify-center shrink-0 relative group/photo">
                                                {photo ? (
                                                    <img src={photo} className="w-full h-full object-cover rounded-2xl" alt="" />
                                                ) : (
                                                    <Plus size={20} className="text-white/20" />
                                                )}
                                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handlePhotoUpload} />
                                            </div>
                                            <input
                                                placeholder="ПІБ вчителя"
                                                autoFocus
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-indigo-500 transition-all placeholder:text-white/10"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => setIsPrimary(!is_primary)}
                                                className={cn(
                                                    "p-2 rounded-xl border transition-all text-left",
                                                    is_primary ? "bg-emerald-500/20 border-emerald-500/50" : "bg-black/20 border-white/5 hover:bg-white/5"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Check size={12} className={is_primary ? "text-emerald-400" : "text-white/10"} />
                                                    <span className="text-[10px] font-black text-white uppercase tracking-tight">Початкові</span>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => setPrefersPeriodZero(!prefersPeriodZero)}
                                                className={cn(
                                                    "p-2 rounded-xl border transition-all text-left",
                                                    prefersPeriodZero ? "bg-violet-500/20 border-violet-500/50" : "bg-black/20 border-white/5 hover:bg-white/5"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Check size={12} className={prefersPeriodZero ? "text-violet-400" : "text-white/10"} />
                                                    <span className="text-[10px] font-black text-white uppercase tracking-tight">0 Урок</span>
                                                </div>
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="text-[9px] font-black text-[#a1a1aa] uppercase tracking-widest pl-1">Дисципліни</div>
                                            <div className="max-h-[80px] overflow-y-auto pr-1 flex flex-wrap gap-1 custom-scrollbar">
                                                {data.subjects.map(sub => (
                                                    <button
                                                        key={sub.id}
                                                        onClick={() => setSelectedSubjects(prev => prev.includes(sub.id) ? prev.filter(s => s !== sub.id) : [...prev, sub.id])}
                                                        className={cn(
                                                            "px-2 py-1 rounded-lg text-[9px] font-black border transition-all",
                                                            selectedSubjects.includes(sub.id)
                                                                ? "bg-emerald-500 border-emerald-400 text-white"
                                                                : "bg-white/5 border-white/5 text-[#a1a1aa] hover:border-emerald-500/30"
                                                        )}
                                                    >
                                                        {sub.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-2 border-t border-white/5">
                                        <button
                                            onClick={() => setIsAddFormOpen(false)}
                                            className="flex-1 py-2 rounded-xl bg-white/5 text-[10px] font-black text-white uppercase tracking-widest hover:bg-red-500/10 hover:text-red-400 transition-all border border-white/5"
                                        >
                                            Скасувати
                                        </button>
                                        <button
                                            onClick={() => { handleAdd(); setIsAddFormOpen(false); }}
                                            disabled={!name.trim()}
                                            className="flex-1 py-2 rounded-xl bg-emerald-500 text-[10px] font-black text-white uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:shadow-none"
                                        >
                                            Додати
                                        </button>
                                    </div>
                                </div>
                            )}

                            {filteredTeachers.map(teacher => {
                                const hours = data.plan.filter(p => p.teacher_id === teacher.id).reduce((acc, p) => acc + p.hours_per_week, 0);
                                const isSelected = selectedIds.includes(teacher.id);

                                return (
                                    <div
                                        key={teacher.id}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            e.currentTarget.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-4', 'ring-offset-[#09090b]');
                                        }}
                                        onDragLeave={(e) => {
                                            e.currentTarget.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-4', 'ring-offset-[#09090b]');
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            e.currentTarget.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-4', 'ring-offset-[#09090b]');
                                            const sid = e.dataTransfer.getData('subjectId');
                                            if (sid) handleSubjectDrop(teacher.id, sid);
                                        }}
                                        onClick={() => {
                                            setSelectedTeacherId(teacher.id);
                                            setViewMode('details');
                                        }}
                                        className={cn(
                                            "bento-card p-0 border-white/5 group relative transition-all duration-300 flex flex-col cursor-pointer hover:z-50",
                                            isSelected ? "bg-indigo-500/10 border-indigo-500/30 scale-[0.98]" : "bg-white/[0.04] hover:bg-white/[0.08]"
                                        )}
                                    >
                                        {/* Decorative background icon - wrapped in overflow-hidden container */}
                                        <div className="absolute inset-0 rounded-[32px] overflow-hidden pointer-events-none">
                                            <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700">
                                                <Users size={160} />
                                            </div>
                                        </div>

                                        {/* Top Actions: Selection (Left) & Edit/Delete (Right) */}
                                        <div className="flex justify-between items-center p-5 relative z-20">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedIds(prev => isSelected ? prev.filter(id => id !== teacher.id) : [...prev, teacher.id]);
                                                }}
                                                className={cn(
                                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                                                    isSelected
                                                        ? "bg-indigo-500 border-indigo-400 text-white scale-110 shadow-lg shadow-indigo-500/30"
                                                        : "bg-black/20 border-white/10 text-transparent hover:border-white/30"
                                                )}
                                            >
                                                <Check size={12} strokeWidth={4} className={cn(isSelected ? "opacity-100" : "opacity-0")} />
                                            </button>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenDrawer(teacher);
                                                    }}
                                                    className="p-2 bg-white/5 text-[#a1a1aa] rounded-xl hover:bg-white/10 hover:text-white border border-white/5 opacity-0 group-hover:opacity-100"
                                                    title="Редагувати"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                {!isSelected && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(teacher.id);
                                                        }}
                                                        className="p-2 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 border border-rose-500/5"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Main Content */}
                                        <div className="px-6 pb-6 pt-2 flex-col flex flex-1 relative z-10">
                                            <div className="flex items-center gap-5 mb-6">
                                                <div className="w-16 h-16 bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-[22px] flex items-center justify-center font-black overflow-hidden border border-white/10 shadow-2xl group-hover:scale-105 transition-transform shrink-0">
                                                    {teacher.photo ? (
                                                        <img src={teacher.photo} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <span className="text-2xl text-white/50">{teacher.name.slice(0, 1).toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-3xl font-black text-white tracking-tighter truncate leading-tight mb-1">
                                                        {teacher.name}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {teacher.is_primary && (
                                                            <div className="bg-emerald-500/10 text-emerald-400 p-1 rounded-lg border border-emerald-500/20" title="Початкові класи">
                                                                <GraduationCap size={14} />
                                                            </div>
                                                        )}
                                                        {teacher.prefers_period_zero && (
                                                            <div className="bg-violet-500/10 text-violet-400 p-1 rounded-lg border border-violet-500/20" title="Нульовий урок">
                                                                <Clock size={14} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3 mt-auto">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest leading-none">Навантаження</span>
                                                    <span className={cn("text-xs font-black", hours > 30 ? "text-rose-400" : "text-emerald-400")}>{hours} год/тижд</span>
                                                </div>

                                                {/* Subject Tags */}
                                                <div className="flex flex-wrap gap-1.5 mt-1">
                                                    {teacher.subjects.slice(0, 3).map(sid => {
                                                        const sub = data.subjects.find(s => s.id === sid);
                                                        return (
                                                            <span key={sid} className="px-2.5 py-1 bg-white/[0.03] text-[9px] font-black text-white/70 rounded-lg border border-white/5 uppercase tracking-tight flex items-center gap-1.5">
                                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sub?.color || '#6366f1' }} />
                                                                {sub?.name.slice(0, 8) || sid}
                                                            </span>
                                                        );
                                                    })}
                                                    {teacher.subjects.length > 3 && (
                                                        <div className="relative group/tooltip">
                                                            <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-[9px] font-black rounded-lg border border-indigo-500/20 uppercase cursor-help">
                                                                +{teacher.subjects.length - 3}
                                                            </span>
                                                            {/* Tooltip wrapper to bridge the hover gap */}
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-3 w-56 opacity-0 translate-y-2 pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:translate-y-0 group-hover/tooltip:pointer-events-auto transition-all z-[100]">
                                                                <div className="bg-[#1a1a1c] border border-white/10 p-4 rounded-2xl shadow-2xl relative">
                                                                    <div className="text-[9px] font-black text-[#a1a1aa] uppercase tracking-widest mb-2 border-b border-white/5 pb-2">Усі дисципліни</div>
                                                                    <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar pt-1">
                                                                        {teacher.subjects.map((sid, idx) => {
                                                                            const sub = data.subjects.find(s => s.id === sid);
                                                                            return (
                                                                                <div key={`${teacher.id}-${sid}-${idx}`} className="flex items-center gap-2 py-0.5">
                                                                                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: sub?.color || '#6366f1' }} />
                                                                                    <span className="text-[10px] font-bold text-white/80 leading-tight">{sub?.name || sid}</span>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1a1a1c] rotate-45 border-r border-b border-white/10 -mt-1.5" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="w-[calc(100%+3rem)] -mx-6 -mb-6 mt-6 bg-white/5 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn("h-full transition-all duration-1000 delay-100", hours > 30 ? "bg-rose-500" : "bg-emerald-500")}
                                                        style={{ width: `${Math.min(hours / 35 * 100, 100)}% ` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white/[0.04] rounded-3xl border border-white/5 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/5 border-b border-white/5">
                                        <th className="p-5 w-12 text-center">
                                            <button
                                                onClick={() => setSelectedIds(selectedIds.length === filteredTeachers.length ? [] : filteredTeachers.map(t => t.id))}
                                                className={cn(
                                                    "w-5 h-5 rounded border transition-all flex items-center justify-center mx-auto",
                                                    selectedIds.length === filteredTeachers.length ? "bg-indigo-500 border-indigo-400" : "bg-white/10 border-white/10"
                                                )}
                                            >
                                                {selectedIds.length === filteredTeachers.length && <Check size={12} strokeWidth={4} className="text-white" />}
                                            </button>
                                        </th>
                                        <th className="p-5 text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">Вчитель</th>
                                        <th className="p-5 text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">Дисципліни</th>
                                        <th className="p-5 text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest text-center">Нав-ня</th>
                                        <th className="p-5 text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest text-right">Дії</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredTeachers.map(teacher => {
                                        const hours = data.plan.filter(p => p.teacher_id === teacher.id).reduce((acc, p) => acc + p.hours_per_week, 0);
                                        const isSelected = selectedIds.includes(teacher.id);

                                        return (
                                            <tr
                                                key={teacher.id}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    const sid = e.dataTransfer.getData('subjectId');
                                                    if (sid) handleSubjectDrop(teacher.id, sid);
                                                }}
                                                onClick={() => {
                                                    setSelectedTeacherId(teacher.id);
                                                    setViewMode('details');
                                                }}
                                                className={cn("border-b border-white/5 transition-colors group cursor-pointer", isSelected ? "bg-indigo-500/5" : "hover:bg-white/5")}
                                            >
                                                <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => setSelectedIds(prev => isSelected ? prev.filter(id => id !== teacher.id) : [...prev, teacher.id])}
                                                        className={cn(
                                                            "w-5 h-5 rounded border transition-all flex items-center justify-center mx-auto",
                                                            isSelected ? "bg-indigo-500 border-indigo-400" : "bg-white/5 border-white/10 group-hover:border-white/20"
                                                        )}
                                                    >
                                                        {isSelected && <Check size={12} strokeWidth={4} className="text-white" />}
                                                    </button>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-white/5 overflow-hidden flex items-center justify-center text-indigo-400 font-black">
                                                            {teacher.photo ? <img src={teacher.photo} className="w-full h-full object-cover" /> : teacher.name[0]}
                                                        </div>
                                                        <div className="font-black text-white">{teacher.name}</div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {teacher.subjects.map(sid => (
                                                            <span key={sid} className="px-2 py-0.5 bg-white/5 text-[9px] font-black text-[#a1a1aa] rounded border border-white/5 uppercase">
                                                                {data.subjects.find(s => s.id === sid)?.name || sid}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={cn("text-xs font-black", hours > 30 ? "text-rose-400" : "text-indigo-400")}>
                                                        {hours} год
                                                    </span>
                                                </td>
                                                <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => { setSelectedTeacherId(teacher.id); setViewMode('details'); }}
                                                            className="p-2 bg-white/5 text-[#a1a1aa] rounded-lg hover:bg-indigo-500 hover:text-white transition-all"
                                                        >
                                                            <ClipboardList size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenDrawer(teacher)}
                                                            className="p-2 bg-white/5 text-[#a1a1aa] rounded-lg hover:bg-white/10 hover:text-white transition-all outline-none"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(teacher.id)}
                                                            className="p-2 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {filteredTeachers.length === 0 && (
                        <div className="text-center py-20 bg-white/5 rounded-3xl border-2 border-dashed border-white/5">
                            <Users size={48} className="mx-auto mb-4 text-white/10" />
                            <p className="font-black text-white/30 uppercase tracking-widest text-sm">
                                {searchQuery ? 'Вчителів не знайдено' : 'Вчителі ще не додані'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Floating Subject Palette */}
                {createPortal(
                    <div
                        ref={paletteRef}
                        className={cn(
                            "fixed z-[200] w-72 bg-[#1a1c1e] border border-white/10 rounded-[32px] flex flex-col overflow-hidden will-change-transform",
                            isSidebarOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
                        )}
                        style={{
                            right: '2rem',
                            top: '20%',
                            maxHeight: '60vh',
                            // In performance mode, we force fixed positioning to avoid any translation issues
                            transform: isPerformanceMode ? 'none' : undefined
                        }}
                    >
                        {/* Palette Header / Drag Handle */}
                        <div
                            onMouseDown={(e) => {
                                if (isPerformanceMode) return;
                                dragData.current = {
                                    isDragging: true,
                                    startX: e.clientX,
                                    startY: e.clientY,
                                    initialX: palettePosition.x,
                                    initialY: palettePosition.y,
                                    currentX: palettePosition.x,
                                    currentY: palettePosition.y
                                };
                                document.body.style.userSelect = 'none';
                            }}
                            className={cn(
                                "p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between select-none",
                                isPerformanceMode ? "cursor-default" : "cursor-move group/handle"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                {!isPerformanceMode && <GripVertical size={16} className="text-white/20 group-hover/handle:text-indigo-400" />}
                                <h4 className="text-[10px] font-black text-white uppercase tracking-widest italic flex items-center gap-2">
                                    Palette
                                    {isPerformanceMode && <Lock size={12} className="text-white/20" />}
                                </h4>
                            </div>
                            <div className="flex items-center gap-1">
                                {selectedPaletteSubjectIds.length > 0 && (
                                    <button
                                        onClick={() => setSelectedPaletteSubjectIds([])}
                                        className="text-[9px] font-black text-rose-400 hover:text-rose-300 uppercase mr-2"
                                    >
                                        Скинути ({selectedPaletteSubjectIds.length})
                                    </button>
                                )}
                                <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-[#a1a1aa] hover:text-white hover:bg-white/5 rounded-lg">
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">


                            {/* All Subjects (Compressed) */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 opacity-40">
                                    <div className="h-px flex-1 bg-white/20" />
                                    <span className="text-[9px] font-black text-white uppercase tracking-widest">Всі предмети</span>
                                    <div className="h-px flex-1 bg-white/20" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {getSortedSubjects(data.subjects).map(sub => {
                                        const isSelected = selectedPaletteSubjectIds.includes(sub.id);
                                        return (
                                            <div
                                                key={sub.id}
                                                draggable
                                                onDragStart={(e) => {
                                                    let payload = [sub.id];
                                                    if (isSelected) {
                                                        payload = selectedPaletteSubjectIds;
                                                    }
                                                    e.dataTransfer.setData('subjectId', JSON.stringify(payload));
                                                    setDraggedSubjectId(sub.id);
                                                }}
                                                onDragEnd={() => setDraggedSubjectId(null)}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedPaletteSubjectIds(prev =>
                                                        prev.includes(sub.id)
                                                            ? prev.filter(id => id !== sub.id)
                                                            : [...prev, sub.id]
                                                    );
                                                }}
                                                className={cn(
                                                    "p-3 border rounded-xl cursor-grab flex flex-col gap-2 group/sub relative transition-all duration-200 select-none",
                                                    isSelected
                                                        ? "bg-indigo-500/20 border-indigo-500 ring-1 ring-indigo-500"
                                                        : "bg-white/[0.03] border-white/5 hover:bg-white/[0.08] hover:border-indigo-500/30",
                                                    draggedSubjectId === sub.id && "opacity-50"
                                                )}
                                            >
                                                {isSelected && (
                                                    <div className="absolute top-2 right-2 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
                                                        <Check size={10} className="text-white" />
                                                    </div>
                                                )}

                                                <div className="w-full h-1 rounded-full opacity-50 group-hover/sub:opacity-100 transition-opacity" style={{ backgroundColor: sub.color || '#6366f1' }} />
                                                <span className={cn(
                                                    "text-[10px] font-black truncate uppercase tracking-tight transition-colors",
                                                    isSelected ? "text-white" : "text-[#a1a1aa] group-hover/sub:text-white"
                                                )}>{sub.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-indigo-500/5 border-t border-white/5">
                            <p className="text-[8px] font-bold text-indigo-300/40 uppercase tracking-[0.2em] text-center">
                                Перетягніть на картку вчителя
                            </p>
                        </div>
                    </div>,
                    document.body
                )}

                {/* Gallery Mode Overlay */}
                {createPortal(
                    <div
                        className={cn(
                            "fixed inset-0 z-[300] flex items-center justify-center p-10",
                            isGalleryOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none",
                            draggedSubjectId && "opacity-0 pointer-events-none"
                        )}
                    >
                        <div className="absolute inset-0 bg-[#0a0a0b]/98" onClick={() => setIsGalleryOpen(false)} />
                        <div className={cn(
                            "relative w-full max-w-5xl bg-[#141416] border border-white/10 rounded-[48px] flex flex-col overflow-hidden",
                            isGalleryOpen ? "scale-100" : "scale-95"
                        )}>
                            {/* Gallery Header */}
                            <div className="p-10 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-[24px] bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-600/30">
                                        <BookOpen size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-4xl font-black text-white tracking-tighter">Бібліотека предметів</h2>
                                        <p className="text-xs font-bold text-[#a1a1aa] uppercase tracking-[0.3em]">Всі дисципліни закладу</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="relative group w-80">
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400" size={20} />
                                        <input
                                            autoFocus
                                            placeholder="Швидкий пошук..."
                                            value={paletteSearch}
                                            onChange={e => setPaletteSearch(e.target.value)}
                                            className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/10 rounded-[24px] focus:ring-2 focus:ring-indigo-500 outline-none font-black text-white placeholder:text-white/10 transition-all uppercase tracking-widest text-sm"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setIsGalleryOpen(false)}
                                        className="w-16 h-16 rounded-[24px] bg-white/5 text-[#a1a1aa] hover:bg-white/10 hover:text-white flex items-center justify-center"
                                    >
                                        <Minimize2 size={24} />
                                    </button>
                                </div>
                            </div>

                            {/* Gallery Grid */}
                            <div className="flex-1 overflow-y-auto p-10 pt-0 custom-scrollbar pb-20">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                                    {getSortedSubjects(data.subjects)
                                        .filter(s => s.name.toLowerCase().includes(paletteSearch.toLowerCase()))
                                        .map(sub => (
                                            <div
                                                key={`gallery-${sub.id}`}
                                                draggable
                                                onDragStart={(e) => {
                                                    e.dataTransfer.setData('subjectId', sub.id);
                                                    setDraggedSubjectId(sub.id);
                                                }}
                                                onDragEnd={() => setDraggedSubjectId(null)}
                                                className="group/item relative aspect-[4/3] bg-white/[0.04] border border-white/5 rounded-[32px] p-6 flex flex-col justify-between cursor-grab active:cursor-grabbing hover:bg-white/[0.08] hover:border-indigo-500/30 active:scale-95"
                                            >
                                                <div
                                                    className="w-12 h-1.5 rounded-full shadow-lg"
                                                    style={{ backgroundColor: sub.color || '#6366f1' }}
                                                />
                                                <div className="space-y-1">
                                                    <span className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest opacity-0 group-hover/item:opacity-100 transition-all transform translate-y-2 group-hover/item:translate-y-0">ПРИЗНАЧИТИ</span>
                                                    <span className="block text-sm font-black text-white uppercase tracking-tight leading-tight group-hover/item:text-indigo-200 transition-colors uppercase italic">{sub.name}</span>
                                                </div>

                                                {/* Hover Glow */}
                                                <div
                                                    className="absolute inset-x-4 bottom-0 h-10 blur-2xl opacity-0 group-hover/item:opacity-20 transition-opacity rounded-full pointer-events-none"
                                                    style={{ backgroundColor: sub.color }}
                                                />
                                            </div>
                                        ))
                                    }
                                </div>
                                {data.subjects.filter(s => s.name.toLowerCase().includes(paletteSearch.toLowerCase())).length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-40 space-y-6 opacity-20">
                                        <BookOpen size={80} strokeWidth={1} />
                                        <p className="text-xl font-black uppercase tracking-[0.4em]">Предметів не знайдено</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            </div>

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && createPortal(
                <div
                    className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[90] bg-[#1a1a1c] border border-white/10 px-8 py-5 rounded-[40px] flex items-center gap-8"
                    style={{ minWidth: 'fit-content' }}
                >
                    <div className="flex items-center gap-4 border-r border-white/5 pr-8">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-600/30">
                            {selectedIds.length}
                        </div>
                        <div>
                            <div className="text-sm font-black text-white leading-tight italic uppercase tracking-tighter">Вчителів обрано</div>
                            <div className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-[0.2em]">Масові дії</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsBulkEditModalOpen(true)}
                            className="px-8 py-4 rounded-[20px] bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                        >
                            <Pencil size={18} /> Редагувати групу
                        </button>
                        <button
                            onClick={() => setSelectedIds([])}
                            className="px-8 py-4 rounded-[20px] bg-white/5 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
                        >
                            Скасувати
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            className="px-8 py-4 rounded-[20px] bg-rose-500/10 text-rose-500 border border-rose-500/20 font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center gap-3"
                        >
                            <Trash2 size={18} /> Видалити
                        </button>
                    </div>
                </div>,
                document.body
            )}

            <ConfirmationModal
                isOpen={isBulkDeleteModalOpen}
                onClose={() => setIsBulkDeleteModalOpen(false)}
                onConfirm={confirmBulkDelete}
                title="Видалити обраних?"
                description={`Ви впевнені, що хочете видалити ${selectedIds.length} обраних вчителів? Цю дію неможливо скасувати.`}
            />

            {isBulkEditModalOpen && (
                <BulkEditModal
                    isOpen={isBulkEditModalOpen}
                    onClose={() => setIsBulkEditModalOpen(false)}
                    onSave={handleBulkEditAction}
                    allSubjects={data.subjects}
                    selectedCount={selectedIds.length}
                />
            )}
            <ConfirmationModal
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Видалити вчителя?"
                description={`Ви впевнені, що хочете видалити вчителя "${data.teachers.find(t => t.id === deleteId)?.name}" ? `}
            />

            <TeacherDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                teacher={teacherToEdit}
                allSubjects={data.subjects}
                data={data}
                onSave={handleSaveFromDrawer}
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
            const className = `${selectedGrade} -${letter} `;
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

    const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'plan'>('overview');

    // Generate mock students
    const mockStudents = useMemo(() => {
        if (!viewingClassId) return [];
        return Array.from({ length: 25 }, (_, i) => ({
            id: `s - ${i + 1} `,
            name: `Учень ${i + 1} (${viewingClass?.name})`,
            email: `student${i + 1} @school.com`
        }));
    }, [viewingClassId, viewingClass]);

    if (viewingClassId && viewingClass) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Header */}
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
                            <p className="text-sm font-black text-[#a1a1aa] uppercase tracking-widest">Детальна інформація</p>
                        </div>
                    </div>
                    <div className="bg-violet-500/20 text-violet-400 px-5 py-2 rounded-xl text-lg font-black border border-violet-500/10">
                        {classPlan.reduce((acc, p) => acc + p.hours_per_week, 0)} год/тиждень
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                    {(['overview', 'plan', 'students'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex-1 py-3 rounded-lg text-sm font-black uppercase tracking-widest transition-all",
                                activeTab === tab
                                    ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20"
                                    : "text-[#a1a1aa] hover:bg-white/5 hover:text-white"
                            )}
                        >
                            {tab === 'overview' && 'Огляд'}
                            {tab === 'plan' && 'Навчальний План'}
                            {tab === 'students' && 'Учні'}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="min-h-[400px]">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-300">
                            {/* Summary Card */}
                            <div className="bento-card p-6 border-white/5 space-y-4">
                                <h4 className="flex items-center gap-2 text-xl font-black text-white">
                                    <ClipboardList className="text-violet-400" />
                                    Навантаження
                                </h4>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {getSortedSubjects(data.subjects)
                                        .filter(s => classPlan.some(p => p.subject_id === s.id && p.hours_per_week > 0))
                                        .sort((a, b) => {
                                            const hA = classPlan.find(p => p.subject_id === a.id)?.hours_per_week || 0;
                                            const hB = classPlan.find(p => p.subject_id === b.id)?.hours_per_week || 0;
                                            return hB - hA;
                                        })
                                        .map(subject => {
                                            const hours = classPlan.find(p => p.subject_id === subject.id)?.hours_per_week || 0;
                                            return (
                                                <div key={subject.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-8 rounded-full" style={{ backgroundColor: subject.color || '#6366f1' }} />
                                                        <span className="font-bold text-white/90">{subject.name}</span>
                                                    </div>
                                                    <span className="font-black text-violet-400 text-lg">{hours} год</span>
                                                </div>
                                            );
                                        })}
                                    {classPlan.length === 0 && (
                                        <div className="text-center text-white/30 py-10 font-bold">План пустий</div>
                                    )}
                                </div>
                            </div>

                            {/* Students Preview (Placeholder) */}
                            <div className="bento-card p-6 border-white/5 space-y-4 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                                    <Users size={120} />
                                </div>
                                <div className="flex justify-between items-center">
                                    <h4 className="flex items-center gap-2 text-xl font-black text-white">
                                        <Users className="text-emerald-400" />
                                        Учні
                                    </h4>
                                    <span className="text-xs font-bold bg-white/10 text-white px-2 py-1 rounded-md">{mockStudents.length} учнів</span>
                                </div>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {mockStudents.slice(0, 8).map(student => (
                                        <div key={student.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-xs font-bold text-white">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white text-sm">{student.name}</div>
                                                <div className="text-[10px] text-white/40">{student.email}</div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="text-center p-2 text-xs font-bold text-white/30 uppercase tracking-widest bg-white/5 rounded-lg">
                                        + ще {mockStudents.length - 8} учнів...
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'students' && (
                        <div className="bento-card p-6 border-white/5 animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-2xl font-black text-white">Список Учнів</h4>
                                <button className="btn-premium px-4 py-2 text-sm">Додати учня</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {mockStudents.map(student => (
                                    <div key={student.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-lg font-black text-white shadow-lg group-hover:scale-110 transition-transform">
                                            {student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">{student.name}</div>
                                            <div className="text-xs text-white/50">{student.email}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'plan' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in zoom-in-95 duration-300">
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
                    )}
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
                        <Plus size={20} /> Додати {selectedLetters.length > 0 ? `${selectedGrade} -${selectedLetters.join(', ')} ` : 'класи'}
                    </button>
                </div>
            </div>

            {/* Class Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {getSortedClasses(data.classes).map(cls => {
                    const hours = data.plan.filter(p => p.class_id === cls.id).reduce((acc, p) => acc + p.hours_per_week, 0);
                    const subjectsCount = data.plan.filter(p => p.class_id === cls.id).length;

                    return (
                        <div key={cls.id} className="bento-card p-6 border-white/5 bg-violet-500/[0.03] hover:bg-white/[0.04] transition-all group cursor-pointer relative flex flex-col hover:z-50" onClick={() => setViewingClassId(cls.id)}>
                            {/* Decorative background icon - wrapped in overflow-hidden container */}
                            <div className="absolute inset-0 rounded-[32px] overflow-hidden pointer-events-none">
                                <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700">
                                    <GraduationCap size={140} />
                                </div>
                            </div>
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div className="text-4xl font-black text-white tracking-tighter">{cls.name}</div>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(cls.id); }} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="space-y-2 mt-auto relative z-10">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest">Годин / Тиждень</span>
                                    <span className={cn("text-xs font-black", hours > 30 ? "text-rose-400" : "text-violet-400")}>{hours} год</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest">Предметів</span>
                                    <span className="text-xs font-black text-white">{subjectsCount}</span>
                                </div>
                            </div>

                            <div className="mt-5 w-[calc(100%+3rem)] -mx-6 -mb-6 bg-white/5 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full transition-all duration-500", hours > 30 ? "bg-rose-500" : "bg-violet-500")}
                                    style={{ width: `${Math.min(hours / 35 * 100, 100)}% ` }}
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
                description={`Ви впевнені, що хочете видалити клас "${data.classes.find(c => c.id === deleteId)?.name}" ? Це також видалить весь його навчальний план.`}
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
                                    <div className={cn("h-full rounded-full", hours > 30 ? "bg-red-500" : "bg-amber-500")} style={{ width: `${Math.min(hours / 35 * 100, 100)}% ` }} />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // View 2: Class Details (Matrix)

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedSubjects.map(subject => {
                    const planItem = data.plan.find(p => p.class_id === selectedClassId && p.subject_id === subject.id);

                    return (
                        <PlanSubjectCard
                            key={subject.id}
                            subject={subject}
                            planItem={planItem}
                            classGrade={parseInt(selectedClass?.name || "0")}
                            teachers={data.teachers}
                            onUpdate={(h, tId, r) => handleUpdatePlan(selectedClassId!, subject.id, tId, h, r)}
                        />
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
