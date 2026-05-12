import { supabase } from '../lib/supabase'

export async function getFavoritoStatus(lugarId, usuarioId) {
  const { data } = await supabase
    .from('favoritos')
    .select('id')
    .eq('lugar_id', lugarId)
    .eq('usuario_id', usuarioId)
    .maybeSingle()
  return !!data
}

export async function getFavoritosCount(lugarId) {
  const { count } = await supabase
    .from('favoritos')
    .select('*', { count: 'exact', head: true })
    .eq('lugar_id', lugarId)
  return count || 0
}

export async function addFavorito(lugarId, usuarioId) {
  await supabase
    .from('favoritos')
    .insert({ lugar_id: lugarId, usuario_id: usuarioId })
}

export async function removeFavorito(lugarId, usuarioId) {
  await supabase
    .from('favoritos')
    .delete()
    .eq('lugar_id', lugarId)
    .eq('usuario_id', usuarioId)
}

export async function getFavoritosByUsuario(usuarioId) {
  const { data } = await supabase
    .from('favoritos')
    .select('lugar_id, lugares(id, nombre, descripcion, imagen_principal, precio_entrada, departamentos(nombre))')
    .eq('usuario_id', usuarioId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getAllFavoritosConteo() {
  const { data } = await supabase.rpc('get_conteos_favoritos')
  return data ?? []
}
