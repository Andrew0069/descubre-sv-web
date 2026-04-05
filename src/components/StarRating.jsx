const ACCENT = '#F5C518'

export default function StarRating({ value, max = 5 }) {
  const v = Math.min(max, Math.max(0, Number(value) || 0))
  const text = Number.isInteger(v) ? String(v) : v.toFixed(1)

  return (
    <span className="inline-flex items-center gap-0.5" title={`${v} de ${max}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={11}
        height={11}
        className="shrink-0"
        aria-hidden
      >
        <path
          fill={ACCENT}
          d="M12 2l2.91 5.9 6.51.95-4.71 4.59 1.11 6.48L12 17.77 6.18 19.92l1.11-6.48L2.58 8.85l6.51-.95L12 2z"
        />
      </svg>
      <span className="text-[13px] font-bold leading-none text-[#1A1A1A]">{text}</span>
    </span>
  )
}
