import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { checkRateLimit } from '../lib/rateLimit'
import { useIdioma } from '../lib/idiomaContext'
import { CategoriaIconSvg } from '../components/CategoriaChip'
import LugarCard, { LugarCardSkeleton } from '../components/LugarCard'
import LoginModal from '../components/LoginModal'
import { useNotificaciones } from '../lib/useNotificaciones'

function formatRelativeNotif(dateString) {
  if (!dateString) return ''
  const diff = Math.round((Date.now() - new Date(dateString).getTime()) / 60000)
  if (diff < 1) return 'hace un momento'
  if (diff < 60) return `hace ${diff} min`
  if (diff < 1440) return `hace ${Math.round(diff / 60)}h`
  return `hace ${Math.round(diff / 1440)}d`
}

const HERO_OVERLAY =
  'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.30) 60%, rgba(0,0,0,0.45) 100%)'

function CatButton({ label, emoji, svgNombre, active, onClick, compact }) {
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

export default function Home() {
  const [lugares, setLugares] = useState([])
  const [categorias, setCategorias] = useState([])
  const [categoriasOtras, setCategoriasOtras] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [categoriaId, setCategoriaId] = useState(null)
  const [filtroSubtipo, setFiltroSubtipo] = useState('Todos')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filtroBusquedaNombre, setFiltroBusquedaNombre] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [user, setUser] = useState(null)
  const [campanaOpen, setCampanaOpen] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isCatBarSticky, setIsCatBarSticky] = useState(false)
  const catSentinelRef = useRef(null)
  const { noLeidas, notificaciones, marcarTodasLeidas } = useNotificaciones(user)
  const { idioma } = useIdioma()
  const navigate = useNavigate()

  const t = {
    heroTitle: idioma === 'en' ? 'El Salvador, through the eyes of the traveler' : 'El Salvador, desde los ojos del viajero',
    heroSubtitle: idioma === 'en' ? 'Real reviews of beaches, volcanoes, colonial towns and unique experiences' : 'Reseñas reales de playas, volcanes, pueblos coloniales y experiencias únicas',
    heroPlaceholder: idioma === 'en' ? 'Where do you want to go?' : '¿A dónde querés ir?',
    heroButton: idioma === 'en' ? 'Explore →' : 'Explorar →',
    heroTagline: idioma === 'en' ? 'A curated selection of experiences to better explore the country' : 'Una selección de experiencias para explorar mejor el país',
    sectionLabel: idioma === 'en' ? 'Spotter Selection' : 'Selección Spotter',
    sectionTitle: idioma === 'en' ? 'Discover El Salvador' : 'Descubre El Salvador',
    sectionDesc: idioma === 'en' ? 'Must-see places according to traveler experience' : 'Lugares imprescindibles según la experiencia de viajeros',
    verTodos: idioma === 'en' ? 'See selection →' : 'Ver selección →',
    noResults: idioma === 'en' ? 'No places match your search or filter.' : 'No hay lugares que coincidan con tu búsqueda o filtro.',
    menuExplorar: idioma === 'en' ? 'Explore' : 'Explorar',
    menuGuias: idioma === 'en' ? 'Guides' : 'Guías',
    menuResenas: idioma === 'en' ? 'Reviews' : 'Reseñas',
    menuAgregar: idioma === 'en' ? 'Suggest a place' : 'Sugerir lugar',
    menuAcceder: idioma === 'en' ? 'Sign in' : 'Acceder',
    menuCerrar: idioma === 'en' ? 'Sign out' : 'Cerrar sesión',
    menuPerfil: idioma === 'en' ? 'My profile' : '👤 Mi perfil',
    footerTagline: idioma === 'en' ? 'What tourists don\'t see. Yet.' : 'Lo que los turistas no ven. Todavía.',
    footerCopy: idioma === 'en' ? '© 2026 Spotter · Your local guide, always.' : '© 2026 Spotter · Tu guía local, siempre.',
    menuPrivacidad: idioma === 'en' ? 'Privacy' : 'Privacidad',
    menuTerminos: idioma === 'en' ? 'Terms' : 'Términos',
    menuContacto: idioma === 'en' ? 'Contact' : 'Contacto',
    todos: idioma === 'en' ? 'All' : 'Todos',
    otros: idioma === 'en' ? 'Other' : 'Otros',
    cargando: idioma === 'en' ? 'Loading places...' : 'Cargando lugares…',
    sesionCerrada: idioma === 'en' ? 'Signed out' : 'Sesión cerrada',
    guiasProx: idioma === 'en' ? 'Guides — coming soon' : 'Guías — próximamente',
    privacidadProx: idioma === 'en' ? 'Privacy policy — coming soon' : 'Política de privacidad — próximamente',
    terminosProx: idioma === 'en' ? 'Terms of use — coming soon' : 'Términos de uso — próximamente',
    contactoProx: idioma === 'en' ? 'Contact — coming soon' : 'Contacto — próximamente',
  }

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  const scrollToLugares = useCallback(() => {
    document.getElementById('lugares')?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  // Sticky category bar detection via IntersectionObserver
  useEffect(() => {
    const sentinel = catSentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsCatBarSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-60px 0px 0px 0px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  // Listen for the custom event dispatched by LugarCard when an unauthenticated
  // user taps the heart button on a card.
  useEffect(() => {
    const handler = () => setShowLoginModal(true)
    window.addEventListener('show-login-modal', handler)
    return () => window.removeEventListener('show-login-modal', handler)
  }, [])

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
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    const q = debouncedSearch.trim()
    if (!q) {
      setFiltroBusquedaNombre('')
      return
    }
    let cancelled = false
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const identificador = session?.user?.id ?? 'anonimo'
      const allowed = await checkRateLimit(identificador, 'busqueda')
      if (cancelled) return
      if (allowed === false) {
        showToast('Demasiadas solicitudes. Espera un momento antes de continuar.')
        setSearchInput('')
        setDebouncedSearch('')
        setFiltroBusquedaNombre('')
        return
      }
      setFiltroBusquedaNombre(q)
    })()
    return () => { cancelled = true }
  }, [debouncedSearch, showToast])

  useEffect(() => {
    if (!campanaOpen) return
    const handler = (e) => {
      if (!e.target.closest('[data-campana]')) setCampanaOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [campanaOpen])

  const loadLugares = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data: { session } } = await supabase.auth.getSession()
    const identificadorFetch = session?.user?.id ?? 'anonimo'
    const allowedFetch = await checkRateLimit(identificadorFetch, 'fetch_lugares')
    if (allowedFetch === false) {
      showToast('Demasiadas solicitudes. Espera un momento antes de continuar.')
      setLugares([])
      setLoading(false)
      return
    }

    const { data, error: err } = await supabase
      .from('lugares')
      .select('id, nombre, categoria_id, subtipo, destacado, imagen_principal, precio_entrada, updated_at, categorias(nombre, color), departamentos(nombre), imagenes_lugar(ruta_imagen, orden)')
      .order('destacado', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false })

    if (err) {
      setError(err.message)
      setLugares([])
      setLoading(false)
      return
    }

    const { data: conteosData } = await supabase
      .from('favoritos')
      .select('lugar_id')

    const conteoPorLugar = {}
    ;(conteosData || []).forEach((f) => {
      conteoPorLugar[f.lugar_id] = (conteoPorLugar[f.lugar_id] || 0) + 1
    })

    const { data: ratingsData } = await supabase
      .from('likes_lugar')
      .select('lugar_id, rating')
      .not('rating', 'is', null)

    const promediosPorLugar = {}
    ;(ratingsData || []).forEach(r => {
      if (!promediosPorLugar[r.lugar_id]) {
        promediosPorLugar[r.lugar_id] = { suma: 0, count: 0 }
      }
      promediosPorLugar[r.lugar_id].suma += r.rating
      promediosPorLugar[r.lugar_id].count += 1
    })

    const lugaresConDatos = (data ?? []).map((l) => ({
      ...l,
      favoritos_count: conteoPorLugar[l.id] || 0,
      promedio_rating: promediosPorLugar[l.id]
        ? (promediosPorLugar[l.id].suma / promediosPorLugar[l.id].count).toFixed(1)
        : null
    }))

    setLugares(lugaresConDatos)
    setLoading(false)
  }, [showToast])

  useEffect(() => {
    loadLugares()
  }, [loadLugares])

  useEffect(() => {
    let cancelled = false
      ; (async () => {
        const { data, error: err } = await supabase
          .from('categorias')
          .select('id, nombre, color, es_predefinida')
          .order('nombre', { ascending: true })
        if (!cancelled) {
          if (err) {
            setCategorias([])
            setCategoriasOtras([])
          } else {
            const rows = data ?? []
            const predefinidas = rows.filter((c) => c.es_predefinida === true)
            const otras = rows.filter((c) => c.es_predefinida === false)
            setCategorias(predefinidas)
            setCategoriasOtras(otras)
          }
        }
      })()
    return () => { cancelled = true }
  }, [])

  const filtrados = useMemo(() => {
    let list = lugares
    if (categoriaId === 'OTROS') {
      const idsOtras = categoriasOtras.map((c) => c.id)
      list = list.filter((l) => idsOtras.includes(l.categoria_id))
    } else if (categoriaId) {
      list = list.filter((l) => l.categoria_id === categoriaId)
    }
    if (filtroSubtipo !== 'Todos') {
      list = list.filter((l) => l.subtipo === filtroSubtipo)
    }
    if (filtroBusquedaNombre) {
      const q = filtroBusquedaNombre.toLowerCase()
      list = list.filter((l) => l.nombre?.toLowerCase().includes(q))
    }
    return list
  }, [lugares, categoriaId, filtroSubtipo, filtroBusquedaNombre, categoriasOtras])

  const handleVerTodos = (e) => {
    e.preventDefault()
    setCategoriaId(null)
    setFiltroSubtipo('Todos')
    setSearchInput('')
    setDebouncedSearch('')
    setFiltroBusquedaNombre('')
    scrollToLugares()
  }

  const handleExplorar = (e) => {
    e.preventDefault()
    scrollToLugares()
  }

  const handleFooterNav = useCallback(
    (item) => {
      switch (item) {
        case 'Explorar':
        case 'Reseñas':
          scrollToLugares()
          break
        case 'Guías':
          showToast(t.guiasProx)
          break
        case 'Sugerir lugar':
          navigate('/sugerir-lugar')
          break
        case 'Privacidad':
          navigate('/privacidad')
          break
        case 'Términos':
          navigate('/terminos')
          break
        default:
          break
      }
    },
    [scrollToLugares, showToast, navigate, t.guiasProx, t.privacidadProx, t.terminosProx, t.contactoProx],
  )

  const sugerencias = useMemo(() => {
    if (filtrados.length > 0) return []
    return lugares
      .filter((l) => {
        if (categoriaId && l.categoria_id === categoriaId) return true
        return false
      })
      .slice(0, 3)
      .concat(
        lugares
          .filter((l) => !categoriaId || l.categoria_id !== categoriaId)
          .slice(0, Math.max(0, 3 - lugares.filter((l) => categoriaId && l.categoria_id === categoriaId).length))
      )
      .slice(0, 3)
  }, [filtrados, lugares, categoriaId])

  return (
    <div className="min-h-screen pb-16" style={{ background: 'var(--bg)' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative', width: '100%' }}>
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

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="btn-spring"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
              padding: '8px 10px',
              backgroundColor: menuOpen ? 'rgba(14,165,233,0.08)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(14,165,233,0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = menuOpen ? 'rgba(14,165,233,0.08)' : 'transparent' }}
          >
            <span style={{ width: '20px', height: '1.5px', backgroundColor: '#374151', borderRadius: '2px', display: 'block', transition: 'all 0.2s' }} />
            <span style={{ width: '20px', height: '1.5px', backgroundColor: '#374151', borderRadius: '2px', display: 'block', transition: 'all 0.2s' }} />
            <span style={{ width: '20px', height: '1.5px', backgroundColor: '#374151', borderRadius: '2px', display: 'block', transition: 'all 0.2s' }} />
          </button>

          {user && (
            <div style={{ position: 'relative', marginLeft: 'auto' }} data-campana>
              <button
                type="button"
                onClick={() => {
                  setCampanaOpen((prev) => !prev)
                  if (!campanaOpen) marcarTodasLeidas()
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
                aria-label="Notificaciones"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {noLeidas > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}>
                    {noLeidas > 9 ? '9+' : noLeidas}
                  </span>
                )}
              </button>

              {campanaOpen && (
                <div style={{
                  position: 'absolute',
                  top: '44px',
                  right: '0',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                  width: '300px',
                  zIndex: 100,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f3f4f6',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#111827',
                  }}>
                    Notificaciones
                  </div>

                  {notificaciones.length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                      Sin notificaciones
                    </div>
                  ) : (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: '320px', overflowY: 'auto' }}>
                      {notificaciones.map((n) => (
                        <li
                          key={n.id}
                          onClick={() => {
                            if (n.resena?.lugar_id) {
                              setCampanaOpen(false)
                              navigate(`/lugar/${n.resena.lugar_id}`)
                            }
                          }}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid #f9fafb',
                            backgroundColor: n.leida ? '#ffffff' : 'rgba(14,165,233,0.05)',
                            fontSize: '0.82rem',
                            color: '#374151',
                            lineHeight: 1.5,
                            cursor: n.resena?.lugar_id ? 'pointer' : 'default',
                          }}
                          onMouseEnter={(e) => { if (n.resena?.lugar_id) e.currentTarget.style.backgroundColor = '#f9fafb' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = n.leida ? '#ffffff' : 'rgba(14,165,233,0.05)' }}
                        >
                          {n.tipo === 'respuesta'
                            ? `💬 ${n.actor?.nombre ?? 'Alguien'} respondió tu reseña`
                            : `❤️ ${n.actor?.nombre ?? 'Alguien'} dio like a tu reseña`}
                          <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '2px' }}>
                            {formatRelativeNotif(n.created_at)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {menuOpen && (
            <div style={{
              position: 'absolute',
              top: '48px',
              left: '0',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
              padding: '0.5rem',
              minWidth: '200px',
              zIndex: 100,
            }}>
              {[
                { label: t.menuExplorar, onClick: () => { setMenuOpen(false); scrollToLugares() } },
                { label: t.menuGuias, onClick: () => { setMenuOpen(false); showToast(t.guiasProx) } },
                { label: t.menuResenas, onClick: () => { setMenuOpen(false); scrollToLugares() } },
                { label: t.menuAgregar, onClick: () => { setMenuOpen(false); navigate('/sugerir-lugar') } },
              ].map(({ label, onClick }) => (
                <button
                  key={label}
                  type="button"
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.65rem 1rem',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#374151',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(14,165,233,0.07)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  onClick={onClick}
                >
                  {label}
                </button>
              ))}
              <div style={{ height: '1px', backgroundColor: '#f3f4f6', margin: '0.4rem 0.5rem' }} />
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      navigate('/favoritos')
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.65rem 1rem',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: '#374151',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(14,165,233,0.07)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    ♥ Mis Favoritos
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      navigate('/perfil')
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.65rem 1rem',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: '#374151',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(14,165,233,0.07)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    {t.menuPerfil}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await supabase.auth.signOut()
                      setMenuOpen(false)
                      showToast(t.sesionCerrada)
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.65rem 1rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      color: '#ef4444',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.07)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    {t.menuCerrar}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    navigate('/login')
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.65rem 1rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: '#0EA5E9',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(14,165,233,0.07)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  {t.menuAcceder}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <div>
        <section className="hero-photo-section relative flex min-h-[520px] items-center justify-center overflow-hidden px-6 py-16 sm:py-20">
          <div
            className="pointer-events-none absolute inset-0 z-0 bg-[#0EA5E9] bg-cover bg-center"
            style={{
              backgroundImage: "url('/hero-bg.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center bottom',
              backgroundRepeat: 'no-repeat',
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{ background: HERO_OVERLAY }}
            aria-hidden
          />
          <div className="relative z-[3] mx-auto w-full max-w-3xl text-center">
            <h1
              className="text-balance text-white"
              style={{
                fontSize: 'clamp(22px, 5vw, 34px)',
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: '-0.5px',
                marginBottom: '10px',
              }}
            >
              {t.heroTitle}
            </h1>
            <p className="mb-8 text-pretty text-sm text-white sm:text-base">
              {t.heroSubtitle}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleExplorar(e)
              }}
              style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: 0 }}
            >
              <div className="search-spring" style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: '50px',
                padding: '6px 6px 6px 20px',
                maxWidth: '560px',
                width: '100%',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
              >
                <span style={{ fontSize: '1.1rem', marginRight: '10px' }}>🔍</span>
                <label htmlFor="hero-buscar" className="sr-only">
                  Buscar destino
                </label>
                <input
                  id="hero-buscar"
                  type="text"
                  placeholder={t.heroPlaceholder}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="hero-glass-input"
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    fontWeight: '400',
                  }}
                />
                <button
                  type="submit"
                  className="btn-spring"
                  style={{
                    backgroundColor: '#F5C842',
                    color: '#111827',
                    border: 'none',
                    borderRadius: '40px',
                    padding: '0.65rem 1.5rem',
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.02em',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e6b800' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F5C842' }}
                >
                  {t.heroButton}
                </button>
              </div>
            </form>

            <p style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.85rem',
              fontStyle: 'italic',
              letterSpacing: '0.03em',
              marginTop: '1.25rem',
            }}
            >
              {t.heroTagline}
            </p>
          </div>
        </section>

        {/* Sentinel: invisible element to detect when category bar leaves viewport */}
        <div ref={catSentinelRef} style={{ height: 0, margin: 0, padding: 0 }} aria-hidden />

        <section
          className={`cat-bar-section${isCatBarSticky ? ' cat-bar-sticky-enter' : ''}`}
          style={{
            padding: isCatBarSticky ? '6px 16px' : '16px 16px 0',
            position: 'sticky',
            top: '60px',
            zIndex: 40,
            backgroundColor: isCatBarSticky ? '#ffffff' : 'transparent',
            boxShadow: isCatBarSticky ? '0 2px 12px rgba(0,0,0,0.08)' : 'none',
            borderBottom: isCatBarSticky ? '1px solid #e5e7eb' : '1px solid transparent',
          }}
        >
          <div
            className="cat-bar-scroll"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: isCatBarSticky ? '0' : '16px',
              boxShadow: isCatBarSticky ? 'none' : '0 2px 16px rgba(0,0,0,0.07)',
              padding: isCatBarSticky ? '0.2rem 0.5rem' : '0.5rem 1rem',
              overflowX: 'auto',
              display: 'flex',
              gap: '0',
              transition: 'border-radius 0.3s ease, padding 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease',
            }}
          >
            <CatButton
              label={t.todos}
              emoji="🗺️"
              active={categoriaId === null}
              onClick={() => { setCategoriaId(null); setFiltroSubtipo('Todos') }}
              compact={isCatBarSticky}
            />
            {categorias.map((c) => (
              <CatButton
                key={c.id}
                label={c.nombre}
                svgNombre={c.nombre}
                active={categoriaId === c.id}
                onClick={() => { setCategoriaId(c.id); setFiltroSubtipo('Todos') }}
                compact={isCatBarSticky}
              />
            ))}
            {categoriasOtras.length > 0 && (
              <CatButton
                label={t.otros}
                svgNombre=""
                active={categoriaId === 'OTROS'}
                onClick={() => { setCategoriaId('OTROS'); setFiltroSubtipo('Todos') }}
                compact={isCatBarSticky}
              />
            )}
          </div>
        </section>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          {error && (
            <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          )}

          <div>
            <div style={{
              borderBottom: '1px solid rgba(0,0,0,0.05)',
              paddingTop: '56px',
              paddingBottom: '32px',
              marginBottom: '8px',
            }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '0.5rem',
              }}
              >
                <div>
                  <p style={{
                    fontSize: '0.72rem',
                    fontWeight: '600',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: '#0EA5E9',
                    marginBottom: '0.5rem',
                  }}
                  >
                    {t.sectionLabel}
                  </p>
                  <h2 style={{
                    fontSize: 'clamp(1rem, 1.8vw, 1.25rem)',
                    fontWeight: '700',
                    color: '#111827',
                    lineHeight: '1.2',
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap',
                  }}
                  >
                    {t.sectionTitle}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleVerTodos}
                  className="btn-spring"
                  style={{
                    backgroundColor: '#F5C842',
                    color: '#111827',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '0.55rem 1.25rem',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.01em',
                    boxShadow: '0 2px 8px rgba(245,200,66,0.35)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e6b800'
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(245,200,66,0.5)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#F5C842'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(245,200,66,0.35)'
                  }}
                >
                  {t.verTodos}
                </button>
              </div>
              <p style={{
                fontSize: '0.82rem',
                color: '#9ca3af',
                marginTop: '0.35rem',
              }}
              >
                {t.sectionDesc}
              </p>
            </div>

            {categoriaId === 'c0000000-0000-0000-0000-000000000009' && (
              <div style={{
                display: 'flex',
                gap: '0',
                borderBottom: '1px solid #e5e7eb',
                marginBottom: '1.5rem',
                marginTop: '0.5rem',
              }}>
                {['Todos', 'Hotel', 'Hostal', 'Airbnb'].map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setFiltroSubtipo(sub)}
                    style={{
                      padding: '0.6rem 1.25rem',
                      fontSize: '0.875rem',
                      fontWeight: filtroSubtipo === sub ? '600' : '400',
                      color: filtroSubtipo === sub ? '#111827' : '#6b7280',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderBottom: filtroSubtipo === sub ? '2px solid #111827' : '2px solid transparent',
                      marginBottom: '-1px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}

            <div id="lugares" style={{ minHeight: '650px' }}>
              {loading ? (
                <ul
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 pt-[32px] m-0 p-0 list-none grid-flow-row-dense"
                  aria-label={t.cargando}
                >
                  {Array.from({ length: 6 }).map((_, index) => {
                    const isFeatured = index === 0
                    return (
                      <li key={index} className={isFeatured ? 'md:col-span-2' : ''}>
                        <LugarCardSkeleton isFeatured={isFeatured} />
                      </li>
                    )
                  })}
                </ul>
              ) : filtrados.length === 0 ? (
                <div className="animate-fade-in-up" style={{ padding: '3rem 0' }}>
                  <div style={{
                    textAlign: 'center',
                    marginBottom: sugerencias.length > 0 ? '2.5rem' : '0',
                  }}>
                    <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem' }}>🔍</span>
                    <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.35rem' }}>
                      {idioma === 'en' ? 'No results found' : 'Sin resultados'}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                      {filtroSubtipo !== 'Todos'
                        ? (idioma === 'en' ? `No ${filtroSubtipo} listings yet.` : `Aún no hay lugares de tipo ${filtroSubtipo}.`)
                        : (idioma === 'en' ? 'Try a different search or category.' : 'Probá con otra búsqueda o categoría.')}
                    </p>
                  </div>

                  {sugerencias.length > 0 && (
                    <div>
                      <p style={{
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: '#9ca3af',
                        textAlign: 'center',
                        marginBottom: '1.25rem',
                      }}>
                        {idioma === 'en' ? 'You might like' : 'Quizás te interese'}
                      </p>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '1rem',
                        maxWidth: '720px',
                        margin: '0 auto',
                      }}>
                        {sugerencias.map((lugar) => (
                          <LugarCard key={lugar.id} lugar={lugar} isFeatured={false} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <ul
                  key={`${categoriaId}-${filtroSubtipo}-${filtroBusquedaNombre}`}
                  className="animate-fade-in-up grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 pt-[32px] m-0 p-0 list-none grid-flow-row-dense"









                >
                  {filtrados.map((lugar, index) => {
                    const isFeatured = index === 0;
                    return (
                      <li key={lugar.id} className={isFeatured ? 'md:col-span-2' : ''}>
                        <LugarCard lugar={lugar} isFeatured={isFeatured} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

        </main>

        <footer style={{
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
          padding: '2rem 2.5rem',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
            marginBottom: '1.5rem',
          }}>
            <div>
              <span style={{ fontSize: '1rem', fontWeight: '700', color: '#111827', letterSpacing: '-0.02em' }}>
                <span style={{ color: '#F5A623' }}>S</span>potter
              </span>
              <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.25rem', fontStyle: 'italic' }}>
                {t.footerTagline}
              </p>
            </div>

            <nav style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
              {[
                { key: 'Explorar', label: t.menuExplorar },
                { key: 'Guías', label: t.menuGuias },
                { key: 'Reseñas', label: t.menuResenas },
                { key: 'Sugerir lugar', label: t.menuAgregar },
                { key: 'Privacidad', label: t.menuPrivacidad },
                { key: 'Términos', label: t.menuTerminos },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#6b7280',
                    fontSize: '0.82rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => handleFooterNav(key)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(14,165,233,0.07)'
                    e.currentTarget.style.color = '#0EA5E9'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#6b7280'
                  }}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div style={{ height: '1px', backgroundColor: '#f3f4f6', marginBottom: '1.25rem' }} />

          <p style={{ fontSize: '0.75rem', color: '#d1d5db', textAlign: 'center' }}>
            {t.footerCopy}
          </p>
        </footer>
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#111827',
            color: '#ffffff',
            padding: '0.75rem 1.5rem',
            borderRadius: '50px',
            fontSize: '0.85rem',
            fontWeight: '500',
            zIndex: 999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            animation: 'fadeInUpToast 0.25s ease',
          }}
          role="status"
        >
          {toast}
        </div>
      )}
      {showLoginModal && (
        <LoginModal
          mensaje="Guardá tus lugares favoritos y llevá El Salvador en el bolsillo."
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  )
}
