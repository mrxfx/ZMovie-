import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'An unexpected rendering error occurred.',
    };
  }

  componentDidCatch(error: Error) {
    console.error('ZyvoMovie ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0D0F14] text-white flex items-center justify-center p-6">
          <div className="max-w-lg w-full glass-elevated glass-specular rounded-3xl p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#E50914]/20 border border-[#E50914]/35 text-[#E50914] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-2 text-white">Something went wrong</h1>
            <p className="text-sm text-white/70 mb-6 break-words">
              {this.state.message}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E50914] hover:bg-[#B20710] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Reload Page
              </button>
              <a
                href="/"
                className="inline-flex items-center px-5 py-2.5 rounded-full glass-control text-sm font-medium text-white hover:bg-white/20 transition-colors"
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
