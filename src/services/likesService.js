import { supabase } from '../lib/supabase'

export async function getLikesCountLugar(lugarId) {
  const { data, error } = await supabase
    .from('likes_lugar')
    .select('rating')
    .eq('lugar_id', lugarId)
  return { data, error }
}

export async function getUserLikeLugar(lugarId, userId) {
  const { data, error } = await supabase
    .from('likes_lugar')
    .select('rating')
    .eq('lugar_id', lugarId)
    .eq('user_id', userId)
    .maybeSingle()
  return { data, error }
}

export async function addLikeLugar(lugarId, userId) {
  const { data, error } = await supabase
    .from('likes_lugar')
    .insert({ lugar_id: lugarId, user_id: userId })
  return { data, error }
}

export async function removeLikeLugar(lugarId, userId) {
  const { data, error } = await supabase
    .from('likes_lugar')
    .delete()
    .eq('lugar_id', lugarId)
    .eq('user_id', userId)
  return { data, error }
}

export async function getLikesCountResena(resenaId) {
  const { data, error } = await supabase
    .from('likes_resena')
    .select('resena_id')
    .eq('resena_id', resenaId)
  return { data, error }
}

export async function getUserLikeResena(resenaId, userId) {
  const { data, error } = await supabase
    .from('likes_resena')
    .select('resena_id')
    .eq('resena_id', resenaId)
    .eq('user_id', userId)
    .maybeSingle()
  return { data, error }
}

export async function addLikeResena(resenaId, userId) {
  const { data, error } = await supabase
    .from('likes_resena')
    .insert({ resena_id: resenaId, user_id: userId })
  return { data, error }
}

export async function removeLikeResena(resenaId, userId) {
  const { data, error } = await supabase
    .from('likes_resena')
    .delete()
    .eq('resena_id', resenaId)
    .eq('user_id', userId)
  return { data, error }
}

export async function getAllRatingsLugares() {
  const { data, error } = await supabase
    .from('likes_lugar')
    .select('lugar_id, rating')
    .not('rating', 'is', null)
  return { data, error }
}

export async function upsertRatingLugar(lugarId, userId, rating) {
  const { data, error } = await supabase
    .from('likes_lugar')
    .upsert(
      { lugar_id: lugarId, user_id: userId, rating },
      { onConflict: 'lugar_id,user_id' }
    )
  return { data, error }
}

export async function getAllResenaLikes(resenaIds) {
  const { data, error } = await supabase
    .from('likes_resena')
    .select('resena_id')
    .in('resena_id', resenaIds)
  return { data, error }
}

export async function getMyResenaLikes(userId, resenaIds) {
  const { data, error } = await supabase
    .from('likes_resena')
    .select('resena_id')
    .eq('user_id', userId)
    .in('resena_id', resenaIds)
  return { data, error }
}
