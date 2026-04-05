import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LugarImagePlaceholder } from '../components/LugarCard'
import { getGradiente } from '../lib/categoriaVisual'

function formatRelativeEs(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.round(diffMs / 1000)
  const diffMin = Math.round(diffSec / 60)
  const diffHour = Math.round(diffMin / 60)
  const diffDay = Math.round(diffHour / 24)
  const diffWeek = Math.round(diffDay / 7)
  const diffMonth = Math.round(diffDay / 30)
  const diffYear = Math.round(diffDay / 365)

  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

  if (diffSec < 45) return 'hace un momento'
  if (diffMin < 60) return rtf.format(-diffMin, 'minute')
  if (diffHour < 24) return rtf.format(-diffHour, 'hour')
  if (diffDay < 7) return rtf.format(-diffDay, 'day')
  if (diffWeek < 5) return rtf.format(-diffWeek, 'week')
  if (diffMonth < 12) return rtf.format(-diffMonth, 'month')
  return rtf.format(-diffYear, 'year')
}

function getEntradaDisplay(lugar) {
  const n = (lugar.nombre || '').toLowerCase()
  if (n.includes('joya') || n.includes('cerén') || n.includes('ceren')) return '$5'
  if (n.includes('imposible') || n.includes('volcán') || n.includes('volcan')) return '$3'
  return 'Gratis'
}

function HeartIcon({ filled = false, size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? '#ef4444' : 'none'}
      stroke={filled ? '#ef4444' : 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function CategoryPill({ nombre }) {
  const bg = getGradiente(nombre)
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 14px',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: '#ffffff',
        background: bg,
        letterSpacing: '0.02em',
      }}
    >
      {nombre}
    </span>
  )
}

