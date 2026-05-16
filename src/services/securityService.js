import { supabase } from '../lib/supabase'

export const LOCATION_CONSENT_KEY = 'locationConsent'

export function getStoredLocationConsent() {
  try {
    const value = localStorage.getItem(LOCATION_CONSENT_KEY)
    return ['accepted', 'declined', 'dismissed'].includes(value) ? value : null
  } catch {
    return null
  }
}

export function setStoredLocationConsent(value) {
  if (!['accepted', 'declined', 'dismissed'].includes(value)) return
  try {
    localStorage.setItem(LOCATION_CONSENT_KEY, value)
  } catch {
    // Ignore storage failures; security logging should continue.
  }
}

export async function getBrowserGeolocationPermission() {
  if (!navigator.geolocation) return 'unavailable'
  if (!navigator.permissions?.query) return 'unknown'

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' })
    return result.state
  } catch {
    return 'unknown'
  }
}

function normalizeConsent(value) {
  return ['accepted', 'declined', 'dismissed'].includes(value) ? value : 'unknown'
}

async function getGPSCoords({ locationConsent, skipLocation } = {}) {
  const consent = normalizeConsent(locationConsent ?? getStoredLocationConsent())

  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ status: 'unavailable', consent, errorMessage: 'Geolocation API is not available' })
      return
    }

    if (skipLocation || consent === 'declined' || consent === 'dismissed') {
      resolve({ status: 'skipped', consent })
      return
    }

    const finish = (payload) => resolve({ consent, ...payload })
    const timer = setTimeout(() => finish({ status: 'timeout', errorMessage: 'GPS request timed out' }), 8000)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer)
        finish({
          status: 'granted',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
      },
      (error) => {
        clearTimeout(timer)
        if (error?.code === error.PERMISSION_DENIED) {
          finish({ status: 'denied', errorMessage: error.message || 'GPS permission denied' })
          return
        }
        if (error?.code === error.TIMEOUT) {
          finish({ status: 'timeout', errorMessage: error.message || 'GPS request timed out' })
          return
        }
        finish({ status: 'error', errorMessage: error?.message || 'GPS request failed' })
      },
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

export async function logSecurityEvent(session, eventType = 'login_exitoso', options = {}) {
  try {
    const [permission, storedConsent] = await Promise.all([
      getBrowserGeolocationPermission(),
      Promise.resolve(getStoredLocationConsent()),
    ])

    const locationConsent = normalizeConsent(options.locationConsent ?? storedConsent)
    const shouldSkipLocation =
      options.skipLocation ||
      permission === 'denied' ||
      (permission === 'prompt' && locationConsent !== 'accepted')

    const gpsPromise = permission === 'denied'
      ? Promise.resolve({ status: 'denied', consent: locationConsent, errorMessage: 'Browser permission denied' })
      : getGPSCoords({ locationConsent, skipLocation: shouldSkipLocation })

    const [gpsResult, ipResult] = await Promise.allSettled([gpsPromise, getIPData()])

    const gps = gpsResult.status === 'fulfilled'
      ? gpsResult.value
      : { status: 'error', consent: locationConsent, errorMessage: 'GPS promise rejected' }
    const ip = ipResult.status === 'fulfilled' ? ipResult.value : null

    await supabase.rpc('registrar_security_log', {
      p_event_type: eventType,
      p_email: session?.user?.email ?? null,
      p_gps_lat: gps?.lat ?? null,
      p_gps_lng: gps?.lng ?? null,
      p_gps_accuracy_m: gps?.accuracy ?? null,
      p_gps_denied: gps?.status === 'denied',
      p_gps_status: gps?.status ?? 'error',
      p_gps_error_message: gps?.errorMessage ?? null,
      p_location_consent: gps?.consent ?? locationConsent,
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
