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
    .select(`id, nombre, descripcion, direccion, departamento_id, categoria_id, precio_entrada, subtipo, destacado, imagen_principal, latitud, longitud, horarios, info_viajero, tiene_wifi, apto_familias, tiempo_recomendado, dato_viajero, es_joya_local, updated_at, categorias(id, nombre, color), departamentos(id, nombre)`)
    .order('nombre', { ascending: true })
  return { data: data ?? [], error }
}

export async function createLugar(payload) {
  const { data, error } = await supabase
    .from('lugares')
    .insert(payload)
    .select(`id, nombre, descripcion, direccion, departamento_id, categoria_id, precio_entrada, subtipo, destacado, imagen_principal, latitud, longitud, horarios, info_viajero, tiene_wifi, apto_familias, tiempo_recomendado, dato_viajero, es_joya_local, updated_at, categorias(id, nombre, color), departamentos(id, nombre)`)
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

export async function getLugaresCercanos({ lat, lng, excludeId, limit = 4 }) {
  if (lat == null || lng == null) return { data: [], error: null }
  const { data, error } = await supabase
    .from('lugares')
    .select('id, nombre, latitud, longitud, imagen_principal, categorias(nombre, color), departamentos(nombre), imagenes_lugar(ruta_imagen, orden)')
    .eq('aprobado', true)
    .not('latitud', 'is', null)
    .not('longitud', 'is', null)
    .neq('id', excludeId)
  if (error || !data) return { data: [], error }
  const valid = data.filter((l) => {
    const la = Number(l.latitud), ln = Number(l.longitud)
    return Number.isFinite(la) && Number.isFinite(ln) && !(la === 0 && ln === 0)
  })
  const toRad = (d) => (d * Math.PI) / 180
  const dist = (a, b) => {
    const R = 6371
    const dLat = toRad(b.lat - a.lat)
    const dLng = toRad(b.lng - a.lng)
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
    return 2 * R * Math.asin(Math.sqrt(s))
  }
  const enriched = valid
    .map((l) => {
      const sortedImgs = (l.imagenes_lugar || []).slice().sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      const fallbackImg = sortedImgs[0]?.ruta_imagen ?? null
      return {
        ...l,
        cover: l.imagen_principal || fallbackImg,
        _km: dist({ lat, lng }, { lat: Number(l.latitud), lng: Number(l.longitud) }),
      }
    })
    .sort((a, b) => a._km - b._km)
    .slice(0, limit)
  return { data: enriched, error: null }
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
