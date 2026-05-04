export function formatRelativeShort(dateString) {
  if (!dateString) return ''
  const diff = Math.round((Date.now() - new Date(dateString).getTime()) / 60000)
  if (diff < 1) return 'hace un momento'
  if (diff < 60) return `hace ${diff} min`
  if (diff < 1440) return `hace ${Math.round(diff / 60)}h`
  return `hace ${Math.round(diff / 1440)}d`
}

export function formatRelativeEs(dateString) {
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
