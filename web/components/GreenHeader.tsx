interface Props {
  title: string;
  subtitle?: string;
  dotIndex?: number;    // 0-based, which dot is active
  totalDots?: number;
  onBack?: () => void;
  showBack?: boolean;
}

export default function GreenHeader({ title, subtitle, dotIndex, totalDots = 5, onBack, showBack }: Props) {
  return (
    <div style={{
      backgroundColor: '#1E8A4F',
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      padding: '52px 24px 28px',
      position: 'relative',
    }}>
      {showBack && onBack && (
        <button
          onClick={onBack}
          aria-label="Go back"
          style={{
            position: 'absolute',
            top: 52,
            left: 20,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.18)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#FFFFFF',
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          ‹
        </button>
      )}

      {dotIndex !== undefined && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, paddingLeft: showBack ? 52 : 0 }}>
          {Array.from({ length: totalDots }, (_, i) => (
            <div key={i} style={{
              height: 6,
              borderRadius: 3,
              backgroundColor: i === dotIndex ? '#FFFFFF' : 'rgba(255,255,255,0.35)',
              width: i === dotIndex ? 18 : 6,
            }} />
          ))}
        </div>
      )}

      <h1 style={{
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 700,
        fontSize: 28,
        color: '#FFFFFF',
        marginBottom: subtitle ? 6 : 0,
        letterSpacing: '-0.01em',
        lineHeight: 1.25,
      }}>
        {title}
      </h1>

      {subtitle && (
        <p style={{
          fontFamily: 'Lato, sans-serif',
          fontSize: 15,
          color: 'rgba(255,255,255,0.82)',
          lineHeight: 1.5,
        }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
