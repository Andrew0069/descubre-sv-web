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

    await supabase.rpc('registrar_security_log', {
      p_event_type: eventType,
      p_email: session?.user?.email ?? null,
      p_gps_lat: gps?.lat ?? null,
      p_gps_lng: gps?.lng ?? null,
      p_gps_accuracy_m: gps?.accuracy ?? null,
      p_gps_denied: gps === null,
      p_ip_address: ip?.ip ?? null,
      p_ip_country_code: ip?.country_code ?? null,
      p_ip_country_name: ip?.country_name ?? null,
      p_ip_city: ip?.city ?? null,
      p_ip_region: ip?.region ?? null,
      p_ip_org: ip?.org ?? null,
      p_ip_is_proxy: ip?.proxy ?? null,
      p_user_agent: navigator.userAgent ?? null,
    })
  } catch {
    // silently swallow — never disrupt the login flow
  }
}
