import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { checkRateLimit } from '../lib/rateLimit'
import { useIdioma } from '../lib/idiomaContext'
import { CategoriaIconSvg } from '../components/CategoriaChip'
import LugarCard, { LugarCardSkeleton } from '../components/LugarCard'
import Loader from '../components/Loader'
import Toast from '../components/Toast'
import { useNotificaciones } from '../lib/useNotificaciones'
import { resolveImageUrl } from '../lib/imageUrl'
import { getUsuarioNavbar } from '../services/usuariosService'
import { getLugaresHome } from '../services/lugaresService'
import { getAllFavoritosConteo } from '../services/favoritosService'
import { getAllRatingsLugares } from '../services/likesService'
import CatButton from '../components/CatButton'
import { formatRelativeShort } from '../lib/dateUtils'
import PageLoader from '../components/PageLoader'



const HERO_OVERLAY =
  'linear-gradient(to bottom, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.48) 50%, rgba(0,0,0,0.62) 100%)'

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
        iconBg: '#0EA5E9',
        text: `${actorName} comentó tu reseña.`,
      }
    case 'like':
      return {
        iconBg: '#EF4444',
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

let _splashShownOnce = false
let _lugaresCache = []

export default function Home() {
  const [lugares, setLugares] = useState(_lugaresCache)
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
  const [userPerfil, setUserPerfil] = useState(null)
  const [campanaOpen, setCampanaOpen] = useState(false)
  const [notificacionesFiltro, setNotificacionesFiltro] = useState('todas')
  const [isCatBarSticky, setIsCatBarSticky] = useState(false)
  const [heroIdx, setHeroIdx] = useState(0)
  const [heroNextIdx, setHeroNextIdx] = useState(null)
  const [heroIsFading, setHeroIsFading] = useState(false)
  const [splashVisible, setSplashVisible] = useState(!_splashShownOnce)
  const [splashFading, setSplashFading] = useState(false)
  const catSentinelRef = useRef(null)
  const heroLoadedImagesRef = useRef(new Set())
  const heroFadeTimeoutRef = useRef(null)
  const heroImgRef = useRef(null)
  const heroNextImgRef = useRef(null)
  const { noLeidas, notificaciones, marcarTodasLeidas, descartarNotificacion } = useNotificaciones(user)
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
    if (!user) {
      setUserPerfil(null)
      return
    }
    let cancelled = false
    const fetchPerfil = async () => {
      const data = await getUsuarioNavbar(user.id)
      if (!cancelled && data) {
        setUserPerfil(data)
      }
    }
    fetchPerfil()
    return () => { cancelled = true }
  }, [user])

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
      ; (async () => {
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

    const { data, error: err } = await getLugaresHome()

    if (err) {
      setError(err.message)
      setLugares([])
      setLoading(false)
      return
    }

    const conteosData = await getAllFavoritosConteo()

    const conteoPorLugar = Object.fromEntries(
      (conteosData || []).map(f => [f.lugar_id, Number(f.conteo)])
    )

    const { data: ratingsData } = await getAllRatingsLugares()

    const promediosPorLugar = Object.fromEntries(
      (ratingsData || []).map(r => [r.lugar_id, r.promedio])
    )

    const lugaresConDatos = (data ?? []).map((l) => ({
      ...l,
      favoritos_count: conteoPorLugar[l.id] || 0,
      promedio_rating: promediosPorLugar[l.id] ?? null
    }))

    _lugaresCache = lugaresConDatos
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

  const notificacionesVisibles = useMemo(() => {
    if (notificacionesFiltro === 'no-leidas') return notificaciones.filter((n) => !n.leida)
    return notificaciones
  }, [notificaciones, notificacionesFiltro])

  const handleVerTodasNotificaciones = useCallback(async () => {
    setNotificacionesFiltro('todas')
    await marcarTodasLeidas()
  }, [marcarTodasLeidas])

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
          navigate('/guias')
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
    [scrollToLugares, showToast, navigate, t.privacidadProx, t.terminosProx, t.contactoProx],
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

  // --- Hero slideshow images (cover photos from places) ---
  const heroImages = useMemo(() => {
    if (!lugares.length) return []
    return lugares
      .map((l) => {
        const principal = l.imagen_principal?.trim()
        const fallback = l.imagenes_lugar
          ?.slice()
          .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
          .find((f) => f?.ruta_imagen?.trim())?.ruta_imagen
        return principal || fallback || null
      })
      .filter(Boolean)
      .slice(0, 6)
      .map((src) =>
        resolveImageUrl(src, 'lugares-fotos', {
          transform: { width: 2400, height: 1200, resize: 'cover' },
        })
      )
      .filter(Boolean)
  }, [lugares])

  const preloadHeroImage = useCallback((src) => {
    if (!src) return Promise.resolve(false)
    if (heroLoadedImagesRef.current.has(src)) return Promise.resolve(true)

    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        heroLoadedImagesRef.current.add(src)
        resolve(true)
      }
      img.onerror = () => resolve(false)
      img.src = src
    })
  }, [])

  useEffect(() => {
    setHeroIdx(0)
    setHeroNextIdx(null)
    setHeroIsFading(false)
    if (heroFadeTimeoutRef.current) {
      clearTimeout(heroFadeTimeoutRef.current)
      heroFadeTimeoutRef.current = null
    }
  }, [heroImages])

  // Dismiss splash once the first hero image is fully loaded in the browser
  useEffect(() => {
    if (loading) return
    if (heroImages.length === 0) {
      _splashShownOnce = true
      setSplashFading(true)
      const t = setTimeout(() => setSplashVisible(false), 600)
      return () => clearTimeout(t)
    }
    let cancelled = false
    let hideTimer = null
    const splashStart = performance.now()
    const MIN_SPLASH_MS = 1500

    preloadHeroImage(heroImages[0]).finally(async () => {
      if (cancelled) return

      const imgEl = heroImgRef.current
      if (imgEl) {
        if (!imgEl.complete) {
          await new Promise((resolve) => {
            const done = () => {
              imgEl.removeEventListener('load', done)
              imgEl.removeEventListener('error', done)
              resolve()
            }
            imgEl.addEventListener('load', done, { once: true })
            imgEl.addEventListener('error', done, { once: true })
          })
        }
        try { await imgEl.decode() } catch (e) {}
      }

      // Garantiza al menos un frame pintado con la imagen ya en pantalla
      // (mas confiable que setTimeout para evitar el blink blanco)
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

      if (cancelled) return

      // Asegura que los puntos del splash alcancen a verse al menos un ciclo
      const elapsed = performance.now() - splashStart
      if (elapsed < MIN_SPLASH_MS) {
        await new Promise((r) => setTimeout(r, MIN_SPLASH_MS - elapsed))
        if (cancelled) return
      }

      _splashShownOnce = true
      setSplashFading(true)
      hideTimer = setTimeout(() => setSplashVisible(false), 600)
    })
    return () => {
      cancelled = true
      if (hideTimer) clearTimeout(hideTimer)
    }
  }, [loading, heroImages, preloadHeroImage])

  useEffect(() => {
    if (heroImages.length <= 1) return
    const nextIdx = (heroIdx + 1) % heroImages.length
    preloadHeroImage(heroImages[nextIdx])
  }, [heroIdx, heroImages, preloadHeroImage])

  // Auto-rotate hero images: solo programa el siguiente slide.
  // El crossfade se dispara desde otro efecto cuando el <img next>
  // del DOM ya esta cargado y decodificado, para evitar el flash inicial
  // en arranque limpio (cuando el bitmap aun no esta caliente en el browser).
  useEffect(() => {
    if (heroImages.length <= 1) return
    if (heroNextIdx !== null || heroIsFading) return

    let cancelled = false
    const nextIdx = (heroIdx + 1) % heroImages.length
    const timer = setTimeout(async () => {
      await preloadHeroImage(heroImages[nextIdx])
      if (cancelled) return
      setHeroNextIdx(nextIdx)
    }, 6000)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  // heroNextIdx intentionally omitted: ver comentario abajo en el efecto de fade.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroIdx, heroImages, heroIsFading, preloadHeroImage])

  // Espera a que el <img next> del DOM este realmente listo (load + decode + paint)
  // antes de iniciar el crossfade. Sin esto, en arranque limpio el navegador
  // dispara el fade mientras la textura del siguiente slide todavia se decodifica
  // y se ve un parpadeo entre la imagen 1 y la 2.
  useEffect(() => {
    if (heroNextIdx === null) return
    let cancelled = false

    const triggerFade = async () => {
      const imgEl = heroNextImgRef.current
      if (imgEl) {
        if (!imgEl.complete) {
          await new Promise((resolve) => {
            const done = () => {
              imgEl.removeEventListener('load', done)
              imgEl.removeEventListener('error', done)
              resolve()
            }
            imgEl.addEventListener('load', done, { once: true })
            imgEl.addEventListener('error', done, { once: true })
          })
        }
        try { await imgEl.decode() } catch (e) {}
      }
      if (cancelled) return
      // Doble rAF para garantizar que el frame con la nueva imagen este pintado
      // antes de empezar la transicion de opacidad
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      if (!cancelled) setHeroIsFading(true)
    }
    triggerFade()

    return () => { cancelled = true }
  }, [heroNextIdx])

  useEffect(() => {
    if (heroNextIdx === null || !heroIsFading) return

    heroFadeTimeoutRef.current = setTimeout(() => {
      setHeroIdx(heroNextIdx)
      setHeroNextIdx(null)
      setHeroIsFading(false)
      heroFadeTimeoutRef.current = null
    }, 1400)

    return () => {
      if (heroFadeTimeoutRef.current) {
        clearTimeout(heroFadeTimeoutRef.current)
        heroFadeTimeoutRef.current = null
      }
    }
  }, [heroIsFading, heroNextIdx])

  return (
    <div className="min-h-screen pb-16" style={{ background: 'var(--bg)' }}>
      <PageLoader show={loading} />
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
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ position: 'relative' }} data-campana>
                <button
                  type="button"
                  onClick={() => {
                    setCampanaOpen((prev) => !prev)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f3f4f6',
                    position: 'relative',
                  }}
                  aria-label="Notificaciones"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" color="#111827">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                  </svg>
                  {noLeidas > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      backgroundColor: '#ef4444',
                      color: '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                      border: '2px solid #fff'
                    }}>
                      {noLeidas > 9 ? '9+' : noLeidas}
                    </span>
                  )}
                </button>

                {campanaOpen && (
                  <div style={window.innerWidth < 640 ? {
                    position: 'fixed',
                    top: '60px',
                    left: '12px',
                    right: '12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    zIndex: 200,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  } : {
                    position: 'absolute',
                    top: '52px',
                    right: '0',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                    width: '360px',
                    zIndex: 100,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 8px' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>Notificaciones</div>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '50%' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', padding: '0 16px 12px' }}>
                      <button
                        type="button"
                        onClick={() => setNotificacionesFiltro('todas')}
                        style={{ backgroundColor: notificacionesFiltro === 'todas' ? 'rgba(14,165,233,0.1)' : 'transparent', color: notificacionesFiltro === 'todas' ? '#0EA5E9' : '#6b7280', border: 'none', borderRadius: '20px', padding: '6px 12px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Todas
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotificacionesFiltro('no-leidas')}
                        style={{ backgroundColor: notificacionesFiltro === 'no-leidas' ? 'rgba(14,165,233,0.1)' : 'transparent', color: notificacionesFiltro === 'no-leidas' ? '#0EA5E9' : '#6b7280', border: 'none', borderRadius: '20px', padding: '6px 12px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.2s' }}
                        onMouseEnter={(e) => { if (notificacionesFiltro !== 'no-leidas') e.currentTarget.style.backgroundColor = '#f3f4f6' }}
                        onMouseLeave={(e) => { if (notificacionesFiltro !== 'no-leidas') e.currentTarget.style.backgroundColor = 'transparent' }}
                      >
                        No leídas
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>Anteriores</div>
                      <button type="button" onClick={() => { setCampanaOpen(false); navigate('/notificaciones') }} style={{ background: 'none', border: 'none', color: '#F5A623', fontSize: '0.85rem', cursor: 'pointer', padding: 0, fontWeight: 600 }}>Ver todo</button>
                    </div>

                    {notificacionesVisibles.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                        {notificacionesFiltro === 'no-leidas' ? 'Sin notificaciones no leídas' : 'Sin notificaciones'}
                      </div>
                    ) : (
                      <ul style={{ listStyle: 'none', margin: 0, padding: '0 8px 8px', maxHeight: '400px', overflowY: 'auto' }}>
                        {notificacionesVisibles.map((n) => {
                          const meta = getNotificationMeta(n)
                          const targetPath = n.resena?.lugar_id
                            ? `/lugar/${n.resena.lugar_id}`
                            : (n.tipo === 'sugerencia_aprobada' || n.tipo === 'sugerencia_rechazada')
                                ? '/perfil'
                                : null
                          return (
                          <li
                            key={n.id}
                            onClick={() => {
                              if (!targetPath) return
                              setCampanaOpen(false)
                              descartarNotificacion(n.id)
                              navigate(targetPath)
                            }}
                            style={{
                              display: 'flex',
                              gap: '12px',
                              padding: '8px',
                              backgroundColor: n.leida ? 'transparent' : 'rgba(14,165,233,0.05)',
                              cursor: targetPath ? 'pointer' : 'default',
                              alignItems: 'center',
                              borderRadius: '8px',
                              marginBottom: '4px',
                              transition: 'background-color 0.15s ease'
                            }}
                            onMouseEnter={(e) => { if (targetPath) e.currentTarget.style.backgroundColor = n.leida ? '#f3f4f6' : 'rgba(14,165,233,0.1)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = n.leida ? 'transparent' : 'rgba(14,165,233,0.05)' }}
                          >
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                              {getUserAvatar(n.actor) ? (
                                <img src={getUserAvatar(n.actor)} alt={getPublicUserName(n.actor)} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: n.tipo === 'sugerencia_aprobada' ? '#ECFDF5' : n.tipo === 'sugerencia_rechazada' ? '#FFFBEB' : '#0EA5E9', color: n.tipo === 'sugerencia_aprobada' ? '#059669' : n.tipo === 'sugerencia_rechazada' ? '#d97706' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem' }}>
                                  {n.tipo === 'sugerencia_aprobada' ? '✓' : n.tipo === 'sugerencia_rechazada' ? '!' : getPublicUserName(n.actor).charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', backgroundColor: meta.iconBg, borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fff' }}>
                                {n.tipo === 'respuesta' ? (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" color="#fff"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"></path></svg>
                                ) : n.tipo === 'like' ? (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" color="#fff"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
                                ) : n.tipo === 'sugerencia_aprobada' ? (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                                ) : (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86l-8.3 14.39A2 2 0 003.71 21h16.58a2 2 0 001.72-2.75l-8.3-14.39a2 2 0 00-3.42 0z" /></svg>
                                )}
                              </div>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 0, color: '#111827', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word', lineHeight: 1.4 }}>
                                <span style={{ fontSize: '0.85rem' }}>{meta.text}</span>
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#0EA5E9', marginTop: '4px', fontWeight: n.leida ? 400 : 600 }}>
                                {formatRelativeShort(n.created_at)}
                              </div>
                            </div>
                            {!n.leida && (
                              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#0EA5E9', flexShrink: 0 }}></div>
                            )}
                          </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate('/perfil')}
                style={{
                  background: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  fontWeight: 600,
                  fontSize: '1rem',
                  border: '1px solid #d1d5db',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 0.8}
                onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
              >
                {getUserAvatar(userPerfil) ? (
                  <img src={getUserAvatar(userPerfil)} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  (userPerfil?.nombre || 'U').charAt(0).toUpperCase()
                )}
              </button>
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
                { label: t.menuGuias, onClick: () => { setMenuOpen(false); navigate('/guias') } },
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
                    ♥ Mis Favoritos
                  </button>

                  {userPerfil?.is_admin && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false)
                        navigate('/admin')
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
                      Admin
                    </button>
                  )}

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
            className="pointer-events-none absolute inset-0 z-0 bg-[#0EA5E9]"
            aria-hidden
          />
          {/* Hero slideshow – cross-fade between place cover photos */}
          {heroImages.length > 0 && (
            <>
              <img
                ref={heroImgRef}
                key={`hero-current-${heroIdx}`}
                src={heroImages[heroIdx]}
                alt=""
                className="pointer-events-none absolute inset-0 z-0"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  display: 'block',
                  opacity: heroNextIdx !== null && heroIsFading ? 0 : 1,
                  transition: 'opacity 1.4s ease-in-out',
                  animation: 'heroSlowZoom 7s ease-out forwards',
                  willChange: 'transform, opacity',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transformOrigin: '50% 50%',
                }}
                loading="eager"
                fetchPriority="high"
                aria-hidden
              />
              {heroNextIdx !== null && (
                <img
                  ref={heroNextImgRef}
                  key={`hero-next-${heroNextIdx}`}
                  src={heroImages[heroNextIdx]}
                  alt=""
                  className="pointer-events-none absolute inset-0 z-0"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    display: 'block',
                    opacity: heroIsFading ? 1 : 0,
                    transition: 'opacity 1.4s ease-in-out',
                    animation: 'heroSlowZoom 7s ease-out forwards',
                    willChange: 'transform, opacity',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transformOrigin: '50% 50%',
                  }}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  aria-hidden
                />
              )}
            </>
          )}
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
                textShadow: '0 2px 12px rgba(0,0,0,0.5)',
              }}
            >
              {t.heroTitle}
            </h1>
            <p className="mb-8 text-pretty text-sm text-white sm:text-base" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.45)' }}>
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
              textShadow: '0 1px 6px rgba(0,0,0,0.4)',
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
            padding: isCatBarSticky ? '6px 16px' : '10px 16px 0',
            position: 'sticky',
            top: '60px',
            zIndex: 40,
            backgroundColor: isCatBarSticky ? '#ffffff' : 'rgba(255,255,255,0)',
            boxShadow: isCatBarSticky ? '0 2px 12px rgba(0,0,0,0.08)' : '0 2px 12px rgba(0,0,0,0)',
            borderBottom: isCatBarSticky ? '1px solid #e5e7eb' : '1px solid rgba(229,231,235,0)',
            transition: 'padding 0.3s cubic-bezier(0.22,1,0.36,1), background-color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease, opacity 0.3s ease, transform 0.3s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          <div
            className="cat-bar-scroll"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: isCatBarSticky ? '0' : '16px',
              boxShadow: isCatBarSticky ? '0 2px 16px rgba(0,0,0,0)' : '0 2px 16px rgba(0,0,0,0.07)',
              padding: isCatBarSticky ? '0.2rem 0.5rem' : '0.4rem 0.75rem',
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
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                  <Loader text={t.cargando} />
                </div>
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
                      <li key={lugar.id}>
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

      <Toast msg={toast} />
      {/*
          mensaje="Guardá tus lugares favoritos y llevá El Salvador en el bolsillo."

      */}
      {splashVisible && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '1.5rem',
            paddingTop: 'clamp(88px, 18vh, 148px)',
            opacity: splashFading ? 0 : 1,
            transition: 'opacity 0.6s ease',
            pointerEvents: splashFading ? 'none' : 'all',
          }}
        >
          <svg viewBox="0 0 200 48" height="60" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 2 C13 2, 5 10, 5 20 C5 33, 22 48, 22 48 C22 48, 39 33, 39 20 C39 10 31 2, 22 2 Z" fill="#F5A623" />
            <circle cx="22" cy="19" r="10" fill="#1a1a2e" />
            <path d="M10 19 C13 14, 18 14, 22 19 C26 24, 31 24, 34 19" fill="none" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
            <path d="M11 24 C14 20, 18 20, 22 24 C26 28, 30 28, 33 24" fill="none" stroke="#F5A623" strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
            <circle cx="33" cy="8" r="2.5" fill="#F5A623" opacity="0.4" />
            <text x="46" y="30" fontFamily="Georgia, serif" fontSize="26" fontWeight="700" letterSpacing="-1" fill="#1a1a2e">
              <tspan fill="#F5A623">S</tspan><tspan fill="#1a1a2e">potter</tspan>
            </text>
          </svg>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: '11px',
                  height: '11px',
                  borderRadius: '50%',
                  backgroundColor: '#F5A623',
                  animation: `splashDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>

          <style>{`
            @keyframes splashDot {
              0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
              40% { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}
