import { supabase } from './supabase'

/**
 * Normaliza un valor de imagen a una URL pública usable.
 * - URL completa (https://...)  → se usa directamente
 * - Path de storage             → se convierte con getPublicUrl
 * - null / vacío                → null (el componente debe usar fallback)
 */
export function resolveImageUrl(value, bucket = 'lugares-fotos') {
  if (!value || typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  const { data } = supabase.storage.from(bucket).getPublicUrl(trimmed)
  return data?.publicUrl ?? null
}
