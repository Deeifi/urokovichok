import React, { useState, useEffect } from 'react';
import {
    Settings,
    Zap,
    Trash2,
    ShieldAlert,
    Cpu,
    Image as ImageIcon,
    Wind,
    Clock,
    Layers,
    Unlock,
    Users,
    Info,
    Shield,
    X,
    CheckCircle2,
    AlertCircle,
    Download,
    Upload,
    Database,
    FlaskConical
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '../utils/cn';
import { getAllData, restoreData } from '../utils/indexedDB';
import type { PerformanceSettings, Teacher } from '../types';

interface SettingsViewProps {
    perfSettings: PerformanceSettings;
    setPerfSettings: (s: PerformanceSettings) => void;
    handleReset: () => void;
    userRole: 'admin' | 'teacher';
    setUserRole: (role: 'admin' | 'teacher') => void;
    selectedTeacherId: string | null;
    setSelectedTeacherId: (id: string | null) => void;
    teachers: Teacher[];
    showExperimentalFeatures: boolean;
    setShowExperimentalFeatures: (show: boolean) => void;
}

interface AdminPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

function AdminPasswordModal({ isOpen, onClose, onSuccess }: AdminPasswordModalProps) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [isShaking, setIsShaking] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setPassword('');
            setError(false);
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (isOpen && e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === '1111') {
            onSuccess();
            onClose();
        } else {
            setError(true);
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
            setPassword('');
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
            <div
                className={cn(
                    "bg-[#1a1a1e] w-full max-w-sm rounded-[32px] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300",
                    isShaking && "animate-shake"
                )}
                onClick={e => e.stopPropagation()}
            >
                <div className="p-8 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center mb-6 border border-indigo-500/20 relative">
                        <Shield size={40} />
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center border-2 border-[#1a1a1e]">
                            <Unlock size={12} className="text-white" />
                        </div>
                    </div>

                    <h3 className="text-2xl font-black text-white mb-2 leading-tight">Доступ обмежено</h3>
                    <p className="text-[#a1a1aa] font-medium text-sm leading-relaxed px-4">
                        Будь ласка, введіть пароль адміністратора для переходу в режим **ЗАВУЧ**.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 pt-0 space-y-4">
                    <div className="relative group">
                        <input
                            autoFocus
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Введіть пароль"
                            className={cn(
                                "w-full bg-black/40 border-2 rounded-2xl px-6 py-4 text-center text-2xl font-black tracking-[0.5em] text-white outline-none transition-all placeholder:tracking-normal placeholder:text-xs placeholder:font-bold placeholder:uppercase placeholder:text-[#a1a1aa]/50",
                                error ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-indigo-500/50"
                            )}
                        />
                        {error && (
                            <div className="absolute -bottom-6 left-0 right-0 text-center animate-in slide-in-from-top-1 duration-200">
                                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center justify-center gap-1">
                                    <AlertCircle size={10} /> Невірний пароль
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-white/5 hover:bg-white/10 text-[#a1a1aa] hover:text-white transition-all active:scale-95"
                        >
                            Скасувати
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-indigo-600 hover:bg-indigo-500 text-white transition-all active:scale-95 shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                        >
                            Увійти <CheckCircle2 size={16} />
                        </button>
                    </div>
                </form>

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-[#a1a1aa] hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
        </div>,
        document.body
    );
}

export function SettingsView({
    perfSettings, setPerfSettings, handleReset,
    userRole, setUserRole, selectedTeacherId, setSelectedTeacherId, teachers,
    showExperimentalFeatures, setShowExperimentalFeatures
}: SettingsViewProps) {
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const togglePerf = (key: keyof PerformanceSettings) => {
        setPerfSettings({
            ...perfSettings,
            [key]: !perfSettings[key]
        });
    };

    const handleRoleSwitch = (newRole: 'admin' | 'teacher') => {
        if (newRole === 'admin' && userRole !== 'admin') {
            setIsPasswordModalOpen(true);
        } else {
            setUserRole(newRole);
        }
    };

    const performanceOptions = [
        {
            id: 'disableAnimations',
            label: 'Вимкнути анімації',
            desc: 'Миттєве перемикання між вкладками та вікнами. Зменшує навантаження на процесор.',
            icon: Wind
        },
        {
            id: 'disableBlur',
            label: 'Вимкнути ефекти скла (Blur)',
            desc: 'Замінює напівпрозоре розмиття на суцільний колір. Значно полегшує роботу відеокарти.',
            icon: Layers
        },
        {
            id: 'disableShadows',
            label: 'Вимкнути тіні',
            desc: 'Замінює тіні на тонкі рамки. Покращує швидкість малювання сторінки.',
            icon: ShieldAlert
        },
        {
            id: 'hidePhotos',
            label: 'Приховати фото вчителів',
            desc: 'Економить оперативну пам\'ять та мережевий трафік.',
            icon: ImageIcon
        },
        {
            id: 'lowFrequencyClock',
            label: 'Енергоощадний годинник',
            desc: 'Оновлює час на Дашборді раз на хвилину замість кожної секунди.',
            icon: Clock
        },
        {
            id: 'disableHoverEffects',
            label: 'Вимкнути ефекти наведення',
            desc: 'Вимкнення підсвічування рядків та стовпців при наведенні мишки. Максимальна швидкодія.',
            icon: Zap
        }
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <Settings className="text-indigo-400" size={32} />
                    Налаштування
                </h2>
                <p className="text-[#a1a1aa] font-medium mt-2">
                    Керуйте параметрами продуктивності та персоналізацією інтерфейсу
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personalization Section */}
                <div className="bento-card border-white/5 bg-[#1a1a1e] p-6 space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <Users className="text-emerald-400" size={20} />
                        <h3 className="text-lg font-black text-white uppercase tracking-widest text-sm">Персоналізація</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">Виберіть вашу роль</label>
                            <div className="grid grid-cols-2 gap-3 p-1.5 bg-black/20 rounded-2xl border border-white/5">
                                <button
                                    onClick={() => handleRoleSwitch('admin')}
                                    className={cn(
                                        "flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs transition-all",
                                        userRole === 'admin'
                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                            : "text-[#a1a1aa] hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <Unlock size={14} /> ЗАВУЧ
                                </button>
                                <button
                                    onClick={() => handleRoleSwitch('teacher')}
                                    className={cn(
                                        "flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs transition-all",
                                        userRole === 'teacher'
                                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                            : "text-[#a1a1aa] hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <Users size={14} /> ВЧИТЕЛЬ
                                </button>
                            </div>
                        </div>

                        {userRole === 'teacher' && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">Хто ви?</label>
                                <div className="relative group">
                                    <select
                                        value={selectedTeacherId || ''}
                                        onChange={(e) => setSelectedTeacherId(e.target.value || null)}
                                        className="w-full bg-black/20 border border-white/10 text-white text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">-- ОБЕРІТЬ СЕБЕ --</option>
                                        {teachers
                                            .sort((a, b) => a.name.localeCompare(b.name, 'uk'))
                                            .map(t => (
                                                <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                                        <Info size={16} />
                                    </div>
                                    <p className="text-[10px] text-emerald-400/80 font-medium leading-relaxed mt-0.5">
                                        Вибір вчителя дозволить переглядати персоналізований дашборд та ваш графік навантаження.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Data Management Section */}
                <div className="bento-card border-white/5 bg-[#1a1a1e] p-6 space-y-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <Database className="text-blue-400" size={20} />
                            <h3 className="text-lg font-black text-white uppercase tracking-widest text-sm">Дані та Бекапи</h3>
                        </div>

                        <div className="mt-6 space-y-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                                <div className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">Збереження</div>
                                <p className="text-[10px] text-[#a1a1aa] leading-relaxed">
                                    Дані автоматично зберігаються в базі даних браузера (IndexedDB).
                                    Рекомендуємо робити резервну копію раз на тиждень.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={async () => {
                                        try {
                                            const data = await getAllData();
                                            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `school_os_backup_${new Date().toISOString().split('T')[0]}.json`;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            URL.revokeObjectURL(url);
                                        } catch (e) {
                                            console.error('Export failed', e);
                                            alert('Помилка при створенні резервної копії');
                                        }
                                    }}
                                    className="flex flex-col items-center justify-center gap-2 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white transition-all border border-blue-500/20 active:scale-95"
                                >
                                    <Download size={20} />
                                    Завантажити<br />Бекап
                                </button>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".json"
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            if (confirm('УВАГА! Всі поточні дані будуть замінені даними з файлу. Це дію неможливо скасувати. Продовжити?')) {
                                                try {
                                                    const text = await file.text();
                                                    const data = JSON.parse(text);
                                                    await restoreData(data);
                                                    alert('Дані успішно відновлено! Сторінка буде перезавантажена.');
                                                    window.location.reload();
                                                } catch (err) {
                                                    console.error('Import failed', err);
                                                    alert('Помилка при відновленні даних. Перевірте файл.');
                                                }
                                            }
                                            // Reset input
                                            e.target.value = '';
                                        }}
                                    />
                                    <button
                                        className="w-full h-full flex flex-col items-center justify-center gap-2 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-all border border-emerald-500/20 active:scale-95"
                                    >
                                        <Upload size={20} />
                                        Відновити<br />з файлу
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/5">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                            <Cpu className="text-indigo-400" size={20} />
                            <h3 className="text-lg font-black text-white uppercase tracking-widest text-sm">Система</h3>
                        </div>

                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3 mb-4">
                            <div className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">Версія додатку</div>
                        </div>
                    </div>

                    <div
                        onClick={() => setShowExperimentalFeatures(!showExperimentalFeatures)}
                        className={cn(
                            "flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer group mb-4",
                            showExperimentalFeatures
                                ? "bg-amber-600/10 border-amber-500/30"
                                : "bg-white/5 border-transparent hover:border-white/10"
                        )}
                    >
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                            showExperimentalFeatures ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "bg-white/5 text-[#a1a1aa] group-hover:text-white"
                        )}>
                            <FlaskConical size={20} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-white text-xs">Експериментальні функції</span>
                                <div className={cn(
                                    "w-8 h-4 rounded-full relative transition-colors",
                                    showExperimentalFeatures ? "bg-amber-500" : "bg-white/10"
                                )}>
                                    <div className={cn(
                                        "absolute top-1 w-2 h-2 bg-white rounded-full transition-all",
                                        showExperimentalFeatures ? "left-5" : "left-1"
                                    )} />
                                </div>
                            </div>
                            <p className="text-[10px] text-[#a1a1aa] leading-relaxed font-medium">
                                Активувати доступ до функцій у стадії розробки (наприклад, альтернативні солвери).
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleReset}
                        className="w-full py-4 rounded-2xl font-black bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all border border-red-500/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Trash2 size={18} />
                        Скинути семестр
                    </button>
                </div>
            </div>

            {/* Performance Section */}
            <div className="bento-card border-white/5 bg-[#1a1a1e] p-8 space-y-8">
                <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                    <Zap className="text-amber-400" size={24} />
                    <h3 className="text-xl font-black text-white uppercase tracking-widest">Параметри продуктивності</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {performanceOptions.map((opt) => (
                        <div
                            key={opt.id}
                            onClick={() => togglePerf(opt.id as keyof PerformanceSettings)}
                            className={cn(
                                "flex items-start gap-4 p-5 rounded-[24px] border transition-all cursor-pointer group",
                                perfSettings[opt.id as keyof PerformanceSettings]
                                    ? "bg-indigo-600/10 border-indigo-500/30"
                                    : "bg-white/5 border-transparent hover:border-white/10"
                            )}
                        >
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                                perfSettings[opt.id as keyof PerformanceSettings] ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-white/5 text-[#a1a1aa] group-hover:text-white"
                            )}>
                                <opt.icon size={22} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="font-bold text-white text-sm">{opt.label}</span>
                                    <div className={cn(
                                        "w-8 h-4 rounded-full relative transition-colors",
                                        perfSettings[opt.id as keyof PerformanceSettings] ? "bg-indigo-500" : "bg-white/10"
                                    )}>
                                        <div className={cn(
                                            "absolute top-1 w-2 h-2 bg-white rounded-full transition-all",
                                            perfSettings[opt.id as keyof PerformanceSettings] ? "left-5" : "left-1"
                                        )} />
                                    </div>
                                </div>
                                <p className="text-[10px] text-[#a1a1aa] leading-relaxed font-medium">
                                    {opt.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <AdminPasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onSuccess={() => setUserRole('admin')}
            />
        </div>
    );
}
