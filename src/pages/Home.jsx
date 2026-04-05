import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import CategoriaChip from '../components/CategoriaChip'
import LugarCard from '../components/LugarCard'

export default function Home() {
  const [lugares, setLugares] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [categoriaId, setCategoriaId] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

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
        else setCategorias(data ?? [])
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

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-12 pt-16">
      <header className="fixed left-0 right-0 top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="text-xl font-bold text-[#1565C0]">
            Descubre SV
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        <div className="mb-6 pt-4">
          <label htmlFor="buscar-lugar" className="sr-only">
            Buscar por nombre
          </label>
          <input
            id="buscar-lugar"
            type="search"
            placeholder="Buscar por nombre..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#1565C0] focus:outline-none focus:ring-2 focus:ring-[#1565C0]/30"
          />
        </div>

        <div className="-mx-4 mb-8 overflow-x-auto px-4 pb-1">
          <div className="flex w-max gap-2 pb-1">
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
                accentColor={c.color}
                active={categoriaId === c.id}
                onClick={() => setCategoriaId(c.id)}
              />
            ))}
          </div>
        </div>

        {error && (
          <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-center text-gray-500">Cargando lugares…</p>
        ) : filtrados.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-gray-600">
            No hay lugares que coincidan con tu búsqueda o filtro.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtrados.map((lugar) => (
              <li key={lugar.id}>
                <LugarCard lugar={lugar} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
