import React, { useState, useEffect } from 'react';
import { X, Play, Settings2, Clock, Beaker, Dna, Cpu, Brain, LayoutGrid, Layers, CheckCircle, ArrowRight, Circle } from 'lucide-react';
import { useUIStore } from '../store/useUIStore';

interface GenerationSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (strategy: 'ortools' | 'pulp' | 'genetic', timeout: number, geneticParams?: { populationSize: number, generations: number, mutationRate: number }) => void;
    isGenerating: boolean;
    progress?: number;
    statusMessage?: string;
}

export const GenerationSettingsModal: React.FC<GenerationSettingsModalProps> = ({
    isOpen,
    onClose,
    onGenerate,
    isGenerating,
    progress = 0,
    statusMessage = ''
}) => {
    const [strategy, setStrategy] = useState<'ortools' | 'pulp' | 'genetic'>('ortools');
    const [timeout, setTimeoutVal] = useState(30);

    // Genetic Params
    const [popSize, setPopSize] = useState(8);
    const [generations, setGenerations] = useState(3);
    const [mutationRate, setMutationRate] = useState(40); // 40%

    const showExperimentalFeatures = useUIStore(s => s.showExperimentalFeatures);

    // Animation state for central icon
    const [currentStage, setCurrentStage] = useState(0);

    // Define stages based on progress
    const stages = [
        { icon: Cpu, label: 'Підготовка', range: [0, 15] },
        { icon: LayoutGrid, label: 'Розміщення уроків', range: [15, 60] },
        { icon: Layers, label: 'Оптимізація', range: [60, 90] },
        { icon: CheckCircle, label: 'Завершення', range: [90, 100] }
    ];

    useEffect(() => {
        if (isGenerating) {
            // Determine current stage based on progress
            const stage = stages.findIndex(s => progress >= s.range[0] && progress < s.range[1]);
            if (stage !== -1 && stage !== currentStage) {
                setCurrentStage(stage);
            }
            if (progress >= 90 && currentStage !== 3) {
                setCurrentStage(3);
            }
        } else {
            setCurrentStage(0);
        }
    }, [isGenerating, progress]);

    if (!isOpen) return null;

    const CurrentIcon = stages[currentStage].icon;

    const handleGenerate = () => {
        onGenerate(strategy, timeout, strategy === 'genetic' ? {
            populationSize: popSize,
            generations: generations,
            mutationRate: mutationRate / 100.0
        } : undefined);
    };

    // Parse status message to make it user-friendly
    const getFriendlyMessage = (msg: string) => {
        if (!msg) return 'Підготовка до генерації...';

        // Convert technical messages to user-friendly
        if (msg.includes('Ініціалізація')) return 'Підготовка системи...';
        if (msg.includes('Покоління')) {
            const match = msg.match(/Покоління (\d+)\/(\d+)/);
            if (match) return `Крок ${match[1]} з ${match[2]}: Пошук оптимального варіанту`;
        }
        return msg;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg max-h-[90vh] flex flex-col bg-[#18181b] rounded-2xl shadow-2xl border border-white/5 overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-lg font-bold flex items-center gap-3 text-white">
                        <div className="w-9 h-9 bg-gradient-to-br from-[#6366f1] to-[#a855f7] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Settings2 className="w-5 h-5 text-white" />
                        </div>
                        {isGenerating ? 'Генерація Розкладу' : 'Налаштування Генерації'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                        disabled={isGenerating}
                    >
                        <X className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                    {isGenerating ? (
                        <div className="flex flex-col items-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Central Activity Icon */}
                            <div className="relative mt-4 w-32 h-32 mx-auto flex items-center justify-center">
                                {/* Orbiting ring - clearly outside the icon */}
                                <div className="absolute inset-2 rounded-full border border-white/5" />
                                <div className="absolute inset-2 rounded-full border-2 border-t-indigo-500/60 border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '3s' }} />

                                {/* Inner squircle icon - centered and smaller than the ring */}
                                <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-[#6366f1] to-[#a855f7] rounded-[1.8rem] flex items-center justify-center shadow-xl shadow-indigo-500/20 border border-white/10">
                                    <CurrentIcon className="w-10 h-10 text-white transition-all duration-700 ease-in-out" />
                                </div>

                                {/* Subtle glow overlay to tie it together */}
                                <div className="absolute inset-0 bg-indigo-500/5 blur-2xl rounded-full -z-10 animate-pulse" />
                            </div>

                            {/* Progress Description */}
                            <div className="text-center space-y-3 px-4">
                                <h3 className="text-xl font-bold text-white leading-tight">
                                    {getFriendlyMessage(statusMessage)}
                                </h3>
                                <div className="flex items-center justify-center gap-3">
                                    <div className="h-px w-10 bg-zinc-700" />
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">
                                        {strategy === 'ortools' ? 'Google OR-Tools' : (strategy === 'genetic' ? 'Генетичний Алгоритм' : 'PuLP Solver')}
                                    </p>
                                    <div className="h-px w-10 bg-zinc-700" />
                                </div>
                            </div>

                            {/* Linear Progress Bar */}
                            <div className="w-full space-y-4">
                                <div className="relative h-2 w-full bg-zinc-800/50 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#a855f7] shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all duration-1000 ease-out relative"
                                        style={{ width: `${progress}%` }}
                                    >
                                        {/* Shimmer effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                    </div>
                                </div>

                                {/* Progress Metrics */}
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <span className="font-bold">Етап {currentStage + 1} з {stages.length}</span>
                                        <span className="text-zinc-700">•</span>
                                        <span className="text-xs">{stages[currentStage].label}</span>
                                    </div>
                                    <span className="font-black text-white tabular-nums text-lg">{progress}%</span>
                                </div>
                            </div>

                            {/* Step Checklist */}
                            <div className="w-full bg-zinc-900/50 rounded-xl border border-white/5 p-4 space-y-2">
                                {stages.map((stage, idx) => {
                                    const isCompleted = currentStage > idx;
                                    const isCurrent = currentStage === idx;
                                    const isPending = currentStage < idx;

                                    return (
                                        <div
                                            key={idx}
                                            className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-500 ${isCurrent ? 'bg-indigo-500/10' : ''
                                                }`}
                                        >
                                            {isCompleted && (
                                                <CheckCircle className="w-5 h-5 text-green-500 animate-in zoom-in duration-300" />
                                            )}
                                            {isCurrent && (
                                                <ArrowRight className="w-5 h-5 text-indigo-400 animate-pulse" />
                                            )}
                                            {isPending && (
                                                <Circle className="w-5 h-5 text-zinc-700" />
                                            )}
                                            <span className={`text-sm font-medium ${isCompleted ? 'text-green-400 line-through' :
                                                isCurrent ? 'text-white font-bold' :
                                                    'text-zinc-600'
                                                }`}>
                                                {stage.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Strategy Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
                                    Алгоритм Генерації
                                </label>
                                <div className="grid grid-cols-1 gap-3">
                                    <label className={`
                                        relative flex items-start gap-4 p-5 rounded-xl border cursor-pointer transition-all
                                        ${strategy === 'ortools'
                                            ? 'border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/10'
                                            : 'border-white/5 hover:border-white/10 hover:bg-white/[0.02]'}
                                    `}>
                                        <div className="mt-1">
                                            <input
                                                type="radio"
                                                name="strategy"
                                                value="ortools"
                                                checked={strategy === 'ortools'}
                                                onChange={() => setStrategy('ortools')}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${strategy === 'ortools'
                                                ? 'border-indigo-500 bg-indigo-500'
                                                : 'border-zinc-600'
                                                }`}>
                                                {strategy === 'ortools' && <div className="w-2 h-2 bg-white rounded-full" />}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-white mb-1">Google OR-Tools</div>
                                            <p className="text-xs text-zinc-400 leading-relaxed">
                                                Рекомендовано. Швидкий та надійний солвер для складних розкладів.
                                            </p>
                                        </div>
                                    </label>

                                    {showExperimentalFeatures && (
                                        <>
                                            <label className={`
                                                relative flex items-start gap-4 p-5 rounded-xl border cursor-pointer transition-all
                                                ${strategy === 'pulp'
                                                    ? 'border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/10'
                                                    : 'border-white/5 hover:border-white/10 hover:bg-white/[0.02]'}
                                            `}>
                                                <div className="mt-1">
                                                    <input
                                                        type="radio"
                                                        name="strategy"
                                                        value="pulp"
                                                        checked={strategy === 'pulp'}
                                                        onChange={() => setStrategy('pulp')}
                                                        className="sr-only"
                                                    />
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${strategy === 'pulp'
                                                        ? 'border-indigo-500 bg-indigo-500'
                                                        : 'border-zinc-600'
                                                        }`}>
                                                        {strategy === 'pulp' && <div className="w-2 h-2 bg-white rounded-full" />}
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="font-bold text-white">PuLP (CBC)</div>
                                                        <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                                                            Альфа
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                                        Математичне програмування. Точніший, але може бути повільнішим.
                                                    </p>
                                                </div>
                                            </label>

                                            <label className={`
                                                relative flex items-start gap-4 p-5 rounded-xl border cursor-pointer transition-all
                                                ${strategy === 'genetic'
                                                    ? 'border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/10'
                                                    : 'border-white/5 hover:border-white/10 hover:bg-white/[0.02]'}
                                            `}>
                                                <div className="mt-1">
                                                    <input
                                                        type="radio"
                                                        name="strategy"
                                                        value="genetic"
                                                        checked={strategy === 'genetic'}
                                                        onChange={() => setStrategy('genetic')}
                                                        className="sr-only"
                                                    />
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${strategy === 'genetic'
                                                        ? 'border-indigo-500 bg-indigo-500'
                                                        : 'border-zinc-600'
                                                        }`}>
                                                        {strategy === 'genetic' && <div className="w-2 h-2 bg-white rounded-full" />}
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="font-bold text-white">Генетичний Алгоритм</div>
                                                        <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">
                                                            Новинка
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                                        Еволюційний підхід. Оптимізує вікна між уроками.
                                                    </p>
                                                </div>
                                            </label>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Timeout Slider */}
                            {strategy !== 'genetic' && (
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-indigo-400" />
                                            Час на пошук рішення
                                        </label>
                                        <span className="text-sm font-black text-white bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20 tabular-nums">
                                            {timeout} сек
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="5"
                                        max="120"
                                        step="5"
                                        value={timeout}
                                        onChange={(e) => setTimeoutVal(parseInt(e.target.value))}
                                        className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-indigo-500 [&::-webkit-slider-thumb]:to-purple-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-indigo-500/50 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
                                    />
                                    <p className="text-xs text-zinc-500">
                                        💡 Більше часу = кращий результат
                                    </p>
                                </div>
                            )}

                            {/* Genetic Settings */}
                            {strategy === 'genetic' && (
                                <div className="space-y-5 pt-4 border-t border-white/5">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
                                        <Dna className="w-4 h-4" />
                                        Параметри Еволюції
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-3 p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Популяція</label>
                                                <span className="text-base font-black text-white tabular-nums">{popSize}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="4"
                                                max="20"
                                                step="2"
                                                value={popSize}
                                                onChange={(e) => setPopSize(parseInt(e.target.value))}
                                                className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-purple-500/50"
                                            />
                                        </div>

                                        <div className="space-y-3 p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Покоління</label>
                                                <span className="text-base font-black text-white tabular-nums">{generations}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="1"
                                                max="10"
                                                step="1"
                                                value={generations}
                                                onChange={(e) => setGenerations(parseInt(e.target.value))}
                                                className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-purple-500/50"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3 p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Рівень Мутації</label>
                                            <span className="text-base font-black text-white tabular-nums">{mutationRate}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="10"
                                            max="60"
                                            step="5"
                                            value={mutationRate}
                                            onChange={(e) => setMutationRate(parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-pink-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-pink-500/50"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                        disabled={isGenerating}
                    >
                        {isGenerating ? 'Закрити' : 'Скасувати'}
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-br from-[#6366f1] to-[#a855f7] hover:from-[#5558e3] hover:to-[#9333ea] text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Генерується
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 fill-white" />
                                Почати Генерацію
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
