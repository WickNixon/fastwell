import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <nav style={{
        width: 220,
        background: '#FFFFFF',
        borderRight: '1px solid #C8DFB0',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        <h2 style={{ fontSize: 20, marginBottom: 24, color: '#5C8A34', fontFamily: 'Montserrat, sans-serif' }}>
          Fastwell
        </h2>

        {[
          { href: '/dashboard', label: '📊 Overview' },
          { href: '/dashboard/members', label: '👥 Members' },
          { href: '/dashboard/invites', label: '✉️ Invites' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'block',
              padding: '10px 12px',
              borderRadius: 8,
              color: '#2C4A1A',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Main content */}
      <main style={{ flex: 1, padding: '40px 40px', overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
