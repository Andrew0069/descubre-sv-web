import { supabase } from '../lib/supabase'

export async function getResenasByLugar(lugarId) {
  const { data, error } = await supabase
    .from('resenas')
    .select('*, usuarios(nombre, avatar_url)')
    .eq('lugar_id', lugarId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function createResena(resenaData) {
  const { data, error } = await supabase
    .from('resenas')
    .insert(resenaData)
  return { data, error }
}

export async function getResenasAdmin() {
  const { data, error } = await supabase
    .from('resenas')
    .select(`
      id,
      usuario_id,
      lugar_id,
      titulo,
      contenido,
      created_at,
      estrellas,
      usuarios(nombre),
      lugares(nombre)
    `)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function updateResenaEstado(resenaId, estado) {
  const { data, error } = await supabase
    .from('resenas')
    .update({ estado })
    .eq('id', resenaId)
  return { data, error }
}
export const deleteResena = async (resenaId) => {
  const { error } = await supabase.from('resenas').delete().eq('id', resenaId)
  return { error }
}
