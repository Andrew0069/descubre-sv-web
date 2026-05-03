import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { normalizeEmail, validateSignupEmail, validateStrongPassword } from '../lib/authValidation'

const MSG_BLOQUEO =
  "Tu cuenta ha sido bloqueada por seguridad. Usa '¿Olvidaste tu contraseña?' para desbloquearla."

function parseRpcPayload(data) {
  if (data == null) return null
  if (Array.isArray(data)) return data[0] ?? null
  return data
}

function intentosRestantesDesde(row) {
  if (!row || typeof row !== 'object') return null
  const v =
    row.intentos_restantes ??
    row.intentosRestantes ??
    row.restantes ??
    row.intentos_quedan
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function esCredencialesInvalidasAuth(error) {
  if (!error) return false
  const msg = String(error.message ?? '').toLowerCase()
  return msg.includes('invalid login credentials')
}

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [forgotMode, setForgotMode] = useState(false)
  const [cuentaBloqueada, setCuentaBloqueada] = useState(false)

  useEffect(() => {
    const normalized = normalizeEmail(email)
    if (!normalized.includes('@')) {
      setCuentaBloqueada(false)
      return
    }
    let cancelled = false
    const t = setTimeout(async () => {
      const { data, error: qErr } = await supabase
        .from('usuarios')
        .select('bloqueado')
        .eq('email', normalized)
        .maybeSingle()
      if (cancelled) return
      if (qErr) {
        console.error('[Login] bloqueado check:', qErr)
        setCuentaBloqueada(false)
        return
      }
      setCuentaBloqueada(data?.bloqueado === true)
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [email])

  const handleEmailAuth = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    if (!email || !password) {
      setError('Completá todos los campos.')
      setLoading(false)
      return
    }

    if (!isSignUp && cuentaBloqueada) {
      setError(MSG_BLOQUEO)
      setLoading(false)
      return
    }

    if (isSignUp) {
      const emailError = validateSignupEmail(email)
      if (emailError) {
        setError(emailError)
        setLoading(false)
        return
      }

      const passwordError = validateStrongPassword(password)
      if (passwordError) {
        setError(passwordError)
        setLoading(false)
        return
      }

      const { error: signUpErr } = await supabase.auth.signUp({ email: normalizeEmail(email), password })
      if (signUpErr) setError(signUpErr.message)
      else setSuccess('¡Cuenta creada! Revisá tu correo para confirmar.')
      setLoading(false)
      return
    }

    const { data: authData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
    if (signInErr) {
      if (esCredencialesInvalidasAuth(signInErr)) {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('registrar_intento_fallido', {
          p_email: normalizeEmail(email),
        })
        if (rpcErr) {
          console.error('[Login] registrar_intento_fallido:', rpcErr)
          setError('Contraseña incorrecta.')
          setLoading(false)
          return
        }
        const row = parseRpcPayload(rpcData)
        if (row?.bloqueado === true) {
          setCuentaBloqueada(true)
          setError(MSG_BLOQUEO)
        } else {
          const rest = intentosRestantesDesde(row)
          if (rest != null) {
            setError(
              `Contraseña incorrecta. Te quedan ${rest} intentos antes de que tu cuenta sea bloqueada.`,
            )
          } else {
            setError('Contraseña incorrecta.')
          }
        }
      } else {
        setError(signInErr.message)
      }
      setLoading(false)
      return
    }

    const uid = authData?.session?.user?.id
    if (uid) {
      const { error: resetErr } = await supabase.rpc('resetear_intentos', { p_user_id: uid })
      if (resetErr) console.error('[Login] resetear_intentos:', resetErr)
    }

    setCuentaBloqueada(false)
    navigate('/')
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  const handleForgotPassword = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    if (!email) {
      setError('Ingresá tu correo primero.')
      setLoading(false)
      return
    }
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (resetErr) setError('No se pudo enviar el correo. Intentá de nuevo.')
    else setSuccess('¡Correo enviado! Revisá tu bandeja de entrada.')
    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    padding: '0.8rem 1rem',
    borderRadius: '10px',
    border: '1.5px solid #e5e7eb',
    fontSize: '0.95rem',
    color: '#111827',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '0.75rem',
    fontFamily: 'inherit',
  }

  const mensajeBloqueoVisible = !isSignUp && cuentaBloqueada
  const textoError = mensajeBloqueoVisible ? MSG_BLOQUEO : error

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: '3rem 2.5rem',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#111827', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          <span style={{ color: '#F5A623' }}>S</span>potter
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '2rem' }}>
          {isSignUp ? 'Creá tu cuenta gratis' : 'Accedé para guardar favoritos y escribir reseñas'}
        </p>

        {/* Email + Password */}
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
          style={inputStyle}
        />

        {!isSignUp && (
          <div style={{ textAlign: 'right', marginBottom: '0.75rem', marginTop: '-0.5rem' }}>
            <span
              onClick={handleForgotPassword}
              style={{ color: '#0EA5E9', fontSize: '0.82rem', cursor: 'pointer' }}
            >
              ¿Olvidaste tu contraseña?
            </span>
          </div>
        )}

        {textoError && (
          <p style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{textoError}</p>
        )}
        {success && (
          <p style={{ color: '#10B981', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{success}</p>
        )}

        <button
          type="button"
          onClick={handleEmailAuth}
          disabled={loading || (!isSignUp && cuentaBloqueada)}
          style={{
            width: '100%',
            backgroundColor: '#0EA5E9',
            color: '#ffffff',
            border: 'none',
            borderRadius: '50px',
            padding: '0.85rem 1.5rem',
            fontSize: '0.95rem',
            fontWeight: '700',
            cursor: loading || (!isSignUp && cuentaBloqueada) ? 'not-allowed' : 'pointer',
            opacity: loading || (!isSignUp && cuentaBloqueada) ? 0.7 : 1,
            marginBottom: '1rem',
          }}
        >
          {loading ? 'Cargando...' : isSignUp ? 'Crear cuenta' : 'Ingresar'}
        </button>

        <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {isSignUp ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}{' '}
          <span
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
              setSuccess('')
            }}
            style={{ color: '#0EA5E9', cursor: 'pointer', fontWeight: '600' }}
          >
            {isSignUp ? 'Ingresá' : 'Registrate'}
          </span>
        </p>

        {/* Divisor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
          <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>o</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
        </div>

        {/* Google secundario */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            backgroundColor: '#ffffff',
            border: '1.5px solid #e5e7eb',
            borderRadius: '50px',
            padding: '0.85rem 1.5rem',
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#374151',
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)' }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continuar con Google
        </button>

        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            marginTop: '1.25rem',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#9ca3af',
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          ← Volver al inicio
        </button>
      </div>
    </div>
  )
}
