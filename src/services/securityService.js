import { supabase } from '../lib/supabase'

function getGPSCoords() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return }
    const timer = setTimeout(() => resolve(null), 8000)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer)
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy })
      },
      () => { clearTimeout(timer); resolve(null) },
      { timeout: 8000, maximumAge: 300000 }
    )
  })
}

async function getIPData() {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) return null
    return await res.json()
  } catch {
    clearTimeout(timer)
    return null
  }
}

export async function logSecurityEvent(session, eventType = 'login') {
  try {
    const [gpsResult, ipResult] = await Promise.allSettled([getGPSCoords(), getIPData()])

    const gps = gpsResult.status === 'fulfilled' ? gpsResult.value : null
    const ip = ipResult.status === 'fulfilled' ? ipResult.value : null

    const row = {
      event_type: eventType,
      user_id: session?.user?.id ?? null,
      email: session?.user?.email ?? null,
      gps_lat: gps?.lat ?? null,
      gps_lng: gps?.lng ?? null,
      gps_accuracy_m: gps?.accuracy ?? null,
      gps_denied: gps === null,
      ip_address: ip?.ip ?? null,
      ip_country_code: ip?.country_code ?? null,
      ip_country_name: ip?.country_name ?? null,
      ip_city: ip?.city ?? null,
      ip_region: ip?.region ?? null,
      ip_org: ip?.org ?? null,
      ip_is_proxy: ip?.proxy ?? null,
      user_agent: navigator.userAgent ?? null,
    }

    // resolve usuario_db_id from usuarios table if we have a user_id
    if (row.user_id) {
      const { data: u } = await supabase
        .from('usuarios')
        .select('id')
        .eq('auth_id', row.user_id)
        .maybeSingle()
      row.usuario_db_id = u?.id ?? null
    }

    await supabase.from('security_logs').insert(row)
  } catch {
    // silently swallow — never disrupt the login flow
  }
}
