'use client';

export default function EducationPage() {
  return (
    <div className="page page-top" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <p style={{ fontSize: 48, marginBottom: 16 }}>📖</p>
      <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 22, color: 'var(--text)', marginBottom: 8 }}>
        Learn
      </h1>
      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Understanding your cycle and health through every stage.
      </p>
      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>
        Coming soon
      </p>
    </div>
  );
}
