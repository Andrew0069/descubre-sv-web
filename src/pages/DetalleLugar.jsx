import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import StarRating from '../components/StarRating'
import ResenaCard from '../components/ResenaCard'

function HeroPlaceholder() {
  return (
    <div className="flex h-full min-h-[220px] w-full items-center justify-center bg-gray-200 text-gray-400 sm:min-h-[320px]">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-20 w-20"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3A1.5 1.5 0 0 0 1.5 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008H12V8.25Z"
        />
      </svg>
    </div>
  )
}

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
      <div className="min-h-screen bg-[#FAFAFA] pt-16">
        <p className="px-4 py-8 text-center text-gray-500">Cargando…</p>
      </div>
    )
  }

  if (notFound || !lugar) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] px-4 pt-20">
        <p className="mb-4 text-center text-gray-600">No encontramos este lugar.</p>
        <div className="text-center">
          <Link
            to="/"
            className="inline-block rounded-full bg-[#1565C0] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0d47a1]"
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

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-16">
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-50 max-w-[min(100%-2rem,28rem)] -translate-x-1/2 rounded-xl border border-gray-200 bg-gray-900 px-4 py-3 text-center text-sm text-white shadow-lg"
          role="status"
        >
          Próximamente — registrate para reseñar
        </div>
      )}

      <header className="fixed left-0 right-0 top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center px-4 py-3">
          <Link to="/" className="text-lg font-bold text-[#1565C0]">
            Descubre SV
          </Link>
        </div>
      </header>

      <div className="overflow-hidden bg-gray-100 pt-14">
        {img ? (
          <img src={img} alt="" className="max-h-[420px] w-full object-cover" />
        ) : (
          <HeroPlaceholder />
        )}
      </div>

      <article className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-3 text-2xl font-bold text-gray-900 sm:text-3xl">{lugar.nombre}</h1>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {cat && (
            <span
              className="inline-block rounded-full px-3 py-1 text-sm font-medium text-white"
              style={{ backgroundColor: cat.color || '#1565C0' }}
            >
              {cat.nombre}
            </span>
          )}
          {dep && <span className="text-gray-500">{dep.nombre}</span>}
        </div>

        <p className="mb-2 text-gray-700">
          <span className="font-medium text-gray-800">Dirección: </span>
          {lugar.direccion || '—'}
        </p>

        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
          <StarRating value={Number(lugar.promedio_estrellas) || 0} />
          <span className="text-gray-600">
            {Number(lugar.promedio_estrellas || 0).toFixed(1)} · {lugar.total_resenas ?? 0}{' '}
            {lugar.total_resenas === 1 ? 'reseña' : 'reseñas'}
          </span>
        </div>

        <section className="mb-10">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Descripción</h2>
          <p className="whitespace-pre-line text-gray-700 leading-relaxed">{lugar.descripcion}</p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Reseñas</h2>
          {resenas.length === 0 ? (
            <p className="text-gray-500">Aún no hay reseñas para este lugar.</p>
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
            className="rounded-full bg-[#FF6F00] px-5 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-[#e65f00]"
          >
            Escribir reseña
          </button>
          <Link
            to="/"
            className="rounded-full border-2 border-[#1565C0] px-5 py-3 text-center text-sm font-semibold text-[#1565C0] hover:bg-[#1565C0]/5"
          >
            Volver al home
          </Link>
        </div>
      </article>
    </div>
  )
}
