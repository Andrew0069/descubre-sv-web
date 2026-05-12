import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useNotificaciones } from '../lib/useNotificaciones'
import { getUsuarioNavbar } from '../services/usuariosService'
import { formatRelativeShort } from '../lib/dateUtils'

function getUserAvatar(usuario) {
  return usuario?.foto_perfil || usuario?.avatar_url || null
}

function getPublicUserName(usuario) {
  return usuario?.username ? `@${usuario.username}` : 'Alguien'
}

function getNotificationMeta(notification) {
  const actorName = getPublicUserName(notification?.actor)
  switch (notification?.tipo) {
    case 'respuesta':
      return {
        iconBg: '#F5A623',
        text: `${actorName} comentó tu reseña.`,
      }
    case 'like':
      return {
        iconBg: '#ef4444',
        text: `${actorName} reaccionó a tu reseña.`,
      }
    case 'sugerencia_aprobada':
      return {
        iconBg: '#10B981',
        text: 'Tu sugerencia de lugar fue aprobada y ya tiene un borrador en revisión.',
      }
    case 'sugerencia_rechazada':
      return {
        iconBg: '#F59E0B',
        text: 'Tu sugerencia de lugar fue revisada y no fue aprobada esta vez.',
      }
    default:
      return {
        iconBg: '#6B7280',
        text: 'Tienes una nueva notificación.',
      }
  }
}

function groupNotifications(notifications) {
  const now = new Date()
  const hoy = []
  const anteriores = []

  notifications.forEach((n) => {
    const createdAt = new Date(n.created_at)
    const diffMs = now - createdAt
    const diffHours = diffMs / (1000 * 60 * 60)
    if (diffHours < 24) {
      hoy.push(n)
    } else {
      anteriores.push(n)
    }
  })

  return { hoy, anteriores }
}

