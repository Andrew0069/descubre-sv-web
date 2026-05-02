const STROKE_IDLE = '#AAAAAA'
const STROKE_ACTIVE = '#0EA5E9'

function IconTodos({ stroke, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke={stroke} strokeWidth={1.5} />
      <polygon
        points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconPlayas({ stroke, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <path
        d="M2 12c.6.5 1.2 1 2.5 1C7 13 7 11 9.5 11c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconMontanas({ stroke, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 22h8" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
      <path d="M12 2 4.5 20.29l.5.71h14l.5-.71Z" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  )
}

function IconPueblos({ stroke, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <polyline points="9 22 9 12 15 12 15 22" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  )
}

function IconSitios({ stroke, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <line x1="9" y1="3" x2="9" y2="21" stroke={stroke} strokeWidth={1.5} />
      <line x1="15" y1="3" x2="15" y2="21" stroke={stroke} strokeWidth={1.5} />
      <line x1="6" y1="6" x2="18" y2="6" stroke={stroke} strokeWidth={1.5} />
      <line x1="6" y1="18" x2="18" y2="18" stroke={stroke} strokeWidth={1.5} />
      <line x1="4" y1="21" x2="20" y2="21" stroke={stroke} strokeWidth={1.5} />
    </svg>
  )
}

function IconLagos({ stroke, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 22a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9z"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconParques({ stroke, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M17 22V12a5 5 0 0 0-10 0v10" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
      <path d="M5 22h14" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  )
}

function IconMiradores({ stroke, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="6" cy="14" r="4" stroke={stroke} strokeWidth={1.5} />
      <circle cx="18" cy="14" r="4" stroke={stroke} strokeWidth={1.5} />
      <line x1="10" y1="14" x2="14" y2="14" stroke={stroke} strokeWidth={1.5} />
      <path d="M6 10V6" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
      <path d="M18 10V6" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  )
}

function IconMercados({ stroke, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <line x1="3" y1="6" x2="21" y2="6" stroke={stroke} strokeWidth={1.5} />
      <path d="M16 10a4 4 0 0 1-8 0" stroke={stroke} strokeWidth={1.5} />
    </svg>
  )
}

function IconVidaNocturna({ stroke, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 22h8" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
      <path d="M12 11v11" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
      <path d="M8 3h8l1 8H7L8 3z" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  )
}

function IconRestaurantes({ stroke, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 3v7a4 4 0 0 0 4 4" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
      <path d="M10 3v11" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
      <path d="M14 3v18" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
      <path d="M18 8v13" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  )
}

function IconAlojamiento({ stroke, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M2 4v16" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 8h18a2 2 0 0 1 2 2v10" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 17h20" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 8v9" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconOtros({ stroke, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

const ICON_BY_NAME = {
  Playas: IconPlayas,
  'Montañas y Volcanes': IconMontanas,
  'Pueblos con Encanto': IconPueblos,
  'Sitios Arqueológicos': IconSitios,
  'Lagos y Ríos': IconLagos,
  'Parques Naturales': IconParques,
  Miradores: IconMiradores,
  'Mercados y Artesanías': IconMercados,
  'Vida Nocturna': IconVidaNocturna,
  Restaurantes: IconRestaurantes,
  Alojamiento: IconAlojamiento,
}

const EN_TO_ES = {
  'Beaches': 'Playas',
  'Mountains and volcanoes': 'Montañas y Volcanes',
  'Charming Villages': 'Pueblos con Encanto',
  'Archaeological Sites': 'Sitios Arqueológicos',
  'Lakes and Rivers': 'Lagos y Ríos',
  'Natural Parks': 'Parques Naturales',
  'Viewpoints': 'Miradores',
  'Markets and Crafts': 'Mercados y Artesanías',
  'Night Life': 'Vida Nocturna',
  'Restaurants': 'Restaurantes',
  'Accommodation': 'Alojamiento',
}

export function CategoriaIconSvg({ nombre, active, size = 22, onDark = false }) {
  const stroke = onDark ? '#FFFFFF' : active ? STROKE_ACTIVE : STROKE_IDLE
  const nombreEs = EN_TO_ES[nombre] ?? nombre
  const Icon = (nombreEs && ICON_BY_NAME[nombreEs]) || IconOtros
  return <Icon stroke={stroke} size={size} />
}

export default function CategoriaChip({ label, active, onClick, isTodos = false }) {
  const stroke = active ? STROKE_ACTIVE : STROKE_IDLE

  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-transparent focus:outline-none"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        padding: '12px 16px 10px',
        cursor: 'pointer',
        borderBottom: active ? '2px solid #0EA5E9' : '2px solid transparent',
        flexShrink: 0,
      }}
    >
      {isTodos ? <IconTodos stroke={stroke} size={22} /> : <CategoriaIconSvg nombre={label} active={active} />}
      <span
        style={{
          fontSize: '11px',
          fontWeight: active ? 600 : 500,
          color: active ? '#0EA5E9' : '#AAAAAA',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </button>
  )
}
