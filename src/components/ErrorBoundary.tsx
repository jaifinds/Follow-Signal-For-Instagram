import React, { Component, ErrorInfo, ReactNode } from 'react';

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
    console.error('Follow Signal component error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#0A0A0A] border border-[#1C1C1A] rounded-2xl p-8 text-center space-y-4 my-6 text-[#F5F5F2]">
          <div className="w-10 h-10 rounded-full bg-[#2A0B0E] border border-[#4A141A] flex items-center justify-center text-[#FF3048] mx-auto text-sm font-mono font-bold">
            !
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-sans font-bold text-[#F5F5F2]">
              {this.props.fallbackTitle || 'Workspace Display Interrupted'}
            </h3>
            <p className="text-xs text-[#9A9A96] font-sans max-w-md mx-auto leading-relaxed">
              {this.props.fallbackMessage ||
                'A component encountered an unexpected render state. Your local relationship snapshots remain safe in storage.'}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-[#141414] hover:bg-[#1C1C1A] border border-[#262624] text-xs font-mono text-[#F5F5F2] rounded-lg transition cursor-pointer"
          >
            Reset Workspace View
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
