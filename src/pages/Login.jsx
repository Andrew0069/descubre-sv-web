import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleEmailAuth = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    if (!email || !password) {
      setError('Completá todos los campos.')
      setLoading(false)
      return
    }

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setSuccess('¡Cuenta creada! Revisá tu correo para confirmar.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('Correo o contraseña incorrectos.')
      else window.location.href = '/'
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
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
          Descubre<span style={{ color: '#0EA5E9' }}>SV</span>
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

        {error && (
          <p style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>
        )}
        {success && (
          <p style={{ color: '#10B981', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{success}</p>
        )}

        <button
          type="button"
          onClick={handleEmailAuth}
          disabled={loading}
          style={{
            width: '100%',
            backgroundColor: '#0EA5E9',
            color: '#ffffff',
            border: 'none',
            borderRadius: '50px',
            padding: '0.85rem 1.5rem',
            fontSize: '0.95rem',
            fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            marginBottom: '1rem',
          }}
        >
          {loading ? 'Cargando...' : isSignUp ? 'Crear cuenta' : 'Ingresar'}
        </button>

        <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {isSignUp ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}{' '}
          <span
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess('') }}
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
          onClick={() => { window.location.href = '/' }}
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