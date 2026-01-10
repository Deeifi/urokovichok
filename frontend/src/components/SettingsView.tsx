import React from 'react';
import { Settings, Zap, Trash2, ShieldAlert, Cpu, Image as ImageIcon, Wind, Clock, Layers } from 'lucide-react';
import { cn } from '../utils/cn';
import type { PerformanceSettings } from '../types';

interface SettingsViewProps {
    perfSettings: PerformanceSettings;
    setPerfSettings: (s: PerformanceSettings) => void;
    handleReset: () => void;
}

export function SettingsView({ perfSettings, setPerfSettings, handleReset }: SettingsViewProps) {
    const togglePerf = (key: keyof PerformanceSettings) => {
        setPerfSettings({
            ...perfSettings,
            [key]: !perfSettings[key]
        });
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
        }
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <Settings className="text-indigo-400" size={32} />
                    Налаштування
                </h2>
                <p className="text-[#a1a1aa] font-medium mt-2">
                    Керуйте параметрами продуктивності та безпекою даних
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Performance Section */}
                <div className="bento-card border-white/5 bg-[#1a1a1e] p-6 space-y-6">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <Zap className="text-amber-400" size={20} />
                        <h3 className="text-lg font-black text-white uppercase tracking-widest text-sm">Продуктивність</h3>
                    </div>

                    <div className="space-y-4">
                        {performanceOptions.map((opt) => (
                            <div
                                key={opt.id}
                                onClick={() => togglePerf(opt.id as keyof PerformanceSettings)}
                                className={cn(
                                    "flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer group",
                                    perfSettings[opt.id as keyof PerformanceSettings]
                                        ? "bg-indigo-600/10 border-indigo-500/30"
                                        : "bg-white/5 border-transparent hover:border-white/10"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                    perfSettings[opt.id as keyof PerformanceSettings] ? "bg-indigo-500 text-white" : "bg-white/5 text-[#a1a1aa] group-hover:text-white"
                                )}>
                                    <opt.icon size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-white text-sm">{opt.label}</span>
                                        <div className={cn(
                                            "w-10 h-5 rounded-full relative transition-colors",
                                            perfSettings[opt.id as keyof PerformanceSettings] ? "bg-indigo-500" : "bg-white/10"
                                        )}>
                                            <div className={cn(
                                                "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                                                perfSettings[opt.id as keyof PerformanceSettings] ? "left-6" : "left-1"
                                            )} />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-[#a1a1aa] leading-relaxed">
                                        {opt.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Data Section */}
                <div className="flex flex-col gap-6">
                    <div className="bento-card border-white/5 bg-[#1a1a1e] p-6 space-y-6">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <Cpu className="text-indigo-400" size={20} />
                            <h3 className="text-lg font-black text-white uppercase tracking-widest text-sm">Система</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                                <div className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest">Версія додатку</div>
                                <div className="text-xl font-black text-white">v2.0.4 <span className="text-[10px] text-indigo-400 ml-2">PREMIUM</span></div>
                                <p className="text-[10px] text-[#a1a1aa]">Всі системи працюють у штатному режимі. Дані зберігаються локально.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bento-card border-red-500/10 bg-red-500/[0.02] p-6 space-y-6">
                        <div className="flex items-center gap-3 border-b border-red-500/10 pb-4 text-red-500">
                            <Trash2 size={20} />
                            <h3 className="text-lg font-black uppercase tracking-widest text-sm">Зона ризику</h3>
                        </div>

                        <div className="space-y-4">
                            <p className="text-xs text-red-200/60 leading-relaxed">
                                Повне очищення видалить всі ваші класи, вчителів та згенерований розклад. Цю дію неможливо скасувати.
                            </p>
                            <button
                                onClick={handleReset}
                                className="w-full py-4 rounded-2xl font-black bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all border border-red-500/20 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Trash2 size={18} />
                                Очистити всі дані
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
