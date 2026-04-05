import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ordenarCategorias } from '../lib/categoriaVisual'
import CategoriaChip, { CategoriaIconSvg } from '../components/CategoriaChip'
import LugarCard from '../components/LugarCard'

const HERO_OVERLAY =
  'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.30) 60%, rgba(0,0,0,0.45) 100%)'

const CTA_BANNER_OVERLAY =
  'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.75) 100%)'

export default function Home() {
  const [lugares, setLugares] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [categoriaId, setCategoriaId] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
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

  const destacado = useMemo(() => {
    if (!lugares.length) return null
    return [...lugares].sort((a, b) => {
      const ra = Number(a.promedio_estrellas) || 0
      const rb = Number(b.promedio_estrellas) || 0
      if (rb !== ra) return rb - ra
      return (b.total_resenas ?? 0) - (a.total_resenas ?? 0)
    })[0]
  }, [lugares])

  const truncar = (texto, max = 120) => {
    if (!texto) return ''
    const t = texto.trim()
    if (t.length <= max) return t
    return `${t.slice(0, max).trim()}…`
  }

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
      <header
        className="fixed left-0 right-0 top-0 z-50"
        style={{
          height: '68px',
          backgroundColor: '#F8F7F4',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        <div
          className="mx-auto flex h-full items-center justify-between"
          style={{ maxWidth: '1200px', paddingLeft: '48px', paddingRight: '48px' }}
        >
          <Link to="/" className="select-none" style={{ letterSpacing: '-0.3px' }}>
            <span style={{ fontSize: '20px', fontWeight: 500, color: '#2C2C2C' }}>Descubre</span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A' }}>SV</span>
          </Link>

          <nav className="hidden items-center sm:flex" style={{ gap: '36px' }}>
            {['Explorar', 'Guías', 'Reseñas'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="nav-link-premium"
                onClick={(e) => {
                  e.preventDefault()
                  if (item === 'Explorar') handleExplorar(e)
                }}
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center" style={{ gap: '24px' }}>
            <span className="hidden sm:flex items-center" style={{ gap: '4px', fontSize: '13px', letterSpacing: '0.3px' }}>
              <button type="button" className="nav-lang-btn nav-lang-active">ES</button>
              <span style={{ color: '#C4C0B8' }}>/</span>
              <button type="button" className="nav-lang-btn">EN</button>
            </span>
            <a
              href="#acceder"
              className="nav-acceder-btn"
              onClick={(e) => e.preventDefault()}
            >
              Acceder
            </a>
          </div>
        </div>
      </header>

      <div className="pt-[68px]">
        <section className="hero-photo-section relative flex min-h-[500px] items-center justify-center overflow-hidden px-6 py-16 sm:py-20">
          <div
            className="pointer-events-none absolute inset-0 z-0 bg-[#0EA5E9] bg-cover bg-center"
            style={{
              backgroundImage: "url('/hero-bg.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center 75%',
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
              style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'white', borderRadius: '16px', padding: '8px', maxWidth: '480px', margin: '0 auto', boxShadow: '0 12px 40px rgba(0,0,0,0.18)' }}
              className="mb-8"
              onSubmit={(e) => {
                e.preventDefault()
                handleExplorar(e)
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 6px' }}>
                <svg
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#999999"
                  strokeWidth={2}
                  aria-hidden
                  style={{ flexShrink: 0 }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                </svg>
                <label htmlFor="hero-buscar" className="sr-only">
                  Buscar destino
                </label>
                <input
                  id="hero-buscar"
                  type="search"
                  placeholder="¿A dónde querés ir?"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  style={{ border: 'none', outline: 'none', fontSize: '14px', padding: '10px 14px', flex: 1, background: 'transparent' }}
                />
              </div>
              <button
                type="submit"
                style={{ background: '#F5C518', color: '#1A1A1A', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', width: '100%' }}
              >
                Explorar
              </button>
            </form>

            <div className="flex flex-wrap justify-center gap-8 text-center sm:gap-14">
              <div>
                <p className="text-xl font-bold text-white sm:text-2xl">8+</p>
                <p className="text-xs text-white sm:text-sm">Destinos</p>
              </div>
              <div>
                <p className="text-xl font-bold text-white sm:text-2xl">14</p>
                <p className="text-xs text-white sm:text-sm">Departamentos</p>
              </div>
              <div>
                <p className="text-xl font-bold text-white sm:text-2xl">10</p>
                <p className="text-xs text-white sm:text-sm">Categorías</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#EEEEEE] bg-white">
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', overflowX: 'auto', gap: '0px', padding: '0 8px' }}>
              <CategoriaChip
                label="Todos"
                isTodos
                active={categoriaId === null}
                onClick={() => setCategoriaId(null)}
              />
              {categorias.map((c) => (
                <CategoriaChip
                  key={c.id}
                  label={c.nombre}
                  active={categoriaId === c.id}
                  onClick={() => setCategoriaId(c.id)}
                />
              ))}
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          {error && (
            <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          )}

          {!loading && destacado && (
            <section className="mb-10 mt-4">
              <h2 className="mb-3 text-sm font-semibold text-[#999999]">
                Destino destacado
              </h2>
              <Link
                to={`/lugar/${destacado.id}`}
                className="flex items-center gap-4 rounded-xl border border-[#BAE6FD] bg-[#F0FAFE] p-4 transition hover:bg-[#e6f6fd]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  <CategoriaIconSvg nombre={destacado.categorias?.nombre} active size={26} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[#1A1A1A]">{destacado.nombre}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-[#999999]">
                    {truncar(destacado.descripcion, 140)}
                  </p>
                </div>
                <svg
                  width={20}
                  height={20}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0EA5E9"
                  strokeWidth={2}
                  className="shrink-0"
                  aria-hidden
                >
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </section>
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
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtrados.map((lugar) => (
                <li key={lugar.id}>
                  <LugarCard lugar={lugar} />
                </li>
              ))}
            </ul>
          )}

          <section className="hero-photo-section relative mx-6 mt-12 overflow-hidden rounded-2xl text-center sm:mx-8">
            <div
              className="pointer-events-none absolute inset-0 z-0 bg-[#0EA5E9] bg-cover bg-center"
              style={{
                backgroundImage: "url('/hero-bg.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center 75%',
                backgroundRepeat: 'no-repeat',
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 z-[1]"
              style={{ background: CTA_BANNER_OVERLAY }}
              aria-hidden
            />
            <div className="relative z-[3] px-5 py-8 sm:px-8 sm:py-10">
              <h3 className="mb-2 text-xl font-extrabold text-white sm:text-2xl">
                ¿Conocés un lugar increíble?
              </h3>
              <p className="mb-6 text-sm text-white sm:text-base">
                Compartí experiencias únicas y ayudá a otros a descubrir El Salvador.
              </p>
              <button
                type="button"
                className="rounded-full px-6 py-3 text-sm font-bold text-[#1A1A1A] transition hover:brightness-95"
                style={{ backgroundColor: '#F5C518' }}
                onClick={(e) => e.preventDefault()}
              >
                Agregar un lugar
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
