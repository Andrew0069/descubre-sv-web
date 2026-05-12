import { supabase } from '../lib/supabase'

/**
 * Obtiene el id interno de la tabla usuarios dado un auth_id de Supabase Auth.
 * @param {string} authId - session.user.id
 * @returns {Promise<string|null>} - id interno o null
 */
export async function getUsuarioId(authId) {
  const { data } = await supabase
    .from('usuarios')
    .select('id')
    .eq('auth_id', authId)
    .maybeSingle()
  return data?.id ?? null
}

/**
 * Obtiene id, nombre publico y campos de avatar dado un auth_id.
 * @param {string} authId - session.user.id
 * @returns {Promise<{id, username, foto_perfil, avatar_url}|null>}
 */
export async function getUsuarioPerfil(authId) {
  const { data } = await supabase
    .from('usuarios')
    .select('id, username, foto_perfil, avatar_url')
    .eq('auth_id', authId)
    .maybeSingle()
  return data ?? null
}

/**
 * Obtiene el perfil completo de un usuario dado su auth_id.
 * @param {string} authId
 * @returns {Promise<Object|null>}
 */
export async function getUsuarioCompleto(authId) {
  const { data } = await supabase
    .from('usuarios')
    .select('*')
    .eq('auth_id', authId)
    .maybeSingle()
  return data ?? null
}

/**
 * Actualiza nombre privado, nombre de usuario y bio de un usuario.
 * @param {string} authId
 * @param {string} nombre
 * @param {string} username
 * @param {string} bio
 * @returns {Promise<{error}>}
 */
export async function updateUsuarioPerfil(authId, nombre, username, bio) {
  const payload = { nombre, bio }
  if (username != null) payload.username = username

  const { error } = await supabase
    .from('usuarios')
    .update(payload)
    .eq('auth_id', authId)
  return { error }
}

/**
 * Actualiza la foto de perfil de un usuario.
 * @param {string} authId
 * @param {string} url - URL pública o string vacío para eliminar
 * @returns {Promise<void>}
 */
export async function updateUsuarioFoto(authId, url) {
  await supabase
    .from('usuarios')
    .update({ foto_perfil: url })
    .eq('auth_id', authId)
}

/**
 * Verifica si un usuario es admin dado su auth_id.
 * @param {string} authId
 * @returns {Promise<{id, is_admin}|null>}
 */
export async function getUsuarioAdmin(authId) {
  const { data } = await supabase
    .from('usuarios')
    .select('id, is_admin')
    .eq('auth_id', authId)
    .maybeSingle()
  return data ?? null
}

/**
 * Obtiene avatar y nombre dado un auth_id.
 * @param {string} authId
 * @returns {Promise<{foto_perfil, avatar_url, nombre}|null>}
 */
export async function getUsuarioNavbar(authId) {
  const { data } = await supabase
    .from('usuarios')
    .select('foto_perfil, avatar_url, nombre, is_admin')
    .eq('auth_id', authId)
    .maybeSingle()
  return data ?? null
}

/**
 * Verifica si un usuario está bloqueado dado su email.
 * @param {string} email
 * @returns {Promise<{bloqueado}|null>}
 */
export async function getUsuarioBloqueado(email) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('bloqueado')
    .eq('email', email)
    .maybeSingle()
  return { data: data ?? null, error }
}
