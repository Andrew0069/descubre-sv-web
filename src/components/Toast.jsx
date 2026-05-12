import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const ICONS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}

const COLORS = {
  success: { border: '#F5C842', icon: '#b8860b', bg: '#fffbeb' },
  error:   { border: '#ef4444', icon: '#ef4444', bg: '#fff5f5' },
  warning: { border: '#f59e0b', icon: '#f59e0b', bg: '#fffbeb' },
  info:    { border: '#F5C842', icon: '#b8860b', bg: '#fffbeb' },
}

function detectType(msg) {
  if (!msg) return 'info'
  const lower = msg.toLowerCase()
  if (lower.includes('error') || lower.includes('falló') || lower.includes('fallo')) return 'error'
  if (lower.includes('!') || lower.includes('guardad') || lower.includes('actualizad') || lower.includes('eliminad') || lower.includes('cerrad')) return 'success'
  if (lower.includes('espera') || lower.includes('demasiadas') || lower.includes('límite')) return 'warning'
  return 'info'
}

export default function Toast({ msg, type }) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (msg) {
      setLeaving(false)
      setVisible(true)
    } else if (visible) {
      setLeaving(true)
      const t = setTimeout(() => { setVisible(false); setLeaving(false) }, 300)
      return () => clearTimeout(t)
    }
  }, [msg])

  if (!visible && !msg) return null

  const resolvedType = type || detectType(msg)
  const c = COLORS[resolvedType] || COLORS.info
  const icon = ICONS[resolvedType]

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: '1.25rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        animation: leaving
          ? 'toastSlideUp 0.28s cubic-bezier(0.4,0,0.2,1) forwards'
          : 'toastSlideDown 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
        pointerEvents: 'none',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: c.bg,
        border: `1px solid ${c.border}40`,
        borderLeft: `4px solid ${c.border}`,
        borderRadius: 12,
        padding: '11px 20px 11px 14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
        fontSize: '0.875rem',
        fontWeight: 600,
        color: '#111827',
        whiteSpace: 'nowrap',
        maxWidth: 'calc(100vw - 2.5rem)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        <span style={{
          width: 22, height: 22, borderRadius: '50%',
          background: `${c.border}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 800, color: c.icon, flexShrink: 0,
        }}>
          {icon}
        </span>
        {msg}
      </div>
    </div>,
    document.body
  )
}
