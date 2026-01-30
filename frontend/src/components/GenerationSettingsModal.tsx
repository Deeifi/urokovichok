import React, { useState } from 'react';
import { X, Play, Settings2, Clock } from 'lucide-react';

interface GenerationSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (strategy: 'ortools' | 'pulp', timeout: number) => void;
    isGenerating: boolean;
}

export const GenerationSettingsModal: React.FC<GenerationSettingsModalProps> = ({
    isOpen,
    onClose,
    onGenerate,
    isGenerating
}) => {
    const [strategy, setStrategy] = useState<'ortools' | 'pulp'>('ortools');
    const [timeout, setTimeoutVal] = useState(30);

    if (!isOpen) return null;

    const handleGenerate = () => {
        onGenerate(strategy, timeout);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                        <Settings2 className="w-5 h-5 text-indigo-500" />
                        Налаштування Генерації
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
                        disabled={isGenerating}
                    >
                        <X className="w-5 h-5 text-zinc-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Strategy Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Алгоритм (Solver)
                        </label>
                        <div className="grid grid-cols-1 gap-3">
                            <label className={`
                                relative flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all
                                ${strategy === 'ortools'
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-500'
                                    : 'border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700'}
                            `}>
                                <div className="mt-0.5">
                                    <input
                                        type="radio"
                                        name="strategy"
                                        value="ortools"
                                        checked={strategy === 'ortools'}
                                        onChange={() => setStrategy('ortools')}
                                        className="sr-only"
                                    />
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${strategy === 'ortools' ? 'border-indigo-600 bg-indigo-600' : 'border-zinc-400'}`}>
                                        {strategy === 'ortools' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-zinc-900 dark:text-zinc-100">Google OR-Tools</div>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                        Рекомендовано. Швидкий та ефективний CP-SAT солвер.
                                    </p>
                                </div>
                            </label>

                            <label className={`
                                relative flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all
                                ${strategy === 'pulp'
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-500'
                                    : 'border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700'}
                            `}>
                                <div className="mt-0.5">
                                    <input
                                        type="radio"
                                        name="strategy"
                                        value="pulp"
                                        checked={strategy === 'pulp'}
                                        onChange={() => setStrategy('pulp')}
                                        className="sr-only"
                                    />
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${strategy === 'pulp' ? 'border-indigo-600 bg-indigo-600' : 'border-zinc-400'}`}>
                                        {strategy === 'pulp' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium text-zinc-900 dark:text-zinc-100">PuLP (CBC)</div>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                        Класичний підхід Mixed Integer Programming. Більш точний, але може бути повільнішим.
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Timeout Slider */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Час на пошук
                            </label>
                            <span className="text-sm font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
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
                            className="w-full accent-indigo-600 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-xs text-zinc-500">
                            Більше часу = кращий результат, але довше очікування.
                        </p>
                    </div>


                </div>

                {/* Footer */}
                <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        disabled={isGenerating}
                    >
                        Скасувати
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Генерація...
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
