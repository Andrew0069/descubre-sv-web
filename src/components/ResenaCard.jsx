import StarRating from './StarRating'

function formatRelativeEs(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.round(diffMs / 1000)
  const diffMin = Math.round(diffSec / 60)
  const diffHour = Math.round(diffMin / 60)
  const diffDay = Math.round(diffHour / 24)
  const diffWeek = Math.round(diffDay / 7)
  const diffMonth = Math.round(diffDay / 30)
  const diffYear = Math.round(diffDay / 365)

  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

  if (diffSec < 45) return 'hace un momento'
  if (diffMin < 60) return rtf.format(-diffMin, 'minute')
  if (diffHour < 24) return rtf.format(-diffHour, 'hour')
  if (diffDay < 7) return rtf.format(-diffDay, 'day')
  if (diffWeek < 5) return rtf.format(-diffWeek, 'week')
  if (diffMonth < 12) return rtf.format(-diffMonth, 'month')
  return rtf.format(-diffYear, 'year')
}

export default function ResenaCard({ resena }) {
  const nombre = resena.usuarios?.nombre?.trim()
  const autor = nombre || 'Anónimo'

  return (
    <article className="rounded-[14px] border border-[#E8E8E8] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <p className="mb-2 text-sm font-medium text-[#1A1A1A]">{autor}</p>
      <div className="mb-2">
        <StarRating value={resena.estrellas} />
      </div>
      <h3 className="mb-1 text-sm font-bold text-[#1A1A1A]">{resena.titulo}</h3>
      <p className="mb-3 text-sm leading-relaxed text-[#999999]">{resena.contenido}</p>
      <time className="text-xs text-[#999999]" dateTime={resena.created_at}>
        {formatRelativeEs(resena.created_at)}
      </time>
    </article>
  )
}
