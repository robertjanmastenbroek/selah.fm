'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ margin: 0, background: '#0F0F23', color: '#F0F0F0', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(67,56,202,0.25) 0%, #0F0F23 60%), #0F0F23',
          padding: '1rem',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '320px' }}>
            <div style={{ fontSize: '3rem', opacity: 0.08, userSelect: 'none', marginBottom: '0.5rem' }}>!</div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.5rem' }}>Critical error</h1>
            <p style={{ fontSize: '0.875rem', color: '#8C8C8C', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
              The application encountered an unexpected error. Please try reloading the page.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent', color: '#8C8C8C', fontSize: '0.8125rem', cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Go home
              </button>
              <button
                onClick={() => reset()}
                style={{
                  padding: '0.5rem 1.25rem', borderRadius: '0.75rem', border: 'none',
                  background: '#4338CA', color: '#fff', fontSize: '0.8125rem', cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
