import { Component, ReactNode } from 'react';

interface Props  { children: ReactNode; }
interface State  { error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[BonusByte] Uncaught error:', error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#000',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px', fontFamily: 'monospace',
      }}>
        <img src="/logo.png" alt="" style={{ width: 56, marginBottom: 20, opacity: 0.5 }} />
        <p style={{ color: '#EF5350', fontWeight: 800, fontSize: 14, marginBottom: 8 }}>
          App Error
        </p>
        <p style={{
          color: '#9A9A9A', fontSize: 11, textAlign: 'center',
          background: '#111', padding: '12px 16px', borderRadius: 8,
          border: '1px solid #333', maxWidth: 340, wordBreak: 'break-word',
          lineHeight: 1.6,
        }}>
          {error.message}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 20, background: 'linear-gradient(180deg,#D0D0D0,#9A9A9A)',
            border: 'none', borderRadius: 8, padding: '10px 24px',
            fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#111',
          }}
        >
          Reload App
        </button>
      </div>
    );
  }
}
