import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './popup.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[DevLocator Popup Error]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: '#f87171', background: '#0f172a', fontFamily: 'monospace', fontSize: '12px' }}>
          <h4 style={{ fontWeight: 'bold', marginBottom: '8px' }}>DevLocator Popup Error</h4>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#fca5a5' }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}

