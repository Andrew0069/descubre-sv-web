import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * FotoLightbox – modal gallery for review photos.
 *
 * Props:
 *   fotos   : string[]          – array of image URLs
 *   index   : number            – initial photo index to show
 *   onClose : () => void        – close callback
 */
export default function FotoLightbox({ fotos = [], index = 0, onClose }) {
  const [current, setCurrent] = useState(index)
  const touchRef = useRef({ startX: 0, startY: 0 })
  const total = fotos.length

  // Sync when props change
  useEffect(() => { setCurrent(index) }, [index])

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handle = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setCurrent((c) => (c + 1) % total)
      if (e.key === 'ArrowLeft') setCurrent((c) => (c - 1 + total) % total)
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [onClose, total])

  const goNext = useCallback(() => setCurrent((c) => (c + 1) % total), [total])
  const goPrev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total])

  // Touch swipe for mobile
  const handleTouchStart = (e) => {
    touchRef.current.startX = e.touches[0].clientX
    touchRef.current.startY = e.touches[0].clientY
  }
  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchRef.current.startX
    const dy = e.changedTouches[0].clientY - touchRef.current.startY
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) goNext()
      else goPrev()
    }
  }

  if (!fotos.length) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0',
        animation: 'lbFadeIn 0.2s ease',
      }}
    >
      <style>{`
        @keyframes lbFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .lb-btn {
          border: none;
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, transform 0.15s;
        }
        .lb-btn:hover { background: rgba(255,255,255,0.22); }
        .lb-btn:active { transform: scale(0.92); }
      `}</style>

      {/* Close button */}
      <button
        type="button"
        className="lb-btn"
        aria-label="Cerrar"
        onClick={(e) => { e.stopPropagation(); onClose() }}
        style={{
          position: 'absolute',
          top: 'env(safe-area-inset-top, 16px)',
          right: '16px',
          marginTop: '16px',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          fontSize: '1.4rem',
          zIndex: 10,
        }}
      >
        ✕
      </button>

      {/* Counter */}
      {total > 1 && (
        <div
          style={{
            position: 'absolute',
            top: 'env(safe-area-inset-top, 16px)',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: '20px',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '0.85rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          {current + 1} / {total}
        </div>
      )}

      {/* Prev arrow */}
      {total > 1 && (
        <button
          type="button"
          className="lb-btn"
          aria-label="Anterior"
          onClick={(e) => { e.stopPropagation(); goPrev() }}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            fontSize: '1.3rem',
            zIndex: 10,
          }}
        >
          ‹
        </button>
      )}

      {/* Next arrow */}
      {total > 1 && (
        <button
          type="button"
          className="lb-btn"
          aria-label="Siguiente"
          onClick={(e) => { e.stopPropagation(); goNext() }}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            fontSize: '1.3rem',
            zIndex: 10,
          }}
        >
          ›
        </button>
      )}

      {/* Image */}
      <img
        src={fotos[current]}
        alt={`Foto ${current + 1} de ${total}`}
        onClick={(e) => e.stopPropagation()}
        draggable={false}
        style={{
          maxWidth: 'min(92vw, 900px)',
          maxHeight: '85vh',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          borderRadius: '10px',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      />

      {/* Thumbnail strip */}
      {total > 1 && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: 'env(safe-area-inset-bottom, 16px)',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '16px',
            display: 'flex',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '12px',
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            overflowX: 'auto',
            maxWidth: '90vw',
            zIndex: 10,
          }}
        >
          {fotos.map((url, i) => (
            <img
              key={i}
              src={url}
              alt=""
              onClick={() => setCurrent(i)}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '6px',
                objectFit: 'cover',
                cursor: 'pointer',
                border: i === current ? '2px solid #ffffff' : '2px solid transparent',
                opacity: i === current ? 1 : 0.55,
                transition: 'opacity 0.2s, border-color 0.2s',
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
