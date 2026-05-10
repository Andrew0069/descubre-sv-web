import { useState, useEffect } from 'react'

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent')
    if (!consent) {
      // Pequeño retraso para no ser tan invasivo al momento exacto de cargar
      const timer = setTimeout(() => setIsVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      width: 'calc(100% - 48px)',
      maxWidth: '380px',
      backgroundColor: 'var(--accent, #f5c518)',
      color: '#1a1a1a',
      padding: '20px',
      borderRadius: '16px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          🍪 Experiencia y Cookies
        </h4>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#374151', lineHeight: 1.5 }}>
          Utilizamos caché local y cookies técnicas para que la aplicación cargue más rápido y puedas navegar incluso sin conexión a internet. Al continuar, aceptas su uso para mejorar tu experiencia.
        </p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleAccept}
          style={{
            backgroundColor: '#111827',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 24px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#1f2937'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#111827'}
        >
          Entendido
        </button>
      </div>
    </div>
  )
}
