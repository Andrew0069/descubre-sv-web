import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { getUsuarioId } from '../services/usuariosService'

export function useNotificaciones(user) {
  const [noLeidas, setNoLeidas] = useState(0)
  const [notificaciones, setNotificaciones] = useState([])

  const fetchNotificaciones = useCallback(async () => {
    if (!user) { setNoLeidas(0); setNotificaciones([]); return }

    const usuarioId = await getUsuarioId(user.id)

    if (!usuarioId) return

    const { data } = await supabase
      .from('notificaciones')
      .select('*, actor:actor_id(nombre, foto_perfil), resena:resena_id(id, lugar_id)')
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false })
      .limit(30)

    setNotificaciones(data ?? [])
    setNoLeidas((data ?? []).filter((n) => !n.leida).length)
  }, [user])

  const marcarTodasLeidas = useCallback(async () => {
    if (!user) return
    const usuarioId = await getUsuarioId(user.id)
    if (!usuarioId) return
    await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('usuario_id', usuarioId)
      .eq('leida', false)
    setNoLeidas(0)
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))
  }, [user])

  useEffect(() => {
    fetchNotificaciones()
  }, [fetchNotificaciones])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('notificaciones-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notificaciones',
      }, () => {
        fetchNotificaciones()
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user, fetchNotificaciones])

  return { noLeidas, notificaciones, fetchNotificaciones, marcarTodasLeidas }
}
