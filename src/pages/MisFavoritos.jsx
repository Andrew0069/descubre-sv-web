import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { resolveImageUrl } from '../lib/imageUrl'
import { getGradiente } from '../lib/categoriaVisual'
import { CategoriaIconSvg } from '../components/CategoriaChip'

const TROPICAL_GRADIENT = 'linear-gradient(135deg, #0EA5E9 0%, #06b6d4 50%, #f59e0b 100%)'

function FavoritoCard({ lugar }) {
  const [hovered, setHovered] = useState(false)
  const img = resolveImageUrl(lugar.imagen_principal, 'lugares-fotos')
  const showImage = Boolean(img)
  const dep = lugar.departamentos?.nombre
  const precio = lugar.precio_entrada ?? null

  return (
    <div
      style={{
        borderRadius: '16px',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        boxShadow: hovered
          ? '0 12px 32px rgba(0,0,0,0.14)'
          : '0 2px 12px rgba(0,0,0,0.08)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', flexShrink: 0, overflow: 'hidden' }}>
        <Link to={`/lugar/${lugar.id}`} style={{ display: 'block', width: '100%', height: '100%' }}>
          {showImage ? (
            <img
              src={img}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                transform: hovered ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: TROPICAL_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '2.5rem' }}>🏝️</span>
            </div>
          )}
        </Link>

        {/* Red heart indicator */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 5,
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="#ef4444"
            stroke="#ef4444"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>
      </div>

      <Link
        to={`/lugar/${lugar.id}`}
        style={{ display: 'block', padding: '1rem 1.1rem 1.2rem', textDecoration: 'none' }}
      >
        <h2 style={{
          fontSize: '1rem',
          fontWeight: 700,
          color: '#111827',
          margin: '0 0 4px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {lugar.nombre}
        </h2>
        {dep && (
          <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: '0 0 8px' }}>
            📍 {dep}
          </p>
        )}
        {precio != null && (
          <span style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            🎫 <span style={{ fontWeight: 600, color: '#374151' }}>{precio}</span>
          </span>
        )}
      </Link>
    </div>
  )
}

