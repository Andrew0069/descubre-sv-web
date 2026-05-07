import { supabase } from '../lib/supabase'

export async function getNotificacionesByUser(userId) {
  const { data, error } = await supabase
    .from('notificaciones')
    .select('*, actor:actor_id(nombre, foto_perfil), resena:resena_id(id, lugar_id)')
    .eq('usuario_id', userId)
    .order('created_at', { ascending: false })
    .limit(30)
  return { data, error }
}

export async function markAllAsRead(userId) {
  const { data, error } = await supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('usuario_id', userId)
    .eq('leida', false)
  return { data, error }
}

export async function deleteNotificacion(notificationId, userId) {
  const { data, error } = await supabase
    .from('notificaciones')
    .delete()
    .eq('id', notificationId)
    .eq('usuario_id', userId)
  return { data, error }
}

export async function createNotificacion(notificacionData) {
  const { data, error } = await supabase
    .from('notificaciones')
    .insert(notificacionData)
  return { data, error }
}
