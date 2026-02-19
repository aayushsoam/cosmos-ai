import type { ComponentType, ErrorInfo, ReactElement } from 'react';
import { Component } from 'react';

class ErrorBoundary extends Component<
  {
    children: ReactElement;
    fallback: ReactElement;
  },
  {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
  }
> {
  state: { hasError: boolean; error?: Error; errorInfo?: ErrorInfo } = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16 }}>
          {this.props.fallback}
          {this.state.error && (
            <pre
              style={{
                marginTop: 12,
                padding: 12,
                background: '#111827',
                color: '#e5e7eb',
                border: '1px solid #374151',
                borderRadius: 8,
                whiteSpace: 'pre-wrap',
                overflow: 'auto',
                maxHeight: 320,
              }}>
              {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
              {this.state.errorInfo?.componentStack ? `\n\n${this.state.errorInfo.componentStack}` : ''}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export function withErrorBoundary<T extends Record<string, unknown>>(
  Component: ComponentType<T>,
  ErrorComponent: ReactElement,
) {
  return function WithErrorBoundary(props: T) {
    return (
      <ErrorBoundary fallback={ErrorComponent}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
