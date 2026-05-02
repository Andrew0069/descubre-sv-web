import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleReset = async () => {
    setError('')
    if (!password || !confirm) { setError('Completá ambos campos.'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    if (password.length < 6) { setError('Mínimo 6 caracteres.'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setError('No se pudo actualizar. Intentá de nuevo.')
    else setSuccess('¡Contraseña actualizada! Podés ingresar ahora.')
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
          Ingresá tu nueva contraseña
        </p>

        <input
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Confirmá la contraseña"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleReset()}
          style={inputStyle}
        />

        {error && <p style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}
        {success && (
          <div>
            <p style={{ color: '#10B981', fontSize: '0.85rem', marginBottom: '1rem' }}>{success}</p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                width: '100%',
                backgroundColor: '#0EA5E9',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50px',
                padding: '0.85rem',
                fontSize: '0.95rem',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              Ir al login
            </button>
          </div>
        )}

        {!success && (
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: '#0EA5E9',
              color: '#ffffff',
              border: 'none',
              borderRadius: '50px',
              padding: '0.85rem',
              fontSize: '0.95rem',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Guardando...' : 'Actualizar contraseña'}
          </button>
        )}
      </div>
    </div>
  )
}
