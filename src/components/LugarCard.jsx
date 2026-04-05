import { Link } from 'react-router-dom'
import StarRating from './StarRating'

function ImagePlaceholder() {
  return (
    <div className="flex h-full min-h-[10rem] w-full items-center justify-center bg-gray-200 text-gray-400">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-14 w-14"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.25}
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

export default function LugarCard({ lugar }) {
  const cat = lugar.categorias
  const dep = lugar.departamentos
  const img = lugar.imagen_principal?.trim()

  return (
    <Link
      to={`/lugar/${lugar.id}`}
      className="block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {img ? (
          <img
            src={img}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <ImagePlaceholder />
        )}
      </div>
      <div className="space-y-2 p-4">
        <h2 className="text-lg font-bold text-gray-900">{lugar.nombre}</h2>
        <p className="text-sm text-gray-500">{dep?.nombre ?? '—'}</p>
        {cat && (
          <span
            className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: cat.color || '#1565C0' }}
          >
            {cat.nombre}
          </span>
        )}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <StarRating value={Number(lugar.promedio_estrellas) || 0} />
          <span className="text-gray-500">
            ({lugar.total_resenas ?? 0}{' '}
            {lugar.total_resenas === 1 ? 'reseña' : 'reseñas'})
          </span>
        </div>
      </div>
    </Link>
  )
}
