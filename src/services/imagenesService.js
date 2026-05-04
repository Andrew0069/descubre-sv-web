import { supabase } from '../lib/supabase'

export async function getImagenesByLugar(lugarId) {
  const { data, error } = await supabase
    .from('imagenes_lugar')
    .select('id, lugar_id, ruta_imagen, orden')
    .eq('lugar_id', lugarId)
    .order('orden', { ascending: true })
  return { data, error }
}

export async function reorderImagenes(updates) {
  const results = await Promise.all(
    updates.map((u) =>
      supabase.from('imagenes_lugar').update({ orden: u.orden }).eq('id', u.id)
    )
  )
  const error = results.find((r) => r.error)?.error ?? null
  return { data: null, error }
}

export async function deleteImagen(imagenId) {
  const { data, error } = await supabase
    .from('imagenes_lugar')
    .delete()
    .eq('id', imagenId)
  return { data, error }
}

export async function createImagenLugar(imagenData) {
  const { data, error } = await supabase
    .from('imagenes_lugar')
    .insert(imagenData)
    .select('id')
    .maybeSingle()
  return { data, error }
}
export const swapImagenOrden = async (imgAId, ordenB, imgBId, ordenA) => {
  const [resA, resB] = await Promise.all([
    supabase.from('imagenes_lugar').update({ orden: ordenB }).eq('id', imgAId),
    supabase.from('imagenes_lugar').update({ orden: ordenA }).eq('id', imgBId),
  ])
  return { errorA: resA.error, errorB: resB.error }
}
