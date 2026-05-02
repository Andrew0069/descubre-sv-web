import { supabase } from './supabase'

export async function checkRateLimit(identificador, accion) {
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_identificador: identificador,
    p_accion: accion,
    p_max_intentos: 60,
    p_ventana_minutos: 1,
  })
  return data
}
