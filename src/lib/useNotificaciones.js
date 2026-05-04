import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { getUsuarioId } from '../services/usuariosService'
import { getNotificacionesByUser, markAllAsRead as markNotifsRead } from '../services/notificacionesService'
export function useNotificaciones(user) {
  const [noLeidas, setNoLeidas] = useState(0)
  const [notificaciones, setNotificaciones] = useState([])

  const fetchNotificaciones = useCallback(async () => {
    if (!user) { setNoLeidas(0); setNotificaciones([]); return }

    const usuarioId = await getUsuarioId(user.id)

    if (!usuarioId) return

    const { data } = await getNotificacionesByUser(usuarioId)

    setNotificaciones(data ?? [])
    setNoLeidas((data ?? []).filter((n) => !n.leida).length)
  }, [user])

  const marcarTodasLeidas = useCallback(async () => {
    if (!user) return
    const usuarioId = await getUsuarioId(user.id)
    if (!usuarioId) return
    await markNotifsRead(usuarioId)
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
