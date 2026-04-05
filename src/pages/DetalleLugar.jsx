import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import StarRating from '../components/StarRating'
import ResenaCard from '../components/ResenaCard'
import { LugarImagePlaceholder } from '../components/LugarCard'
import { CategoriaIconSvg } from '../components/CategoriaChip'

export default function DetalleLugar() {
  const { id } = useParams()
  const [lugar, setLugar] = useState(null)
  const [resenas, setResenas] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [toast, setToast] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setNotFound(false)

    const { data: lugarRow, error: lugarErr } = await supabase
      .from('lugares')
      .select('*, categorias(*), departamentos(*)')
      .eq('id', id)
      .maybeSingle()

    if (lugarErr || !lugarRow) {
      setLugar(null)
      setNotFound(true)
      setResenas([])
      setLoading(false)
      return
    }

    setLugar(lugarRow)

    const { data: resenasRows } = await supabase
      .from('resenas')
      .select('*, usuarios(nombre)')
      .eq('lugar_id', id)
      .order('created_at', { ascending: false })

    setResenas(resenasRows ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(false), 3500)
    return () => clearTimeout(t)
  }, [toast])

  if (loading) {
    return (
      <div className="min-h-screen pt-16" style={{ background: 'var(--bg)' }}>
        <p className="px-4 py-8 text-center text-[#999999]">Cargando…</p>
      </div>
    )
  }

  if (notFound || !lugar) {
    return (
      <div className="min-h-screen px-4 pt-20" style={{ background: 'var(--bg)' }}>
        <p className="mb-4 text-center text-[#999999]">No encontramos este lugar.</p>
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-[#0EA5E9] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0284c7]"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  const cat = lugar.categorias
  const dep = lugar.departamentos
  const img = lugar.imagen_principal?.trim()
  const rating = Number(lugar.promedio_estrellas) || 0

  return (
    <div className="min-h-screen pb-16" style={{ background: 'var(--bg)' }}>
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-50 max-w-[min(100%-2rem,28rem)] -translate-x-1/2 rounded-xl bg-[#1A1A1A] px-4 py-3 text-center text-sm text-white shadow-lg"
          role="status"
        >
          Próximamente — registrate para reseñar
        </div>
      )}

      <header className="fixed left-0 right-0 top-0 z-40 border-b border-[#E8E8E8] bg-white">
        <div className="mx-auto flex h-12 max-w-3xl items-center px-2 sm:px-4">
          <Link
            to="/"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#1A1A1A] hover:bg-[#F8F8F8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0EA5E9]"
            aria-label="Volver"
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </header>

      <div className="overflow-hidden bg-[#F8F8F8] pt-12">
        <div className="mx-auto max-w-3xl overflow-hidden rounded-b-[14px] sm:rounded-b-2xl">
          {img ? (
            <img
              src={img}
              alt=""
              className="max-h-[min(52vh,420px)] w-full object-cover"
            />
          ) : (
            <div className="h-[min(52vh,320px)] w-full sm:h-[380px]">
              <LugarImagePlaceholder categoriaNombre={cat?.nombre} iconSize={48} />
            </div>
          )}
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <h1 className="mb-3 text-2xl font-extrabold text-[#1A1A1A] sm:text-3xl">{lugar.nombre}</h1>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {cat && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E8E8] bg-white px-3 py-1.5 text-sm font-semibold text-[#1A1A1A] shadow-sm">
              <CategoriaIconSvg nombre={cat.nombre} active size={20} />
              {cat.nombre}
            </span>
          )}
          {dep && <span className="text-sm text-[#999999]">{dep.nombre}</span>}
        </div>

        <p className="mb-2 text-sm text-[#999999]">
          <span className="font-medium text-[#1A1A1A]">Dirección: </span>
          {lugar.direccion || '—'}
        </p>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <StarRating value={rating} />
          <span className="text-sm text-[#999999]">
            · {lugar.total_resenas ?? 0}{' '}
            {lugar.total_resenas === 1 ? 'reseña' : 'reseñas'}
          </span>
        </div>

        <section className="mb-10">
          <h2 className="mb-2 text-lg font-bold text-[#1A1A1A]">Descripción</h2>
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-[#1A1A1A]">{lugar.descripcion}</p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-[#1A1A1A]">Reseñas</h2>
          {resenas.length === 0 ? (
            <p className="text-[#999999]">Aún no hay reseñas para este lugar.</p>
          ) : (
            <ul className="space-y-4">
              {resenas.map((r) => (
                <li key={r.id}>
                  <ResenaCard resena={r} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => setToast(true)}
            className="rounded-full bg-[#0EA5E9] px-5 py-3 text-center text-sm font-bold text-white shadow-sm transition hover:bg-[#0284c7]"
          >
            Escribir reseña
          </button>
          <Link
            to="/"
            className="rounded-full border border-[#E8E8E8] bg-white px-5 py-3 text-center text-sm font-semibold text-[#0EA5E9] hover:bg-[#F8F8F8]"
          >
            Volver al home
          </Link>
        </div>
      </article>
    </div>
  )
}
