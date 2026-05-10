'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props { children: ReactNode }
interface State { hasError: boolean }

export default class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Campaign page error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.2) 0%, #0A0A0A 60%), #0A0A0A' }}>
          <div className="text-center max-w-sm space-y-5">
            <img src="/images/error-state.png" alt="" className="mx-auto w-32 h-32 object-contain opacity-80" />
            <div>
              <h2 className="text-lg font-semibold mb-1">Something went sideways</h2>
              <p className="text-sm text-muted-foreground">
                A hiccup on our end. Nothing you did — we'll have it sorted in a moment.
              </p>
            </div>
            <Button variant="outline" onClick={() => window.location.href = '/'}>Go home</Button>
            <Button onClick={() => this.setState({ hasError: false })}>Try again</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
