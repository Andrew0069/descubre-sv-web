export default function CategoriaChip({
  label,
  active,
  onClick,
  accentColor,
  isTodos = false,
}) {
  const base =
    'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

  if (isTodos) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} ${
          active
            ? 'border-[#1565C0] bg-[#1565C0] text-white focus-visible:ring-[#1565C0]'
            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 focus-visible:ring-gray-400'
        }`}
      >
        {label}
      </button>
    )
  }

  const c = accentColor || '#1565C0'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${
        active
          ? 'border-transparent text-white shadow-sm focus-visible:ring-[#1565C0]'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 focus-visible:ring-gray-400'
      }`}
      style={active ? { backgroundColor: c, borderColor: c } : undefined}
    >
      {label}
    </button>
  )
}
