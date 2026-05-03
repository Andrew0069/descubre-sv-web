import { supabase } from './supabase'

/**
 * Normaliza un valor de imagen a una URL pública usable.
 * - URL completa (https://...)  → se usa directamente
 * - Path de storage             → se convierte con getPublicUrl
 * - null / vacío                → null (el componente debe usar fallback)
 */
function applyStorageTransform(url, transform) {
  if (!transform?.width) return url

  try {
    const parsed = new URL(url)
    const isSupabaseStorage = parsed.pathname.includes('/storage/v1/')
    if (!isSupabaseStorage) return url

    if (parsed.pathname.includes('/storage/v1/object/public/')) {
      parsed.pathname = parsed.pathname.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
    }

    parsed.searchParams.set('width', String(transform.width))
    if (transform.height) parsed.searchParams.set('height', String(transform.height))
    if (transform.resize) parsed.searchParams.set('resize', transform.resize)
    return parsed.toString()
  } catch {
    return url
  }
}

export function resolveImageUrl(value, bucket = 'lugares-fotos', options = {}) {
  if (!value || typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return applyStorageTransform(trimmed, options.transform)
  }
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(trimmed, options.transform ? { transform: options.transform } : undefined)
  return data?.publicUrl ?? null
}
