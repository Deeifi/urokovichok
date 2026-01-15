import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center p-12 bg-red-500/5 border border-red-500/10 rounded-[32px] text-center animate-in fade-in zoom-in duration-500 min-h-[400px]">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-red-500/20">
                        <AlertTriangle className="text-red-500" size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-3 tracking-tight">От халепа!</h2>
                    <p className="text-[#a1a1aa] mb-8 max-w-md font-medium leading-relaxed uppercase text-[10px] tracking-[0.2em]">
                        Сталася критична помилка при відображенні цього блоку.<br />
                        Ми вже повідомили про це в консоль.
                    </p>
                    <div className="p-4 bg-black/40 rounded-xl border border-white/5 mb-8 w-full max-w-lg overflow-hidden">
                        <code className="text-[10px] text-red-400/80 font-mono break-all">
                            {this.state.error?.message || 'Unknown Error'}
                        </code>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-3 bg-white text-black hover:bg-white/90 px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-white/5 uppercase text-xs tracking-widest active:scale-95"
                    >
                        <RefreshCw size={18} />
                        Перезавантажити додаток
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
