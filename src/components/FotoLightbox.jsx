import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * FotoLightbox – split-panel modal for photos.
 *
 * Props:
 *   fotos   : string[]   – array of image URLs
 *   index   : number     – initial photo index
 *   onClose : () => void
 *   meta    : { title, subtitle, descripcion, avatar, rating } – optional side panel content
 */
export default function FotoLightbox({ fotos = [], index = 0, onClose, meta }) {
  const [current, setCurrent] = useState(index)
  const [closing, setClosing] = useState(false)
  const touchRef = useRef({ startX: 0, startY: 0 })
  const total = fotos.length
  const mob = typeof window !== 'undefined' && window.innerWidth < 768

  useEffect(() => { setCurrent(index) }, [index])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(onClose, 260)
  }, [onClose])

  useEffect(() => {
    const handle = (e) => {
      if (e.key === 'Escape') handleClose()
      if (e.key === 'ArrowRight') setCurrent((c) => (c + 1) % total)
      if (e.key === 'ArrowLeft') setCurrent((c) => (c - 1 + total) % total)
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [handleClose, total])

  const goNext = useCallback(() => setCurrent((c) => (c + 1) % total), [total])
  const goPrev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total])

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
      onClick={handleClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: mob ? '#111' : 'rgba(0,0,0,0.88)',
        display: 'flex',
        alignItems: mob ? 'flex-start' : 'center',
        justifyContent: 'center',
        overflowY: mob ? 'auto' : 'hidden',
        opacity: closing ? 0 : 1,
        transition: 'opacity 0.26s ease',
        animation: closing ? 'none' : 'lbFadeIn 0.22s ease',
      }}
    >
      <style>{`
        @keyframes lbFadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>

      {/* Contenedor split */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: mob ? 'column' : 'row',
          width: mob ? '100%' : 'auto',
          height: mob ? 'auto' : 'auto',
          maxHeight: mob ? 'none' : '90vh',
          borderRadius: mob ? 0 : '10px',
          overflow: mob ? 'visible' : 'hidden',
          boxShadow: mob ? 'none' : '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Área de imagen */}
        <div style={{
          position: 'relative',
          backgroundColor: '#111',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {/* Volver */}
          <button
            type="button"
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '14px',
              left: '14px',
              color: '#fff',
              background: 'rgba(0,0,0,0.55)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '24px',
              padding: '5px 14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.82rem',
              fontWeight: 600,
              zIndex: 10,
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Volver
          </button>

          {/* Contador */}
          <div style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            color: '#fff',
            fontSize: '0.78rem',
            fontWeight: 600,
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: '3px 10px',
            borderRadius: '20px',
            pointerEvents: 'none',
            zIndex: 10,
          }}>
            {current + 1} / {total}
          </div>

          <img
            key={current}
            src={fotos[current]}
            alt={`Foto ${current + 1} de ${total}`}
            draggable={false}
            style={{
              display: 'block',
              userSelect: 'none',
              maxHeight: mob ? 'none' : '90vh',
              maxWidth: mob ? '100vw' : '65vw',
              width: mob ? '100%' : 'auto',
              height: 'auto',
            }}
          />

          {total > 1 && (
            <>
              <button
                type="button"
                aria-label="Foto anterior"
                onClick={(e) => { e.stopPropagation(); goPrev() }}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#fff',
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Foto siguiente"
                onClick={(e) => { e.stopPropagation(); goNext() }}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#fff',
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Panel de info */}
        {meta && (
          <div style={{
            width: mob ? '100%' : '280px',
            flex: 'none',
            backgroundColor: '#fff',
            display: 'flex',
            flexDirection: 'column',
            padding: mob ? '16px 18px' : '26px 22px',
            overflowY: mob ? 'visible' : 'auto',
            maxHeight: mob ? 'none' : '90vh',
          }}>
            {/* Avatar + nombre */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              {meta.avatar ? (
                <img src={meta.avatar} alt={meta.title} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#0EA5E9', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>
                  {(meta.title || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111', margin: 0, lineHeight: 1.3 }}>
                  {meta.title}
                </h2>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                  {current + 1} de {total} {total === 1 ? 'foto' : 'fotos'}
                </p>
              </div>
            </div>

            {meta.rating != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '10px' }}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const full = meta.rating >= star
                  const half = !full && meta.rating >= star - 0.5
                  return (
                    <span key={star} style={{ fontSize: '1rem', lineHeight: 1 }}>
                      {full ? '❤️' : half ? '🩷' : '🤍'}
                    </span>
                  )
                })}
              </div>
            )}

            {meta.descripcion && (
              <>
                <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0 0 10px 0' }} />
                <p style={{ fontSize: '0.85rem', color: '#374151', lineHeight: 1.6, margin: 0 }}>
                  {meta.descripcion}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
