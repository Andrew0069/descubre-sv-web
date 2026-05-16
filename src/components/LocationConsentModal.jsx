export default function LocationConsentModal({ onAccept, onDecline }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      backgroundColor: 'rgba(17, 24, 39, 0.42)',
      backdropFilter: 'blur(6px)',
    }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-consent-title"
        style={{
          width: '100%',
          maxWidth: '430px',
          backgroundColor: '#ffffff',
          color: '#111827',
          borderRadius: '14px',
          boxShadow: '0 24px 70px rgba(0,0,0,0.24)',
          padding: '24px',
          border: '1px solid rgba(229, 231, 235, 0.9)',
        }}
      >
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '999px',
          backgroundColor: 'rgba(14, 165, 233, 0.12)',
          color: '#0284c7',
          display: 'grid',
          placeItems: 'center',
          fontSize: '1.35rem',
          marginBottom: '14px',
        }}>
          📍
        </div>

        <h2 id="location-consent-title" style={{ margin: '0 0 10px', fontSize: '1.2rem', fontWeight: 800 }}>
          Permitir ubicación para seguridad
        </h2>
        <p style={{ margin: '0 0 12px', color: '#4b5563', fontSize: '0.94rem', lineHeight: 1.55 }}>
          Spotter puede registrar tu ubicación aproximada al iniciar sesión para ayudar a detectar accesos sospechosos y proteger tu cuenta.
        </p>
        <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: '0.85rem', lineHeight: 1.5 }}>
          Esta decisión es independiente de las cookies y la caché. Si elegís ahora no, no volveremos a pedirlo en cada inicio de sesión.
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onDecline}
            style={{
              border: '1px solid #d1d5db',
              backgroundColor: '#ffffff',
              color: '#374151',
              borderRadius: '8px',
              padding: '10px 16px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Ahora no
          </button>
          <button
            type="button"
            onClick={onAccept}
            style={{
              border: 'none',
              backgroundColor: '#0EA5E9',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '10px 16px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 8px 18px rgba(14, 165, 233, 0.25)',
            }}
          >
            Permitir ubicación
          </button>
        </div>
      </div>
    </div>
  )
}
