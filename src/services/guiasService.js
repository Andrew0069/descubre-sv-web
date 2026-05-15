import { supabase } from '../lib/supabase'

export async function getGuiasByUser(userId) {
  const { data, error } = await supabase
    .from('guias')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function createGuia({ user_id, nombre, descripcion, lugares_ids, paradas_config }) {
  const { data, error } = await supabase
    .from('guias')
    .insert({ user_id, nombre, descripcion, lugares_ids, paradas_config: paradas_config ?? {} })
    .select()
    .single()
  return { data, error }
}

export async function updateGuia(id, { nombre, descripcion, lugares_ids, paradas_config }) {
  const { data, error } = await supabase
    .from('guias')
    .update({ nombre, descripcion, lugares_ids, paradas_config: paradas_config ?? {} })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function completarGuia(guia) {
  const { data, error } = await supabase
    .from('guias')
    .update({
      paradas_config: {
        ...(guia.paradas_config ?? {}),
        _estado: 'completada',
        _completado_en: new Date().toISOString(),
      },
    })
    .eq('id', guia.id)
    .select()
    .single()
  return { data, error }
}

export async function deleteGuia(id) {
  const { error } = await supabase
    .from('guias')
    .delete()
    .eq('id', id)
  return { error }
}