export default function DetalleLugar() {
  const { id } = useParams()
  const [lugar, setLugar] = useState(null)
  const [resenas, setResenas] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [toast, setToast] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setNotFound(false)

    const { data: lugarRow, error: lugarErr } = await supabase
      .from('lugares')
      .select('*, categorias(*), departamentos(*)')
      .eq('id', id)
      .maybeSingle()

    if (lugarErr || !lugarRow) {
      setLugar(null)
      setNotFound(true)
      setResenas([])
      setLoading(false)
      return
    }

    setLugar(lugarRow)

    const { data: resenasRows } = await supabase
      .from('resenas')
      .select('*, usuarios(nombre)')
      .eq('lugar_id', id)
      .order('created_at', { ascending: false })

    setResenas(resenasRows ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(false), 3500)
    return () => clearTimeout(t)
  }, [toast])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#9ca3af', fontSize: '0.95rem' }}>Cargando…</p>
      </div>
    )
  }

  if (notFound || !lugar) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <p style={{ color: '#9ca3af', fontSize: '1rem' }}>No encontramos este lugar.</p>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.6rem 1.5rem',
            borderRadius: '8px',
            backgroundColor: '#0EA5E9',
            color: '#fff',
            fontSize: '0.9rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Volver al inicio
        </Link>
      </div>
    )
  }

  const cat = lugar.categorias
  const dep = lugar.departamentos
  const img = lugar.imagen_principal?.trim()
  const hearts = Number(lugar.promedio_estrellas) || 0
  const heartsText = Number.isInteger(hearts) ? String(hearts) : hearts.toFixed(1)
  const totalResenas = lugar.total_resenas ?? 0
  const entrada = getEntradaDisplay(lugar)

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            backgroundColor: '#1f2937',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '12px',
            fontSize: '0.875rem',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            maxWidth: 'calc(100% - 2rem)',
            textAlign: 'center',
          }}
          role="status"
        >
          Próximamente — registrate para reseñar
        </div>
      )}

      {/* HERO */}
      <section style={{ position: 'relative', width: '100%', height: '380px', overflow: 'hidden' }}>
        {img ? (
          <img
            src={img}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%' }}>
            <LugarImagePlaceholder categoriaNombre={cat?.nombre} iconSize={56} />
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />

        <Link
          to="/"
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            zIndex: 10,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            color: '#ffffff',
            fontSize: '0.85rem',
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)' }}
        >
          ← Volver
        </Link>

        <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px', zIndex: 10 }}>
          {cat && (
            <div style={{ marginBottom: '10px' }}>
              <CategoryPill nombre={cat.nombre} />
            </div>
          )}
          <h1 style={{
            fontSize: 'clamp(1.5rem, 5vw, 2.25rem)',
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.15,
            textShadow: '0 2px 12px rgba(0,0,0,0.4)',
            margin: 0,
          }}>
            {lugar.nombre}
          </h1>
        </div>
      </section>

      {/* INFO BAR */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '0',
        overflowX: 'auto',
        fontSize: '0.85rem',
        color: '#4b5563',
      }}>
        {dep && (
          <>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
              📍 {dep.nombre}
            </span>
            <span style={{ margin: '0 14px', color: '#d1d5db' }}>|</span>
          </>
        )}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
          🎫 {entrada}
        </span>
        <span style={{ margin: '0 14px', color: '#d1d5db' }}>|</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', color: '#ef4444' }}>
          <HeartIcon filled size={15} />
          <span style={{ fontWeight: 600 }}>{heartsText}</span>
        </span>
        <span style={{ margin: '0 14px', color: '#d1d5db' }}>|</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
          💬 {totalResenas} {totalResenas === 1 ? 'reseña' : 'reseñas'}
        </span>
      </div>

      {/* BODY */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '28px 20px 60px',
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '28px',
      }}
        className="detalle-body-grid"
      >
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', marginBottom: '14px' }}>
              Sobre este lugar
            </h2>
            <p style={{
              fontSize: '0.95rem',
              lineHeight: 1.7,
              color: '#374151',
              whiteSpace: 'pre-line',
              margin: 0,
            }}>
              {lugar.descripcion || 'Sin descripción disponible.'}
            </p>
          </div>

          {lugar.direccion && (
            <div style={{
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              padding: '20px 24px',
              border: '1px solid #f3f4f6',
            }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>
                📍 Ubicación
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#374151', margin: 0, lineHeight: 1.5 }}>
                {lugar.direccion}
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                Reseñas <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: '0.9rem' }}>({totalResenas})</span>
              </h2>
              <button
                type="button"
                onClick={() => setToast(true)}
                style={{
                  backgroundColor: '#0EA5E9',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0284c7' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0EA5E9' }}
              >
                Escribir reseña
              </button>
            </div>

            {resenas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✍️</div>
                <p style={{ color: '#9ca3af', fontSize: '0.95rem', margin: 0 }}>
                  Sé el primero en reseñar este lugar
                </p>
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {resenas.map((r) => {
                  const nombre = r.usuarios?.nombre?.trim()
                  const autor = nombre || 'Anónimo'
                  const inicial = autor.charAt(0).toUpperCase()
                  const rHearts = Number(r.estrellas) || 0

                  return (
                    <li
                      key={r.id}
                      style={{
                        padding: '16px',
                        borderRadius: '10px',
                        border: '1px solid #f3f4f6',
                        backgroundColor: '#fafafa',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: '#0EA5E9',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}>
                          {inicial}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                            {autor}
                          </p>
                          <time style={{ fontSize: '0.75rem', color: '#9ca3af' }} dateTime={r.created_at}>
                            {formatRelativeEs(r.created_at)}
                          </time>
                        </div>
                      </div>

                      {r.titulo && (
                        <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>
                          {r.titulo}
                        </p>
                      )}
                      <p style={{ fontSize: '0.88rem', color: '#4b5563', lineHeight: 1.6, margin: '0 0 10px' }}>
                        {r.contenido}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444' }}>
                        <HeartIcon filled size={14} />
                        <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{rHearts}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
