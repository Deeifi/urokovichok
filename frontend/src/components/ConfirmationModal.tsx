
import { Trash2, X, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning';
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Видалити',
    cancelText = 'Скасувати',
    variant = 'danger'
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-[#18181b] w-full max-w-sm rounded-[32px] border border-white/10 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-8 text-center">
                    <div className={cn(
                        "w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-6",
                        variant === 'danger' ? "bg-red-500/20 text-red-500" : "bg-amber-500/20 text-amber-500"
                    )}>
                        {variant === 'danger' ? <Trash2 size={40} /> : <AlertTriangle size={40} />}
                    </div>

                    <h3 className="text-2xl font-black text-white mb-2 leading-tight">
                        {title}
                    </h3>

                    <p className="text-[#a1a1aa] font-medium text-sm leading-relaxed px-2">
                        {description}
                    </p>
                </div>

                <div className="p-6 pt-0 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 rounded-2xl font-bold bg-white/5 hover:bg-white/10 text-white transition-all active:scale-95"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={cn(
                            "flex-1 py-4 rounded-2xl font-bold text-white transition-all active:scale-95 shadow-lg",
                            variant === 'danger'
                                ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                                : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                        )}
                    >
                        {confirmText}
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-[#a1a1aa] hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
}
