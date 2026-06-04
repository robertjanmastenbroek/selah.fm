'use client';

import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export default class DashboardErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0F0F23' }}>
          <div className="text-center max-w-md space-y-4">
            <p className="text-2xl">⚠️</p>
            <h2 className="text-lg font-semibold text-red-400">Dashboard Error</h2>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-left">
              <p className="text-xs font-mono text-red-300 break-all">{this.state.error.message}</p>
              {this.state.error.stack && (
                <details className="mt-2">
                  <summary className="text-[10px] text-muted-foreground cursor-pointer">Stack trace</summary>
                  <pre className="text-[9px] text-muted-foreground/50 mt-1 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
            <button onClick={() => window.location.reload()} 
              className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90">
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
