import { supabase } from '../lib/supabase'

export async function getLugaresHome() {
  const { data, error } = await supabase
    .from('lugares')
    .select('id, nombre, categoria_id, subtipo, destacado, imagen_principal, precio_entrada, horarios, updated_at, categorias(nombre, color), departamentos(nombre), imagenes_lugar(ruta_imagen, orden)')
    .eq('aprobado', true)
    .order('destacado', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false })
  return { data: data ?? [], error }
}

export async function getLugarById(id) {
  const { data, error } = await supabase
    .from('lugares')
    .select('*, categorias(*), departamentos(*)')
    .eq('id', id)
    .eq('aprobado', true)
    .maybeSingle()
  return { data: data ?? null, error }
}

export async function getLugaresAdmin() {
  const { data, error } = await supabase
    .from('lugares')
    .select(`id, nombre, descripcion, direccion, departamento_id, categoria_id, precio_entrada, subtipo, destacado, imagen_principal, latitud, longitud, horarios, info_viajero, updated_at, categorias(id, nombre, color), departamentos(id, nombre)`)
    .order('nombre', { ascending: true })
  return { data: data ?? [], error }
}

export async function createLugar(payload) {
  const { data, error } = await supabase
    .from('lugares')
    .insert(payload)
    .select(`id, nombre, descripcion, direccion, departamento_id, categoria_id, precio_entrada, subtipo, destacado, imagen_principal, latitud, longitud, horarios, info_viajero, updated_at, categorias(id, nombre, color), departamentos(id, nombre)`)
    .maybeSingle()
  return { data: data ?? null, error }
}

export async function updateLugar(id, payload) {
  const { error } = await supabase
    .from('lugares')
    .update(payload)
    .eq('id', id)
  return { error }
}

export async function deleteLugar(id) {
  const { data, error } = await supabase
    .from('lugares')
    .delete()
    .eq('id', id)
    .select('id')
  return { data, error }
}

export async function updateImagenPrincipal(id, url) {
  const { error } = await supabase
    .from('lugares')
    .update({ imagen_principal: url })
    .eq('id', id)
  return { error }
}

export async function getLugaresByIds(ids) {
  if (!ids || ids.length === 0) return { data: [], error: null }
  const { data, error } = await supabase
    .from('lugares')
    .select('id, nombre, latitud, longitud, direccion, imagen_principal, categorias(nombre, color), departamentos(nombre)')
    .in('id', ids)
    .eq('aprobado', true)
  return { data: data ?? [], error }
}
