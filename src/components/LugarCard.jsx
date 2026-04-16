import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getGradiente } from '../lib/categoriaVisual'
import { CategoriaIconSvg } from './CategoriaChip'
import { useIdioma } from '../lib/idiomaContext'

const TROPICAL_GRADIENT = 'linear-gradient(135deg, #0EA5E9 0%, #06b6d4 50%, #f59e0b 100%)'

function getEntradaPrice(lugar) {
  const n = (lugar.nombre || '').toLowerCase()
  if (n.includes('joya') || n.includes('cerén') || n.includes('ceren')) return '$5'
  if (n.includes('imposible') || n.includes('volcán') || n.includes('volcan')) return '$3'
  return 'Gratis'
}

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

export default function LugarCard({ lugar }) {
  const [hovered, setHovered] = useState(false)
  const [heartHover, setHeartHover] = useState(false)
  const [imageError, setImageError] = useState(false)
  const { idioma } = useIdioma()

  const cat = lugar.categorias
  const dep = lugar.departamentos
  const img = lugar.imagen_principal?.trim()
  const showImage = Boolean(img) && !imageError
  const hearts = Number(lugar.promedio_estrellas) || 0
  const heartsText = Number.isInteger(hearts) ? String(hearts) : hearts.toFixed(1)
  const precioRaw = getEntradaPrice(lugar)
  const precio = precioRaw === 'Gratis' ? (idioma === 'en' ? 'Free' : 'Gratis') : precioRaw
  const isFree = precioRaw === 'Gratis'
  const catBg = cat ? getGradiente(cat.nombre) : TROPICAL_GRADIENT

  useEffect(() => {
    setImageError(false)
  }, [img, lugar.id])

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
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
        <Link to={`/lugar/${lugar.id}`} style={{ display: 'block', width: '100%', height: '100%' }}>
          {showImage ? (
            <img
              src={img}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: TROPICAL_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CategoriaIconSvg nombre={cat?.nombre} active={false} onDark size={44} />
            </div>
          )}
        </Link>

        {/* Category badge */}
        {cat && (
          <span style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 5,
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
          }}>
            {cat.nombre}
          </span>
        )}

        {/* Heart button */}
        <button
          type="button"
          aria-label="Guardar en favoritos"
          onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
          onMouseEnter={() => setHeartHover(true)}
          onMouseLeave={() => setHeartHover(false)}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 5,
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            border: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            transform: heartHover ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill={heartHover ? '#ef4444' : 'none'}
            stroke={heartHover ? '#ef4444' : '#6b7280'}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Info */}
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

        <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: '0 0 10px' }}>
          📍 {dep?.nombre ?? '—'}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            🎫 <span style={{ fontWeight: 600, color: isFree ? '#10b981' : '#374151' }}>{precio}</span>
          </span>
          <span style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#ef4444' }}>
            ❤️ <span style={{ fontWeight: 600 }}>{heartsText}</span>
          </span>
        </div>
      </Link>
    </div>
  )
}
