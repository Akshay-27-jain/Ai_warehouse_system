import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    if (error?.message?.includes('Failed to fetch dynamically imported module')) {
      const storageKey = 'mcp_dynamic_import_reload';
      const lastReload = sessionStorage.getItem(storageKey);
      if (!lastReload) {
        sessionStorage.setItem(storageKey, 'true');
        window.location.reload();
      }
    }
  }

  handleRetry = () => {
    sessionStorage.removeItem('mcp_dynamic_import_reload');
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.message?.includes('Failed to fetch dynamically imported module');
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12">
          <div className="w-full max-w-xl rounded-[2rem] border border-slate-800 bg-slate-900/90 p-12 text-center shadow-[0_40px_120px_rgba(0,0,0,0.4)]">
            <p className="text-sm uppercase tracking-[0.32em] text-cyan-300/80">
              {isChunkError ? "Module Reload Needed" : "Something went wrong"}
            </p>
            <h1 className="mt-6 text-4xl font-semibold text-slate-100">
              {isChunkError ? "Server Bundle Updated" : "Application Error"}
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-400">
              {isChunkError
                ? "The development server bundle was updated. Click Refresh to load the latest module."
                : (this.state.error?.message || 'An unexpected error occurred.')}
            </p>
            <button
              onClick={this.handleRetry}
              className="mt-8 inline-flex rounded-3xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Refresh Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
