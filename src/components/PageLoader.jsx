import { useEffect, useState } from 'react'
import { SpotterLogo } from './SpotterLogo'

export default function PageLoader({ show }) {
  const [visible, setVisible] = useState(show)
  const [fadingOut, setFadingOut] = useState(false)

  useEffect(() => {
    if (show) {
      setVisible(true)
      setFadingOut(false)
    } else {
      setFadingOut(true)
      const t = setTimeout(() => {
        setVisible(false)
        setFadingOut(false)
      }, 600)
      return () => clearTimeout(t)
    }
  }, [show])

  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes plDotBounce {
          0%, 60%, 100% { transform: translateY(0) scale(1); opacity: 0.35; }
          30%            { transform: translateY(-8px) scale(1.25); opacity: 1; }
        }
        @keyframes plFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes plLogoBreath {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.04); }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '28px',
          opacity: fadingOut ? 0 : 1,
          transition: 'opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
          animation: !fadingOut ? 'plFadeIn 0.25s ease forwards' : 'none',
          pointerEvents: fadingOut ? 'none' : 'all',
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            animation: 'plLogoBreath 2.4s ease-in-out infinite',
          }}
        >
          <SpotterLogo height={48} />
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', gap: '9px', alignItems: 'center' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#F5C842',
                animation: `plDotBounce 1.3s ease-in-out ${i * 0.18}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </>
  )
}
