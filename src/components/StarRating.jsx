import { useId } from 'react'

const ACCENT = '#FF6F00'

function Star({ filled, gradientId }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      aria-hidden
    >
      {gradientId && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="50%" stopColor={ACCENT} />
            <stop offset="50%" stopColor="#E5E7EB" />
          </linearGradient>
        </defs>
      )}
      <path
        fill={
          filled === 'half' && gradientId
            ? `url(#${gradientId})`
            : filled === true
              ? ACCENT
              : '#E5E7EB'
        }
        d="M12 2l2.91 5.9 6.51.95-4.71 4.59 1.11 6.48L12 17.77 6.18 19.92l1.11-6.48L2.58 8.85l6.51-.95L12 2z"
      />
    </svg>
  )
}

export default function StarRating({ value, max = 5 }) {
  const halfId = useId().replace(/:/g, '')
  const v = Math.min(max, Math.max(0, Number(value) || 0))
  const full = Math.floor(v)
  const hasHalf = v - full >= 0.5 && full < max

  return (
    <span className="inline-flex items-center gap-0.5" title={`${v.toFixed(1)} de ${max}`}>
      {Array.from({ length: max }, (_, i) => {
        if (i < full) return <Star key={i} filled />
        if (i === full && hasHalf) return <Star key={i} filled="half" gradientId={`${halfId}-h`} />
        return <Star key={i} filled={false} />
      })}
    </span>
  )
}
