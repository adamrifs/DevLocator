import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

/**
 * ErrorBoundary catches runtime rendering errors and displays a recovery banner
 * preventing the entire InspectorPanel from unmounting.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[DevLocator] Rendering error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800 text-slate-200 text-xs space-y-3 m-2">
          <div className="flex items-center gap-2 text-rose-400 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>DevLocator Inspector encountered an error</span>
          </div>
          <p className="text-[11px] text-slate-300 font-mono break-all bg-slate-950/60 p-2 rounded border border-rose-900/50">
            {this.state.error?.message || 'Unknown runtime error'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-rose-500 hover:bg-rose-400 text-white font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset View</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
