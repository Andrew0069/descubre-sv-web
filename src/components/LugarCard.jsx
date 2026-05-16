import { memo, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getCategoriaBadgeBackground, getGradiente } from '../lib/categoriaVisual'
import { resolveImageUrl } from '../lib/imageUrl'
import { CategoriaIconSvg } from './CategoriaChip'
import { supabase } from '../lib/supabase'
import { getUsuarioId } from '../services/usuariosService'
import { getFavoritoStatus, addFavorito, removeFavorito } from '../services/favoritosService'

const TROPICAL_GRADIENT = 'linear-gradient(135deg, #0EA5E9 0%, #06b6d4 50%, #f59e0b 100%)'


export function LugarImagePlaceholder({ categoriaNombre, iconSize = 36 }) {
  const bg = getGradiente(categoriaNombre)
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-2 px-3"
      style={{ background: bg }}
    >
      <CategoriaIconSvg nombre={categoriaNombre} active={false} onDark size={iconSize} />
      <span className="text-center text-[10px] font-semibold uppercase tracking-wider text-white/90">
        {categoriaNombre || 'Destino'}
      </span>
    </div>
  )
}

export function LugarCardSkeleton({ isFeatured = false }) {
  return (
    <div
      className="lugar-card-skeleton"
      aria-hidden="true"
      style={{
        borderRadius: '16px',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: isFeatured ? '420px' : '200px', flexShrink: 0, overflow: 'hidden' }}>
        <div className="skeleton-block" style={{ width: '100%', height: '100%' }} />
      </div>
      {!isFeatured && (
        <div style={{ display: 'block', padding: '1rem 1.1rem 1.2rem' }}>
          <div className="skeleton-block" style={{ width: '70%', height: '16px', borderRadius: '6px', marginBottom: '8px' }} />
          <div className="skeleton-block" style={{ width: '46%', height: '12px', borderRadius: '6px', marginBottom: '14px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="skeleton-block" style={{ width: '34%', height: '13px', borderRadius: '6px' }} />
            <div className="skeleton-block" style={{ width: '42px', height: '14px', borderRadius: '6px' }} />
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Heart Icon ── */
function HeartSvg({ filled, hovered, size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? '#ef4444' : hovered ? '#ef4444' : 'none'}
      stroke={filled ? '#ef4444' : hovered ? '#ef4444' : '#6b7280'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

/* ── Rating display (heart-based) ── */
function RatingDisplay({ rating, empty }) {
  if (!rating) {
    return (
      <span className="editorial-card__rating editorial-card__rating--empty">
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        —
      </span>
    )
  }
  return (
    <span className="editorial-card__rating">
      <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {rating}
    </span>
  )
}

/* ── Badges ── */
function CardBadges({ cat, catBg, destacado, horarios }) {
  return (
    <div className="editorial-card__badges">
      {cat && (
        <span style={{
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '0.7rem',
          fontWeight: 600,
          letterSpacing: '0.05em',
          color: '#ffffff',
          background: catBg,
          backdropFilter: 'blur(4px)',
          pointerEvents: 'none',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          {cat.nombre}
        </span>
      )}
      {destacado && (
        <span style={{
          display: 'inline-block',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '0.7rem',
          fontWeight: 700,
          color: '#111827',
          background: '#F5C842',
          backdropFilter: 'blur(4px)',
          pointerEvents: 'none',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          ⭐ Destacado
        </span>
      )}
      {horarios?.es24Horas && (
        <span style={{
          display: 'inline-block',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '0.7rem',
          fontWeight: 700,
          color: '#ffffff',
          background: '#10B981',
          backdropFilter: 'blur(4px)',
          pointerEvents: 'none',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          🕐 24 Horas
        </span>
      )}
    </div>
  )
}

function LugarCard({ lugar, isFeatured }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [heartHover, setHeartHover] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [esFavorito, setEsFavorito] = useState(false)
  const [count, setCount] = useState(lugar.favoritos_count ?? 0)

  const cat = lugar.categorias
  const dep = lugar.departamentos
  const imagenPrincipal = lugar.imagen_principal?.trim()
  const imagenRelacionada = lugar.imagenes_lugar
    ?.slice()
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    .find((foto) => foto?.ruta_imagen?.trim())?.ruta_imagen
  const img = resolveImageUrl(imagenPrincipal || imagenRelacionada, 'lugares-fotos', { transform: { width: isFeatured ? 1200 : 600, height: isFeatured ? 600 : 400, resize: 'cover' } })
  const showImage = Boolean(img) && !imageError
  const catBg = cat ? getCategoriaBadgeBackground(cat) : TROPICAL_GRADIENT

  useEffect(() => {
    setImageError(false)
  }, [img, lugar.id])

  // Check if the current user has this place saved as a favorite
  useEffect(() => {
    const checkFavorito = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const usuarioId = await getUsuarioId(session.user.id)

      if (!usuarioId) return

      const esFav = await getFavoritoStatus(lugar.id, usuarioId)
      setEsFavorito(esFav)
    }
    checkFavorito()
  }, [lugar.id])

  const handleToggleFavoritoCard = async (e) => {
    e.stopPropagation()
    e.preventDefault()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate('/login', {
        state: {
          from: `${location.pathname}${location.search}${location.hash}`,
        },
      })
      return
    }

    const usuarioId = await getUsuarioId(session.user.id)

    if (!usuarioId) return

    if (esFavorito) {
      await removeFavorito(lugar.id, usuarioId)
      setEsFavorito(false)
      setCount((prev) => Math.max(0, prev - 1))
    } else {
      await addFavorito(lugar.id, usuarioId)
      setEsFavorito(true)
      setCount((prev) => prev + 1)
    }
  }

  /* ── FEATURED: cinematic card with overlay text ── */
  if (isFeatured) {
    return (
      <div className="editorial-card--featured">
        <Link to={`/lugar/${lugar.id}`} style={{ display: 'block', textDecoration: 'none', height: '100%' }}>
          <div className="editorial-card__image-wrap">
            {showImage ? (
              <img
                src={img}
                alt=""
                className="editorial-card__img"
                loading="eager"
                fetchPriority="high"
                onError={(e) => { e.target.onerror = null; setImageError(true) }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: TROPICAL_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CategoriaIconSvg nombre={cat?.nombre} active={false} onDark size={64} />
              </div>
            )}

            {/* Gradient overlay */}
            <div className="editorial-card__overlay" />

            {/* Badges */}
            <CardBadges cat={cat} catBg={catBg} destacado={lugar.destacado} horarios={lugar.horarios} />

            {/* Overlay content at bottom */}
            <div className="editorial-card__overlay-content">
              <h2 className="editorial-card__overlay-title">{lugar.nombre}</h2>
              <div className="editorial-card__overlay-meta">
                <span className="editorial-card__overlay-location">
                  📍 {dep?.nombre ?? '—'}
                </span>
                {lugar.promedio_rating && (
                  <span className="editorial-card__overlay-rating">
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    {lugar.promedio_rating}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>

        {/* Heart button */}
        <button
          type="button"
          aria-label="Guardar en favoritos"
          className="editorial-card__heart"
          onClick={handleToggleFavoritoCard}
          onMouseEnter={() => setHeartHover(true)}
          onMouseLeave={() => setHeartHover(false)}
        >
          <HeartSvg filled={esFavorito} hovered={heartHover} />
        </button>
      </div>
    )
  }

  /* ── SECONDARY: clean card with caption below ── */
  return (
    <div className="editorial-card--secondary">
      {/* Image */}
      <div className="editorial-card__image-wrap">
        <Link to={`/lugar/${lugar.id}`} style={{ display: 'block', width: '100%', height: '100%' }}>
          {showImage ? (
            <img
              src={img}
              alt=""
              className="editorial-card__img"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.target.onerror = null;
                setImageError(true);
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: TROPICAL_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CategoriaIconSvg nombre={cat?.nombre} active={false} onDark size={44} />
            </div>
          )}
        </Link>

        {/* Badges */}
        <CardBadges cat={cat} catBg={catBg} destacado={lugar.destacado} horarios={lugar.horarios} />

        {/* Heart button */}
        <button
          type="button"
          aria-label="Guardar en favoritos"
          className="editorial-card__heart"
          onClick={handleToggleFavoritoCard}
          onMouseEnter={() => setHeartHover(true)}
          onMouseLeave={() => setHeartHover(false)}
        >
          <HeartSvg filled={esFavorito} hovered={heartHover} />
        </button>
      </div>

      {/* Caption */}
      <Link
        to={`/lugar/${lugar.id}`}
        style={{ display: 'block', textDecoration: 'none', flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <div className="editorial-card__caption">
          <h2 className="editorial-card__title">{lugar.nombre}</h2>
          <p className="editorial-card__location">📍 {dep?.nombre ?? '—'}</p>
          <div className="editorial-card__footer">
            <span />
            <RatingDisplay rating={lugar.promedio_rating} />
          </div>
        </div>
      </Link>
    </div>
  )
}

export default memo(LugarCard)
