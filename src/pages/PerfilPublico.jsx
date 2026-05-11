import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { resolveImageUrl } from '../lib/imageUrl'
import { formatRelativeEs } from '../lib/dateUtils'
import Loader from '../components/Loader'
import FotoLightbox from '../components/FotoLightbox'
import './PerfilPublico.css'

/* ── Spotter logo (same as Perfil.jsx) ── */
function SpotterLogo() {
  return (
    <svg viewBox="0 0 200 48" height="36" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 2 C13 2,5 10,5 20 C5 33,22 48,22 48 C22 48,39 33,39 20 C39 10 31 2,22 2 Z" fill="#F5A623" />
      <circle cx="22" cy="19" r="10" fill="#1a1a2e" />
      <path d="M10 19 C13 14,18 14,22 19 C26 24,31 24,34 19" fill="none" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
      <path d="M11 24 C14 20,18 20,22 24 C26 28,30 28,33 24" fill="none" stroke="#F5A623" strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
      <circle cx="33" cy="8" r="2.5" fill="#F5A623" opacity="0.4" />
      <text x="46" y="30" fontFamily="Georgia, serif" fontSize="26" fontWeight="700" letterSpacing="-1" fill="#1a1a2e">
        <tspan fill="#F5A623">S</tspan><tspan fill="#1a1a2e">potter</tspan>
      </text>
    </svg>
  )
}

export default function PerfilPublico() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState(null)
  const [resenas, setResenas] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [resenaLightbox, setResenaLightbox] = useState(null) // { fotos, index }

  const loadData = useCallback(async () => {
    if (!id) return
    setLoading(true)

    // Fetch user by internal id
    const { data: user, error: userErr } = await supabase
      .from('usuarios')
      .select('id, nombre, foto_perfil, avatar_url, bio, created_at')
      .eq('id', id)
      .maybeSingle()

    if (userErr || !user) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setUsuario(user)

    // Fetch all reviews by this user, with lugar info
    const { data: resenasData } = await supabase
      .from('resenas')
      .select('id, titulo, contenido, estrellas, fotos, created_at, lugar_id, lugares(id, nombre, imagen_principal, departamentos(nombre))')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })

    setResenas(resenasData ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  if (loading) {
    return (
      <div className="pub-profile-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader text="Cargando perfil…" />
      </div>
    )
  }

  if (notFound || !usuario) {
    return (
      <div className="pub-profile-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <p style={{ color: '#9ca3af', fontSize: '1rem' }}>No encontramos este perfil.</p>
        <Link
          to="/"
          style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '0.6rem 1.5rem', borderRadius: '8px',
            backgroundColor: '#d97706', color: '#fff',
            fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none',
          }}
        >
          ← Volver al inicio
        </Link>
      </div>
    )
  }

  const foto = usuario.foto_perfil || usuario.avatar_url
  const inicial = (usuario.nombre || 'U').charAt(0).toUpperCase()
  const joinDate = usuario.created_at
    ? new Date(usuario.created_at).toLocaleDateString('es', { month: 'long', year: 'numeric' })
    : ''
  const totalResenas = resenas.length

  return (
    <div className="pub-profile-page">
      {/* Top bar */}
      <header className="pub-profile-header-bar">
        <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Spotter">
          <SpotterLogo />
        </Link>
        <span className="sep">|</span>
        <span className="title">Perfil de usuario</span>
      </header>

      {/* Banner */}
      <div className="pub-profile-banner">
        <div className="pub-profile-banner-inner">
          {foto
            ? <img src={foto} alt={usuario.nombre} className="pub-profile-avatar" />
            : <div className="pub-profile-avatar-placeholder">{inicial}</div>
          }
          <div className="pub-profile-info">
            <h1>{usuario.nombre || 'Usuario'}</h1>
            {usuario.bio && <p className="bio">{usuario.bio}</p>}
            {joinDate && <p className="joined">📅 Se unió en {joinDate}</p>}
            <div className="pub-profile-stats">
              <div className="pub-profile-stat">
                <span className="num">{totalResenas}</span>
                <span className="label">{totalResenas === 1 ? 'Reseña' : 'Reseñas'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section title */}
      <div className="pub-profile-section-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Actividad de reseñas
      </div>

      {/* Reviews */}
      <div className="pub-profile-reviews">
        {resenas.length === 0 ? (
          <div className="pub-profile-empty">
            <div className="icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p>Este usuario aún no ha dejado reseñas.<br />Vuelve más tarde.</p>
          </div>
        ) : (
          resenas.map((r) => {
            const lugar = r.lugares
            const lugarImg = lugar?.imagen_principal
              ? resolveImageUrl(lugar.imagen_principal, 'lugares-fotos')
              : null

            return (
              <div key={r.id} className="pub-review-card">
                {/* Header: place info + date */}
                <div className="pub-review-header">
                  {lugar ? (
                    <Link to={`/lugar/${lugar.id}`} className="pub-review-lugar">
                      {lugarImg
                        ? <img src={lugarImg} alt={lugar.nombre} className="pub-review-lugar-img" loading="lazy" />
                        : <div className="pub-review-lugar-img-placeholder">🏝️</div>
                      }
                      <div>
                        <p className="pub-review-lugar-name">{lugar.nombre}</p>
                        {lugar.departamentos?.nombre && (
                          <p className="pub-review-lugar-dept">📍 {lugar.departamentos.nombre}</p>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Lugar no disponible</span>
                  )}
                  <span className="pub-review-date">{formatRelativeEs(r.created_at)}</span>
                </div>

                {/* Hearts */}
                {r.estrellas != null && (
                  <div className="pub-review-hearts">
                    {[1, 2, 3, 4, 5].map(i => (
                      <span key={i} style={{ color: i <= Number(r.estrellas) ? '#d97706' : '#ddd' }}>
                        {i <= Number(r.estrellas) ? '★' : '☆'}
                      </span>
                    ))}
                  </div>
                )}

                {/* Title */}
                {r.titulo && <p className="pub-review-title">{r.titulo}</p>}

                {/* Content */}
                <p className="pub-review-content">{r.contenido}</p>

                {/* Photos */}
                {r.fotos && r.fotos.length > 0 && (
                  <div className="pub-review-photos">
                    {r.fotos.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt=""
                        loading="lazy"
                        onClick={() => setResenaLightbox({ fotos: r.fotos, index: i })}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Lightbox for review photos */}
      {resenaLightbox && (
        <FotoLightbox
          fotos={resenaLightbox.fotos}
          index={resenaLightbox.index}
          onClose={() => setResenaLightbox(null)}
        />
      )}
    </div>
  )
}
