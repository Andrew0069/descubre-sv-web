import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { getUsuarioId } from '../services/usuariosService'
import { deleteNotificacion, getNotificacionesByUser, markAllAsRead as markNotifsRead } from '../services/notificacionesService'

const getDismissedKey = (authUserId) => `notificaciones_descartadas:${authUserId}`

function getDismissedIds(authUserId) {
  if (!authUserId || typeof window === 'undefined') return new Set()
  try {
    return new Set(JSON.parse(window.localStorage.getItem(getDismissedKey(authUserId)) || '[]'))
  } catch {
    return new Set()
  }
}

function saveDismissedId(authUserId, notificationId) {
  if (!authUserId || !notificationId || typeof window === 'undefined') return
  const ids = getDismissedIds(authUserId)
  ids.add(notificationId)
  window.localStorage.setItem(getDismissedKey(authUserId), JSON.stringify([...ids]))
}

export function useNotificaciones(user) {
  const [noLeidas, setNoLeidas] = useState(0)
  const [notificaciones, setNotificaciones] = useState([])

  const fetchNotificaciones = useCallback(async () => {
    if (!user) { setNoLeidas(0); setNotificaciones([]); return }

    const usuarioId = await getUsuarioId(user.id)

    if (!usuarioId) return

    const { data } = await getNotificacionesByUser(usuarioId)

    const dismissedIds = getDismissedIds(user.id)
    const visibles = (data ?? []).filter((n) => !dismissedIds.has(n.id))

    setNotificaciones(visibles)
    setNoLeidas(visibles.filter((n) => !n.leida).length)
  }, [user])

  const marcarTodasLeidas = useCallback(async () => {
    if (!user) return
    const usuarioId = await getUsuarioId(user.id)
    if (!usuarioId) return
    await markNotifsRead(usuarioId)
    setNoLeidas(0)
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))
  }, [user])

  const descartarNotificacion = useCallback(async (notificationId) => {
    if (!user || !notificationId) return
    const usuarioId = await getUsuarioId(user.id)
    if (!usuarioId) return

    saveDismissedId(user.id, notificationId)
    setNotificaciones((prev) => prev.filter((n) => n.id !== notificationId))
    setNoLeidas((prev) => {
      const eraNoLeida = notificaciones.some((n) => n.id === notificationId && !n.leida)
      return eraNoLeida ? Math.max(0, prev - 1) : prev
    })

    const { error } = await deleteNotificacion(notificationId, usuarioId)
    if (error) fetchNotificaciones()
  }, [fetchNotificaciones, notificaciones, user])

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

  return { noLeidas, notificaciones, fetchNotificaciones, marcarTodasLeidas, descartarNotificacion }
}
