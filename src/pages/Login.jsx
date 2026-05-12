import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getUsuarioBloqueado } from '../services/usuariosService'
import {
  normalizeEmail,
  normalizeUsername,
  validateProfileName,
  validateSignupEmail,
  validateStrongPassword,
  validateUsername,
} from '../lib/authValidation'

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

function EyeIcon({ crossed = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
      {crossed ? <path d="M4 4l16 16" /> : null}
    </svg>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [nombre, setNombre] = useState('')
  const [username, setUsername] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [forgotMode, setForgotMode] = useState(false)
  const [cuentaBloqueada, setCuentaBloqueada] = useState(false)
  const [splashVisible, setSplashVisible] = useState(true)
  const [splashFading, setSplashFading] = useState(false)
  const [cardVisible, setCardVisible] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => {
      setSplashFading(true)
      setCardVisible(true)
    }, 550)
    const t2 = setTimeout(() => setSplashVisible(false), 1100)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  const returnTo =
    typeof location.state?.from === 'string' && location.state.from.startsWith('/')
      ? location.state.from
      : '/'

  useEffect(() => {
    const normalized = normalizeEmail(email)
    if (!normalized.includes('@')) {
      setCuentaBloqueada(false)
      return
    }
    let cancelled = false
    const t = setTimeout(async () => {
      const { data: userData, error: qErr } = await getUsuarioBloqueado(normalized)
      if (cancelled) return
      if (qErr) {
        console.error('[Login] bloqueado check:', qErr)
        setCuentaBloqueada(false)
        return
      }
      setCuentaBloqueada(userData?.bloqueado === true)
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

    if (!email || !password || (isSignUp && (!nombre || !username))) {
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
      const nombreError = validateProfileName(nombre)
      if (nombreError) {
        setError(nombreError)
        setLoading(false)
        return
      }

      const usernameError = validateUsername(username)
      if (usernameError) {
        setError(usernameError)
        setLoading(false)
        return
      }

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

      const normalizedUsername = normalizeUsername(username)

      const { data: existingEmail, error: emailCheckErr } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', normalizeEmail(email))
        .maybeSingle()

      if (emailCheckErr) {
        setError('No pudimos validar el correo. Intentá de nuevo.')
        setLoading(false)
        return
      }

      if (existingEmail) {
        setError('Ya existe una cuenta con ese correo electrónico.')
        setLoading(false)
        return
      }

      const { data: existingUsername, error: usernameCheckErr } = await supabase
        .from('usuarios')
        .select('id')
        .eq('username', normalizedUsername)
        .maybeSingle()

      if (usernameCheckErr) {
        setError('No pudimos validar el nombre de usuario. Intentá de nuevo.')
        setLoading(false)
        return
      }

      if (existingUsername) {
        setError('Ese nombre de usuario ya está en uso.')
        setLoading(false)
        return
      }

      const { error: signUpErr } = await supabase.auth.signUp({
        email: normalizeEmail(email),
        password,
        options: {
          data: {
            nombre: nombre.trim(),
            username: normalizedUsername,
          },
        },
      })
      if (signUpErr) {
        if (signUpErr.message.toLowerCase().includes('user already registered')) {
          setError('El usuario ya está registrado.')
        } else {
          setError(signUpErr.message)
        }
        setLoading(false)
        return
      }
      setNombre('')
      setUsername('')
      setPassword('')
      setShowPassword(false)
      setIsSignUp(false)
      setSuccess('¡Cuenta creada! Ingresá con tus datos.')
      setLoading(false)
      return
    }

    const { data: authData, error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
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
    navigate(returnTo, { replace: true })
    setLoading(false)
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

  const passwordWrapperStyle = {
    position: 'relative',
    marginBottom: '0.75rem',
  }

  const passwordInputStyle = {
    ...inputStyle,
    marginBottom: 0,
    paddingRight: '3rem',
  }

  const passwordToggleStyle = {
    position: 'absolute',
    top: '50%',
    right: '0.75rem',
    transform: 'translateY(-50%)',
    border: 'none',
    background: 'transparent',
    padding: 0,
    width: '1.75rem',
    height: '1.75rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#6b7280',
  }

  const mensajeBloqueoVisible = !isSignUp && cuentaBloqueada
  const textoError = mensajeBloqueoVisible ? MSG_BLOQUEO : error

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '3rem 2.5rem',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          textAlign: 'center',
          opacity: cardVisible ? 1 : 0,
          transform: cardVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: '800',
            color: '#111827',
            marginBottom: '0.5rem',
            letterSpacing: '-0.02em',
          }}
        >
          <span style={{ color: '#F5A623' }}>S</span>potter
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '2rem' }}>
          {isSignUp ? 'Creá tu cuenta gratis' : 'Accedé para guardar favoritos y escribir reseñas'}
        </p>

        {isSignUp && (
          <>
            <input
              type="text"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value.slice(0, 60))}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value.slice(0, 30))}
              style={inputStyle}
            />
          </>
        )}

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <div style={passwordWrapperStyle}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
            style={passwordInputStyle}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={showPassword}
            style={passwordToggleStyle}
          >
            <EyeIcon crossed={showPassword} />
          </button>
        </div>

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
          <p style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            {textoError}
          </p>
        )}
        {success && (
          <p style={{ color: '#10B981', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            {success}
          </p>
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
              setShowPassword(false)
              setForgotMode(false)
            }}
            style={{ color: '#0EA5E9', cursor: 'pointer', fontWeight: '600' }}
          >
            {isSignUp ? 'Ingresá' : 'Registrate'}
          </span>
        </p>

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

      {splashVisible && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            opacity: splashFading ? 0 : 1,
            transition: 'opacity 0.55s ease',
            pointerEvents: splashFading ? 'none' : 'all',
          }}
        >
          <svg viewBox="0 0 200 48" height="52" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22 2 C13 2, 5 10, 5 20 C5 33, 22 48, 22 48 C22 48, 39 33, 39 20 C39 10 31 2, 22 2 Z"
              fill="#F5A623"
            />
            <circle cx="22" cy="19" r="10" fill="#1a1a2e" />
            <path
              d="M10 19 C13 14, 18 14, 22 19 C26 24, 31 24, 34 19"
              fill="none"
              stroke="#F5A623"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M11 24 C14 20, 18 20, 22 24 C26 28, 30 28, 33 24"
              fill="none"
              stroke="#F5A623"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.45"
            />
            <circle cx="33" cy="8" r="2.5" fill="#F5A623" opacity="0.4" />
            <text
              x="46"
              y="30"
              fontFamily="Georgia, serif"
              fontSize="26"
              fontWeight="700"
              letterSpacing="-1"
              fill="#1a1a2e"
            >
              <tspan fill="#F5A623">S</tspan>
              <tspan fill="#1a1a2e">potter</tspan>
            </text>
          </svg>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#F5A623',
                  animation: `splashDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
          <style>{`
            @keyframes splashDot {
              0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
              40% { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}
