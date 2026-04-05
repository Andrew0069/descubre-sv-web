import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
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
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const gridRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const loadLugares = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('lugares')
      .select('*, categorias(*), departamentos(*)')
      .order('nombre', { ascending: true })

    if (err) {
      setError(err.message)
      setLugares([])
    } else {
      setLugares(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadLugares()
  }, [loadLugares])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error: err } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre', { ascending: true })
      if (!cancelled) {
        if (err) setCategorias([])
        else setCategorias(ordenarCategorias(data ?? []))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filtrados = useMemo(() => {
    let list = lugares
    if (categoriaId) {
      list = list.filter((l) => l.categoria_id === categoriaId)
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      list = list.filter((l) => l.nombre?.toLowerCase().includes(q))
    }
    return list
  }, [lugares, categoriaId, debouncedSearch])

  const handleVerTodos = (e) => {
    e.preventDefault()
    setCategoriaId(null)
    setSearchInput('')
    setDebouncedSearch('')
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleExplorar = (e) => {
    e.preventDefault()
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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
              {['Explorar', 'Guías', 'Reseñas', 'Agregar lugar'].map((item) => (
                <button
                  key={item}
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
                  onClick={() => {
                    setMenuOpen(false)
                    if (item === 'Explorar') handleExplorar(new Event('click'))
                  }}
                >
                  {item}
                </button>
              ))}
              <div style={{ height: '1px', backgroundColor: '#f3f4f6', margin: '0.4rem 0.5rem' }} />
              {['ES', 'EN'].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  style={{
                    display: 'inline-block',
                    padding: '0.5rem 1rem',
                    fontSize: '0.82rem',
                    fontWeight: '500',
                    color: '#6b7280',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(14,165,233,0.07)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  {lang}
                </button>
              ))}
              <div style={{ height: '1px', backgroundColor: '#f3f4f6', margin: '0.4rem 0.5rem' }} />
              <button
                type="button"
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
                Acceder
              </button>
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
              El Salvador, desde los ojos del viajero
            </h1>
            <p className="mb-8 text-pretty text-sm text-white sm:text-base">
              Reseñas reales de playas, volcanes, pueblos coloniales y experiencias únicas
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
                  placeholder="¿A dónde querés ir?"
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
                  Explorar →
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
              Una selección de experiencias para explorar mejor el país
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
              label="Todos"
              emoji="🗺️"
              active={categoriaId === null}
              onClick={() => setCategoriaId(null)}
            />
            {categorias.map((c) => (
              <CatButton
                key={c.id}
                label={c.nombre}
                svgNombre={c.nombre}
                active={categoriaId === c.id}
                onClick={() => setCategoriaId(c.id)}
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

          <div ref={gridRef} className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Más valorados</h2>
            <button
              type="button"
              onClick={handleVerTodos}
              className="shrink-0 text-sm font-semibold text-[#0EA5E9] hover:underline"
            >
              Ver todos →
            </button>
          </div>

          {loading ? (
            <p className="py-12 text-center text-[#999999]">Cargando lugares…</p>
          ) : filtrados.length === 0 ? (
            <p className="rounded-[14px] border border-dashed border-[#E8E8E8] bg-white px-6 py-14 text-center text-[#999999]">
              No hay lugares que coincidan con tu búsqueda o filtro.
            </p>
          ) : (
            <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', listStyle: 'none', padding: 0, margin: 0 }}>
              {filtrados.map((lugar) => (
                <li key={lugar.id}>
                  <LugarCard lugar={lugar} />
                </li>
              ))}
            </ul>
          )}

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
                El Salvador, desde una mirada curada.
              </p>
            </div>

            <nav style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
              {['Explorar', 'Guías', 'Reseñas', 'Agregar lugar', 'Privacidad', 'Términos', 'Contacto'].map((item) => (
                <button
                  key={item}
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(14,165,233,0.07)'
                    e.currentTarget.style.color = '#0EA5E9'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#6b7280'
                  }}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>

          <div style={{ height: '1px', backgroundColor: '#f3f4f6', marginBottom: '1.25rem' }} />

          <p style={{ fontSize: '0.75rem', color: '#d1d5db', textAlign: 'center' }}>
            © 2026 DescubreSV · Hecho en El Salvador 🇸🇻
          </p>
        </footer>
      </div>
    </div>
  )
}
