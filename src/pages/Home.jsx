import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useIdioma } from '../lib/idiomaContext'
import { ordenarCategorias } from '../lib/categoriaVisual'
import { CategoriaIconSvg } from '../components/CategoriaChip'
import LugarCard from '../components/LugarCard'

const HERO_OVERLAY =
  'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.30) 60%, rgba(0,0,0,0.45) 100%)'

function CatButton({ label, emoji, svgNombre, active, onClick }) {
  const ref = useRef(null)
  const [hov, setHov] = useState(false)

  useEffect(() => {
    if (active && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [active])

  const bg = active
    ? 'rgba(14,165,233,0.1)'
    : hov
      ? 'rgba(14,165,233,0.06)'
      : 'transparent'

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        padding: '0.6rem 1.1rem',
        borderRadius: '12px',
        backgroundColor: bg,
        border: 'none',
        borderBottom: active ? '2px solid #0EA5E9' : '2px solid transparent',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background-color 0.2s ease',
      }}
    >
      {emoji ? (
        <span style={{ fontSize: '24px', lineHeight: 1 }}>{emoji}</span>
      ) : (
        <CategoriaIconSvg nombre={svgNombre} active={active} size={24} />
      )}
      <span style={{
        fontSize: '0.72rem',
        fontWeight: 500,
        color: active ? '#0EA5E9' : '#6b7280',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
    </button>
  )
}

export default function Home() {
  const [lugares, setLugares] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [categoriaId, setCategoriaId] = useState(null)
  const [filtroSubtipo, setFiltroSubtipo] = useState('Todos')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [user, setUser] = useState(null)
  const { idioma } = useIdioma()
  const navigate = useNavigate()

  const t = {
    heroTitle: idioma === 'en' ? 'El Salvador, through the eyes of the traveler' : 'El Salvador, desde los ojos del viajero',
    heroSubtitle: idioma === 'en' ? 'Real reviews of beaches, volcanoes, colonial towns and unique experiences' : 'Reseñas reales de playas, volcanes, pueblos coloniales y experiencias únicas',
    heroPlaceholder: idioma === 'en' ? 'Where do you want to go?' : '¿A dónde querés ir?',
    heroButton: idioma === 'en' ? 'Explore →' : 'Explorar →',
    heroTagline: idioma === 'en' ? 'A curated selection of experiences to better explore the country' : 'Una selección de experiencias para explorar mejor el país',
    sectionLabel: idioma === 'en' ? 'DescubreSV Selection' : 'Selección DescubreSV',
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
    footerTagline: idioma === 'en' ? 'El Salvador, from a curated perspective.' : 'El Salvador, desde una mirada curada.',
    footerCopy: idioma === 'en' ? '© 2026 DescubreSV · Made in El Salvador 🇸🇻' : '© 2026 DescubreSV · Hecho en El Salvador 🇸🇻',
    menuPrivacidad: idioma === 'en' ? 'Privacy' : 'Privacidad',
    menuTerminos: idioma === 'en' ? 'Terms' : 'Términos',
    menuContacto: idioma === 'en' ? 'Contact' : 'Contacto',
    todos: idioma === 'en' ? 'All' : 'Todos',
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

  const loadLugares = useCallback(async () => {
    setLoading(true)
    setError(null)

    let lugaresQuery = supabase
      .from('lugares')
      .select('id, nombre, categoria_id, subtipo, destacado, imagen_principal, precio_entrada, updated_at, categorias(nombre), departamentos(nombre), imagenes_lugar(ruta_imagen)')

    const { data, error: err } = await lugaresQuery
      .order('destacado', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false })

    if (err) {
      setError(err.message)
      setLugares([])
      setLoading(false)
      return
    }

    setLugares(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadLugares()
  }, [loadLugares])

  useEffect(() => {
    let cancelled = false
      ; (async () => {
        const { data, error: err } = await supabase
          .from('categorias')
          .select('*')
          .order('nombre', { ascending: true })
        if (!cancelled) {
          if (err) {
            setCategorias([])
          } else {
            setCategorias(ordenarCategorias(data ?? []))
          }
        }
      })()
    return () => { cancelled = true }
  }, [])

  const filtrados = useMemo(() => {
    let list = lugares
    if (categoriaId) {
      list = list.filter((l) => l.categoria_id === categoriaId)
    }
    if (filtroSubtipo !== 'Todos') {
      list = list.filter((l) => l.subtipo === filtroSubtipo)
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      list = list.filter((l) => l.nombre?.toLowerCase().includes(q))
    }
    return list
  }, [lugares, categoriaId, filtroSubtipo, debouncedSearch])

  const handleVerTodos = (e) => {
    e.preventDefault()
    setCategoriaId(null)
    setFiltroSubtipo('Todos')
    setSearchInput('')
    setDebouncedSearch('')
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
          showToast(t.privacidadProx)
          break
        case 'Términos':
          showToast(t.terminosProx)
          break
        case 'Contacto':
          showToast(t.contactoProx)
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
          <Link to="/" style={{ fontSize: '1.1rem', fontWeight: '700', color: '#111827', letterSpacing: '-0.02em', textDecoration: 'none' }}>
            Descubre<span style={{ color: '#0EA5E9' }}>SV</span>
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
              padding: '8px 10px',
              backgroundColor: menuOpen ? 'rgba(14,165,233,0.08)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(14,165,233,0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = menuOpen ? 'rgba(14,165,233,0.08)' : 'transparent' }}
          >
            <span style={{ width: '20px', height: '1.5px', backgroundColor: '#374151', borderRadius: '2px', display: 'block', transition: 'all 0.2s' }} />
            <span style={{ width: '20px', height: '1.5px', backgroundColor: '#374151', borderRadius: '2px', display: 'block', transition: 'all 0.2s' }} />
            <span style={{ width: '20px', height: '1.5px', backgroundColor: '#374151', borderRadius: '2px', display: 'block', transition: 'all 0.2s' }} />
          </button>

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
              <div style={{
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
                    transition: 'all 0.2s ease',
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

        <section style={{ padding: '16px 16px 0' }}>
          <div
            className="cat-bar-scroll"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
              padding: '0.5rem 1rem',
              overflowX: 'auto',
              display: 'flex',
              gap: '0',
            }}
          >
            <CatButton
              label={t.todos}
              emoji="🗺️"
              active={categoriaId === null}
              onClick={() => { setCategoriaId(null); setFiltroSubtipo('Todos') }}
            />
            {categorias.map((c) => (
              <CatButton
                key={c.id}
                label={c.nombre}
                svgNombre={c.nombre}
                active={categoriaId === c.id}
                onClick={() => { setCategoriaId(c.id); setFiltroSubtipo('Todos') }}
              />
            ))}
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
                    transition: 'all 0.2s ease',
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
                <p className="py-12 text-center text-[#999999]">{t.cargando}</p>
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
                  key={`${categoriaId}-${filtroSubtipo}-${debouncedSearch}`}
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
                Descubre<span style={{ color: '#0EA5E9' }}>SV</span>
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
                { key: 'Contacto', label: t.menuContacto },
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
    </div>
  )
}