export default function Notificaciones() {
  const [user, setUser] = useState(null)
  const [userPerfil, setUserPerfil] = useState(null)
  const [filtro, setFiltro] = useState('todas')
  const navigate = useNavigate()

  const { noLeidas, notificaciones, marcarTodasLeidas, descartarNotificacion } = useNotificaciones(user)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    getUsuarioNavbar(user.id).then((perfil) => setUserPerfil(perfil))
  }, [user])

  // Mark all as read when entering the page
  useEffect(() => {
    if (user && noLeidas > 0) {
      marcarTodasLeidas()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const notificacionesVisibles = useMemo(() => {
    if (filtro === 'no-leidas') return notificaciones.filter((n) => !n.leida)
    return notificaciones
  }, [notificaciones, filtro])

  const { hoy, anteriores } = useMemo(
    () => groupNotifications(notificacionesVisibles),
    [notificacionesVisibles]
  )

  const handleNotifClick = useCallback((n) => {
    const targetPath = n.resena?.lugar_id
      ? `/lugar/${n.resena.lugar_id}`
      : n.tipo === 'sugerencia_aprobada' || n.tipo === 'sugerencia_rechazada'
        ? '/perfil'
        : null
    if (!targetPath) return
    descartarNotificacion(n.id)
    navigate(targetPath)
  }, [descartarNotificacion, navigate])

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0e8', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e8e0d0',
        padding: '0 1.25rem',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: '680px', margin: '0 auto' }}>
          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-spring"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 10px',
              borderRadius: '10px',
              color: '#1a1a2e',
              fontSize: '0.9rem',
              fontWeight: 600,
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(245,166,35,0.12)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            aria-label="Volver"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Volver
          </button>

          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a1a2e', flex: 1 }}>
            Notificaciones
          </h1>

          {noLeidas > 0 && (
            <span style={{
              backgroundColor: '#F5A623',
              color: '#fff',
              fontSize: '0.72rem',
              fontWeight: 700,
              borderRadius: '50px',
              padding: '2px 8px',
              lineHeight: 1.6,
            }}>
              {noLeidas} nueva{noLeidas !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '1.25rem 1rem 4rem' }}>
        {/* Filter tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '1.25rem',
          backgroundColor: '#ffffff',
          borderRadius: '14px',
          padding: '6px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          border: '1px solid #e8e0d0',
        }}>
          {[
            { key: 'todas', label: 'Todas' },
            { key: 'no-leidas', label: 'No leídas' },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFiltro(key)}
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: filtro === key ? '#F5A623' : 'transparent',
                color: filtro === key ? '#ffffff' : '#6b7280',
                boxShadow: filtro === key ? '0 2px 8px rgba(245,166,35,0.3)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {notificacionesVisibles.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 1rem',
            gap: '1rem',
            color: '#9ca3af',
            animation: 'fadeIn 0.3s ease forwards',
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: '#f5f0e8',
              border: '2px solid #e8e0d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c9b99a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
            </div>
            <p style={{ fontSize: '0.95rem', fontWeight: 500, color: '#a8a09a', textAlign: 'center' }}>
              {filtro === 'no-leidas' ? 'Sin notificaciones no leídas' : 'Sin notificaciones por ahora'}
            </p>
          </div>
        )}

        {/* HOY section */}
        {hoy.length > 0 && (
          <section style={{ marginBottom: '0.5rem', animation: 'fadeIn 0.3s ease forwards' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 4px', marginBottom: '8px' }}>
              Hoy
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {hoy.map((n) => (
                <NotifItem key={n.id} n={n} onClic={handleNotifClick} onDescartar={descartarNotificacion} />
              ))}
            </ul>
          </section>
        )}

        {/* ANTERIORES section */}
        {anteriores.length > 0 && (
          <section style={{ animation: 'fadeIn 0.35s ease forwards' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 4px', marginBottom: '8px', marginTop: hoy.length > 0 ? '20px' : '0' }}>
              Anteriores
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {anteriores.map((n) => (
                <NotifItem key={n.id} n={n} onClic={handleNotifClick} onDescartar={descartarNotificacion} />
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  )
}

function NotifItem({ n, onClic, onDescartar }) {
  const meta = getNotificationMeta(n)
  const targetPath = n.resena?.lugar_id
    ? `/lugar/${n.resena.lugar_id}`
    : n.tipo === 'sugerencia_aprobada' || n.tipo === 'sugerencia_rechazada'
      ? '/perfil'
      : null

  return (
    <li
      onClick={() => onClic(n)}
      style={{
        display: 'flex',
        gap: '12px',
        padding: '12px',
        backgroundColor: n.leida ? '#ffffff' : 'rgba(245,166,35,0.07)',
        cursor: targetPath ? 'pointer' : 'default',
        alignItems: 'center',
        borderRadius: '14px',
        border: `1px solid ${n.leida ? '#ede8e0' : 'rgba(245,166,35,0.2)'}`,
        transition: 'background-color 0.15s ease, box-shadow 0.15s ease, transform 0.12s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={(e) => {
        if (!targetPath) return
        e.currentTarget.style.backgroundColor = n.leida ? '#fdf8f0' : 'rgba(245,166,35,0.12)'
        e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.08)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = n.leida ? '#ffffff' : 'rgba(245,166,35,0.07)'
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {getUserAvatar(n.actor) ? (
          <img
            src={getUserAvatar(n.actor)}
            alt={getPublicUserName(n.actor)}
            style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e8e0d0' }}
          />
        ) : (
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: n.tipo === 'sugerencia_aprobada' ? '#ECFDF5' : n.tipo === 'sugerencia_rechazada' ? '#FFFBEB' : '#f5f0e8',
            color: n.tipo === 'sugerencia_aprobada' ? '#059669' : n.tipo === 'sugerencia_rechazada' ? '#d97706' : '#F5A623',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1.3rem',
            border: '2px solid #e8e0d0',
          }}>
            {n.tipo === 'sugerencia_aprobada' ? '✓' : n.tipo === 'sugerencia_rechazada' ? '!' : getPublicUserName(n.actor).charAt(0).toUpperCase()}
          </div>
        )}

        {/* Type icon badge */}
        <div style={{
          position: 'absolute',
          bottom: '-2px',
          right: '-2px',
          backgroundColor: meta.iconBg,
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid #fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
        }}>
          {n.tipo === 'respuesta' ? (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" color="#fff"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>
          ) : n.tipo === 'like' ? (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" color="#fff"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
          ) : n.tipo === 'sugerencia_aprobada' ? (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86l-8.3 14.39A2 2 0 003.71 21h16.58a2 2 0 001.72-2.75l-8.3-14.39a2 2 0 00-3.42 0z" /></svg>
          )}
        </div>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.88rem',
          color: '#1a1a2e',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          wordBreak: 'break-word',
          lineHeight: 1.45,
          fontWeight: n.leida ? 400 : 500,
        }}>
          {meta.text}
        </div>
        <div style={{
          fontSize: '0.78rem',
          color: n.leida ? '#9ca3af' : '#F5A623',
          marginTop: '4px',
          fontWeight: n.leida ? 400 : 700,
        }}>
          {formatRelativeShort(n.created_at)}
        </div>
      </div>

      {/* Unread dot */}
      {!n.leida && (
        <div style={{
          width: '11px',
          height: '11px',
          borderRadius: '50%',
          backgroundColor: '#F5A623',
          flexShrink: 0,
          boxShadow: '0 0 0 2px rgba(245,166,35,0.25)',
        }} />
      )}

      {/* Dismiss button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onDescartar(n.id)
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '6px',
          borderRadius: '50%',
          color: '#c9b99a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background-color 0.15s, color 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.06)'
          e.currentTarget.style.color = '#6b7280'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = '#c9b99a'
        }}
        aria-label="Descartar notificación"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </svg>
      </button>
    </li>
  )
}
