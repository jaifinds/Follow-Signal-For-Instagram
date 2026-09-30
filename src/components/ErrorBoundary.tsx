import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Chronograph component caught error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#0D1015] border border-red-500/20 rounded-2xl p-8 text-center space-y-4 my-4">
          <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-800 flex items-center justify-center text-red-400 mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-serif font-bold text-[#F4F1E8]">
              {this.props.fallbackTitle || 'Display Interruption Recovered'}
            </h3>
            <p className="text-xs text-zinc-400 font-sans max-w-md mx-auto">
              {this.props.fallbackMessage ||
                'A component encountered a rendering issue. Your underlying snapshot data remains intact and secure in your local vault.'}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-[#12161E] hover:bg-[#1A202A] border border-white/10 text-xs font-mono text-[#F4F1E8] rounded-lg transition inline-flex items-center space-x-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Component View</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
