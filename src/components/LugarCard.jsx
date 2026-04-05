import { Link } from 'react-router-dom'
import { getGradiente } from '../lib/categoriaVisual'
import { CategoriaIconSvg } from './CategoriaChip'
import StarRating from './StarRating'

function getLugarBadges(lugar) {
  const name = (lugar.nombre || '').toLowerCase()
  const badges = []
  if (name.includes('joya') || name.includes('cerén') || name.includes('ceren')) {
    badges.push({ text: 'UNESCO', kind: 'special' })
  }
  if (name.includes('zonte')) {
    badges.push({ text: 'Bitcoin Beach', kind: 'special' })
  }
  const rating = Number(lugar.promedio_estrellas) || 0
  const reviews = lugar.total_resenas ?? 0
  if (rating >= 4.5 || reviews >= 5) {
    badges.push({ text: 'Popular', kind: 'accent' })
  } else if (reviews >= 1 || rating >= 3.5) {
    badges.push({ text: 'Trending', kind: 'accent' })
  }
  return badges.slice(0, 3)
}

function getEntradaDisplay(lugar) {
  const n = (lugar.nombre || '').toLowerCase()
  if (n.includes('joya') || n.includes('cerén') || n.includes('ceren')) {
    return { prefix: 'Entrada ', value: '$5' }
  }
  if (n.includes('imposible') || n.includes('volcán') || n.includes('volcan')) {
    return { prefix: 'Entrada ', value: '$3' }
  }
  if (n.includes('playa') || n.includes('lago') || n.includes('ruta') || n.includes('suchitoto')) {
    return { prefix: 'Entrada ', value: 'Gratis' }
  }
  return { prefix: 'Entrada ', value: 'Gratis' }
}

function HeartButton() {
  return (
    <button
      type="button"
      className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12)] transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9]"
      aria-label="Guardar en favoritos"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#1A1A1A"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path
          fill="none"
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        />
      </svg>
    </button>
  )
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
  const cat = lugar.categorias
  const dep = lugar.departamentos
  const img = lugar.imagen_principal?.trim()
  const badges = getLugarBadges(lugar)
  const entrada = getEntradaDisplay(lugar)
  const rating = Number(lugar.promedio_estrellas) || 0

  return (
    <div
      className="overflow-hidden rounded-[14px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
    >
      <div className="relative h-[160px] overflow-hidden rounded-t-[14px]">
        <Link to={`/lugar/${lugar.id}`} className="block h-full w-full">
          {img ? (
            <img
              src={img}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <LugarImagePlaceholder categoriaNombre={cat?.nombre} />
          )}
        </Link>
        <HeartButton />
        {badges.length > 0 && (
          <div className="pointer-events-none absolute left-2 top-2 z-10 flex max-w-[calc(100%-4rem)] flex-wrap gap-1">
            {badges.map((b) =>
              b.kind === 'accent' ? (
                <span
                  key={b.text}
                  className="rounded-md px-2 py-0.5 text-[10px] font-bold text-[#1A1A1A]"
                  style={{ backgroundColor: '#F5C518' }}
                >
                  {b.text}
                </span>
              ) : (
                <span
                  key={b.text}
                  className="rounded-md bg-white/35 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-[2px]"
                >
                  {b.text}
                </span>
              ),
            )}
          </div>
        )}
      </div>
      <Link to={`/lugar/${lugar.id}`} className="block px-3 pb-3 pt-2.5">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h2 className="text-[13px] font-bold leading-snug text-[#1A1A1A]">{lugar.nombre}</h2>
          <StarRating value={rating} />
        </div>
        <p className="mb-1.5 text-[11px] text-[#999999]">{dep?.nombre ?? '—'}</p>
        <p className="text-[11px] text-[#999999]">
          {entrada.prefix}
          <span className="font-bold text-[#1A1A1A]">{entrada.value}</span>
        </p>
      </Link>
    </div>
  )
}