export default function MisFavoritos() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [favoritos, setFavoritos] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { session: sess } } = await supabase.auth.getSession()
      setSession(sess)
      if (!sess) {
        setLoading(false)
        return
      }

      // Get internal usuario_id
      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('id')
        .eq('auth_id', sess.user.id)
        .single()

      if (!usuarioData) {
        setLoading(false)
        return
      }

      // Fetch favoritos joined with lugares
      const { data } = await supabase
        .from('favoritos')
        .select('lugar_id, lugares(id, nombre, descripcion, imagen_principal, precio_entrada, departamentos(nombre))')
        .eq('usuario_id', usuarioData.id)
        .order('created_at', { ascending: false })

      setFavoritos(data ?? [])
      setLoading(false)
    }
    init()

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })
    return () => data?.subscription?.unsubscribe()
  }, [])

  const handleLogin = () => {
    navigate('/login')
  }

  // Not authenticated
  if (!loading && !session) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
        <header style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          padding: '0 2rem',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <Link
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}
            aria-label="Spotter"
          >
            <svg viewBox="0 0 200 48" height="36" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2 C13 2, 5 10, 5 20 C5 33, 22 48, 22 48 C22 48, 39 33, 39 20 C39 10 31 2, 22 2 Z" fill="#F5A623" />
              <circle cx="22" cy="19" r="10" fill="#1a1a2e" />
              <path d="M10 19 C13 14, 18 14, 22 19 C26 24, 31 24, 34 19" fill="none" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
              <path d="M11 24 C14 20, 18 20, 22 24 C26 28, 30 28, 33 24" fill="none" stroke="#F5A623" strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
              <circle cx="33" cy="8" r="2.5" fill="#F5A623" opacity="0.4" />
              <text x="46" y="30" fontFamily="Georgia, serif" fontSize="26" fontWeight="700" letterSpacing="-1" fill="#1a1a2e">
                <tspan fill="#F5A623">S</tspan><tspan fill="#1a1a2e">potter</tspan>
              </text>
            </svg>
          </Link>
        </header>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6rem 2rem',
          textAlign: 'center',
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #fecaca 0%, #ef4444 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            boxShadow: '0 8px 24px rgba(239,68,68,0.25)',
          }}>
            <svg width={36} height={36} viewBox="0 0 24 24" fill="#ffffff" stroke="none">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '0.75rem' }}>
            Mis Favoritos
          </h1>
          <p style={{ fontSize: '0.95rem', color: '#6b7280', marginBottom: '2rem', maxWidth: '380px', lineHeight: 1.6 }}>
            Iniciá sesión para guardar tus lugares favoritos y llevarlos siempre con vos.
          </p>
          <button
            type="button"
            onClick={handleLogin}
            style={{
              background: 'linear-gradient(135deg, #F5C842 0%, #f59e0b 100%)',
              color: '#111827',
              border: 'none',
              borderRadius: '50px',
              padding: '0.9rem 2.5rem',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(245,200,66,0.4)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(245,200,66,0.6)' }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(245,200,66,0.4)' }}
          >
            Acceder con Google
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 2rem',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}
          aria-label="Spotter"
        >
          <svg viewBox="0 0 200 48" height="36" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 2 C13 2, 5 10, 5 20 C5 33, 22 48, 22 48 C22 48, 39 33, 39 20 C39 10 31 2, 22 2 Z" fill="#F5A623" />
            <circle cx="22" cy="19" r="10" fill="#1a1a2e" />
            <path d="M10 19 C13 14, 18 14, 22 19 C26 24, 31 24, 34 19" fill="none" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
            <path d="M11 24 C14 20, 18 20, 22 24 C26 28, 30 28, 33 24" fill="none" stroke="#F5A623" strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
            <circle cx="33" cy="8" r="2.5" fill="#F5A623" opacity="0.4" />
            <text x="46" y="30" fontFamily="Georgia, serif" fontSize="26" fontWeight="700" letterSpacing="-1" fill="#1a1a2e">
              <tspan fill="#F5A623">S</tspan><tspan fill="#1a1a2e">potter</tspan>
            </text>
          </svg>
        </Link>
        <span style={{ color: '#d1d5db' }}>|</span>
        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#374151' }}>♥ Mis Favoritos</span>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        {/* Back link */}
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '8px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            fontSize: '0.85rem',
            fontWeight: 500,
            textDecoration: 'none',
            marginBottom: '2rem',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e5e7eb' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6' }}
        >
          ← Volver al inicio
        </Link>

        <h1 style={{
          fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
          fontWeight: 800,
          color: '#111827',
          marginBottom: '0.5rem',
        }}>
          Mis Favoritos
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#9ca3af', marginBottom: '2rem' }}>
          Los lugares que guardaste para explorar después.
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{ color: '#9ca3af', fontSize: '0.95rem' }}>Cargando…</p>
          </div>
        ) : favoritos.length === 0 ? (
          /* Empty state */
          <div style={{
            textAlign: 'center',
            padding: '5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
            }}>
              <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
              Todavía no guardaste ningún lugar
            </p>
            <p style={{ fontSize: '0.88rem', color: '#9ca3af', maxWidth: '340px', lineHeight: 1.6 }}>
              Explorá y guardá tus favoritos tocando el corazón ♥ en cada lugar.
            </p>
            <Link
              to="/"
              style={{
                marginTop: '1.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#0EA5E9',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50px',
                padding: '0.75rem 2rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(14,165,233,0.3)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(14,165,233,0.45)' }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(14,165,233,0.3)' }}
            >
              Explorar lugares →
            </Link>
          </div>
        ) : (
          /* Grid of favorite places */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}>
            {favoritos.map((fav) => {
              const lugar = fav.lugares
              if (!lugar) return null
              return <FavoritoCard key={fav.lugar_id} lugar={lugar} />
            })}
          </div>
        )}
      </main>
    </div>
  )
}
