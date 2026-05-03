import { useEffect, useRef, useState } from 'react'
import { CategoriaIconSvg } from './CategoriaChip'

export default function CatButton({ label, emoji, svgNombre, active, onClick, compact }) {
  const ref = useRef(null)
  const [hov, setHov] = useState(false)
  const [pressed, setPressed] = useState(false)

  useEffect(() => {
    if (active && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [active])

  const bg = active
    ? 'rgba(14,165,233,0.13)'
    : hov
      ? 'rgba(14,165,233,0.07)'
      : 'transparent'

  const scale = pressed ? 0.88 : hov ? 1.07 : 1

  const shadow = active
    ? '0 2px 8px rgba(14,165,233,0.18)'
    : hov
      ? '0 2px 8px rgba(0,0,0,0.08)'
      : 'none'

  const iconSize = compact ? 18 : 24

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPressed(false) }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: compact ? '2px' : '4px',
        padding: compact ? '0.3rem 0.8rem' : '0.6rem 1.1rem',
        borderRadius: '12px',
        backgroundColor: bg,
        border: 'none',
        borderBottom: active ? '2px solid #0EA5E9' : '2px solid transparent',
        cursor: 'pointer',
        flexShrink: 0,
        transform: `scale(${scale})`,
        boxShadow: shadow,
        transition: 'background-color 0.18s ease, transform 0.12s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease, border-color 0.18s ease, padding 0.3s cubic-bezier(0.22,1,0.36,1), gap 0.3s cubic-bezier(0.22,1,0.36,1)',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {emoji ? (
        <span style={{
          fontSize: `${iconSize}px`,
          lineHeight: 1,
          transition: 'font-size 0.3s cubic-bezier(0.22,1,0.36,1)',
        }}>{emoji}</span>
      ) : (
        <CategoriaIconSvg nombre={svgNombre} active={active} size={iconSize} />
      )}
      <span style={{
        fontSize: compact ? '0.62rem' : '0.72rem',
        fontWeight: active ? 600 : 500,
        color: active ? '#0EA5E9' : hov ? '#0EA5E9' : '#6b7280',
        whiteSpace: 'nowrap',
        transition: 'color 0.18s ease, font-size 0.3s cubic-bezier(0.22,1,0.36,1)',
      }}>
        {label}
      </span>
    </button>
  )
}
