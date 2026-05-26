import { useCallback } from 'react';

/**
 * Fallback UI shown when React encounters an unrecoverable error.
 * Used by Sentry.ErrorBoundary in main.jsx.
 */
export default function ErrorFallback({ error, resetError }) {
  const handleRetry = useCallback(() => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  }, [resetError]);

  const handleGoHome = useCallback(() => {
    window.location.href = '/';
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.iconWrapper}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h1 style={styles.title}>Something went wrong</h1>
        <p style={styles.message}>
          We're sorry — an unexpected error occurred. Our team has been automatically notified and is looking into it.
        </p>

        {error?.message && import.meta.env.DEV && (
          <details style={styles.details}>
            <summary style={styles.summary}>Error details (dev only)</summary>
            <pre style={styles.pre}>{error.message}</pre>
            {error.stack && <pre style={styles.pre}>{error.stack}</pre>}
          </details>
        )}

        <div style={styles.actions}>
          <button onClick={handleRetry} style={styles.primaryBtn}>
            Try Again
          </button>
          <button onClick={handleGoHome} style={styles.secondaryBtn}>
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '1rem',
    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  card: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '1.5rem',
    padding: '3rem 2rem',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
  },
  iconWrapper: {
    marginBottom: '1.5rem',
  },
  title: {
    color: '#ffffff',
    fontSize: '1.5rem',
    fontWeight: '700',
    margin: '0 0 0.75rem',
  },
  message: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    margin: '0 0 1.5rem',
  },
  details: {
    textAlign: 'left',
    marginBottom: '1.5rem',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '0.75rem',
    padding: '0.75rem 1rem',
  },
  summary: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '0.8rem',
    cursor: 'pointer',
    marginBottom: '0.5rem',
  },
  pre: {
    color: '#fca5a5',
    fontSize: '0.75rem',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: '0.5rem 0 0',
  },
  actions: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryBtn: {
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '0.75rem',
    padding: '0.75rem 1.5rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  secondaryBtn: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '0.75rem',
    padding: '0.75rem 1.5rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
};
