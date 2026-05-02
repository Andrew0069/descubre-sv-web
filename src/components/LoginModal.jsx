import { useNavigate } from 'react-router-dom'

export default function LoginModal({ mensaje, onClose }) {
  const navigate = useNavigate()

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        backgroundColor: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        padding: '2.5rem 2rem 2rem',
        width: '100%',
        maxWidth: '380px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'none', border: 'none', fontSize: '1.1rem',
            color: '#9ca3af', cursor: 'pointer', lineHeight: 1,
          }}
        >
          ✕
        </button>

        {/* Logo / icono */}
        <div style={{
          width: '56px', height: '56px', borderRadius: '16px',
          background: 'linear-gradient(135deg, #F5C842 0%, #f59e0b 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem',
          boxShadow: '0 8px 20px rgba(245,200,66,0.35)',
          fontSize: '1.6rem',
        }}>
          🌊
        </div>

        <h2 style={{
          fontSize: '1.2rem', fontWeight: 800, color: '#111827',
          margin: '0 0 0.5rem', letterSpacing: '-0.02em',
        }}>
          Iniciá sesión
        </h2>

        <p style={{
          fontSize: '0.88rem', color: '#6b7280',
          margin: '0 0 1.75rem', lineHeight: 1.5,
        }}>
          {mensaje || 'Para guardar tus lugares favoritos y dejar reseñas necesitás una cuenta.'}
        </p>

        <button
          type="button"
          onClick={() => { onClose(); navigate('/login') }}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #F5C842 0%, #f59e0b 100%)',
            color: '#111827',
            border: 'none',
            borderRadius: '50px',
            padding: '0.9rem',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: '0.75rem',
            boxShadow: '0 4px 16px rgba(245,200,66,0.4)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(245,200,66,0.6)' }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(245,200,66,0.4)' }}
        >
          Acceder con Google
        </button>

        <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: 0 }}>
          <span style={{ fontWeight: 700 }}><span style={{ color: '#F5A623' }}>S</span>potter</span>
          {' '}· Turismo local, desde adentro 🇸🇻
        </p>
      </div>
    </div>
  )
}
