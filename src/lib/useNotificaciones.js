import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

export function useNotificaciones(user) {
  const [noLeidas, setNoLeidas] = useState(0)
  const [notificaciones, setNotificaciones] = useState([])

  const fetchNotificaciones = useCallback(async () => {
    if (!user) { setNoLeidas(0); setNotificaciones([]); return }

    const { data: usuarioRow } = await supabase
      .from('usuarios')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle()

    if (!usuarioRow) return

    const { data } = await supabase
      .from('notificaciones')
      .select('*, actor:actor_id(nombre), resena:resena_id(id, lugar_id)')
      .eq('usuario_id', usuarioRow.id)
      .order('created_at', { ascending: false })
      .limit(30)

    setNotificaciones(data ?? [])
    setNoLeidas((data ?? []).filter((n) => !n.leida).length)
  }, [user])

  const marcarTodasLeidas = useCallback(async () => {
    if (!user) return
    const { data: usuarioRow } = await supabase
      .from('usuarios')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle()
    if (!usuarioRow) return
    await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('usuario_id', usuarioRow.id)
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
