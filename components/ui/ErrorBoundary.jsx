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
        <div className="p-5 rounded-3xl bg-white border border-rose-100 text-slate-800 text-xs space-y-3 m-3 shadow-sm">
          <div className="flex items-center gap-2 text-rose-600 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>DevLocator Inspector encountered an error</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono break-all bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            {this.state.error?.message || 'Unknown runtime error'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="flex items-center gap-1.5 px-4 py-2 text-xs rounded-full bg-[#0066ff] hover:bg-[#0052cc] text-white font-semibold shadow-sm transition-all"
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

