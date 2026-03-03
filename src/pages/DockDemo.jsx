import { AppleStyleDock } from '../components/ui/dock-demo';

export default function DockDemo() {
  return (
    <main className="page" style={{ padding: '3rem', minHeight: '70vh' }}>
      <h1 className="admin-page-title" style={{ marginBottom: '1rem' }}>
        Dock
      </h1>
      <p style={{ color: 'var(--text-muted)', marginTop: 0, marginBottom: '1.5rem' }}>
        Hover the icons to see the magnification.
      </p>

      <div
        className="auth-card"
        style={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: 420,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Demo area</p>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)' }}>
            The dock is pinned to the bottom of this card.
          </p>
        </div>

        <AppleStyleDock />
      </div>
    </main>
  );
}

