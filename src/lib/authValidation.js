const BLOCKED_EMAIL_DOMAINS = new Set([
  'none.com',
  'mailinator.com',
  '10minutemail.com',
  'guerrillamail.com',
  'tempmail.com',
  'temp-mail.org',
  'yopmail.com',
  'throwawaymail.com',
  'trashmail.com',
  'getnada.com',
])

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SPECIAL_CHAR_RE = /[^A-Za-z0-9]/

export function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

export function getEmailDomain(email) {
  const normalized = normalizeEmail(email)
  return normalized.includes('@') ? normalized.split('@').pop() : ''
}

export function validateSignupEmail(email) {
  const normalized = normalizeEmail(email)
  const domain = getEmailDomain(normalized)

  if (!EMAIL_RE.test(normalized)) {
    return 'Ingresá un correo electrónico válido.'
  }

  if (BLOCKED_EMAIL_DOMAINS.has(domain)) {
    return 'Usá un correo permanente. No se permiten correos temporales o dominios no válidos.'
  }

  return ''
}

export function validateStrongPassword(password) {
  const value = String(password ?? '')

  if (value.length < 6) {
    return 'Mínimo 6 caracteres.'
  }

  if (!/\d/.test(value)) {
    return 'La contraseña debe incluir al menos un número.'
  }

  if (!SPECIAL_CHAR_RE.test(value)) {
    return 'La contraseña debe incluir al menos un signo especial.'
  }

  return ''
}

export function normalizeUsername(username) {
  return String(username ?? '').trim().toLowerCase()
}

export function validateProfileName(name) {
  const value = String(name ?? '').trim()

  if (value.length < 2) {
    return 'Ingresá tu nombre.'
  }

  if (value.length > 60) {
    return 'El nombre no puede superar 60 caracteres.'
  }

  return ''
}

export function validateUsername(username) {
  const value = String(username ?? '').trim()

  if (value.length < 3) {
    return 'El nombre de usuario debe tener al menos 3 caracteres.'
  }

  if (value.length > 30) {
    return 'El nombre de usuario no puede superar 30 caracteres.'
  }

  if (!/^[A-Za-z0-9_]+$/.test(value)) {
    return 'Usá solo letras, números y guion bajo (_). No se permiten caracteres especiales.'
  }

  return ''
}
