import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const initialForm = {
  nombre: '',
  ubicacion: '',
  descripcion: '',
  motivo: '',
  nombreContacto: '',
  email: '',
}

export default function SugerirLugar() {
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [session, setSession] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null)
      setSessionLoading(false)
    })
  }, [])

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setError('')
    setSuccess(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    const nombre = form.nombre.trim()
    if (!nombre) {
      setError('El nombre del lugar es obligatorio.')
      return
    }

    setLoading(true)

    const payload = {
      nombre,
      ubicacion: form.ubicacion.trim() || null,
      descripcion: form.descripcion.trim() || null,
      motivo_recomendacion: form.motivo.trim() || null,
      nombre_contacto: form.nombreContacto.trim() || null,
      email: form.email.trim() || null,
    }

    const { error: insertError } = await supabase.from('sugerencias').insert(payload)

    setLoading(false)

    if (insertError) {
      console.error('[SugerirLugar] insert error:', insertError)
      setError('Ocurrió un error inesperado. Intentá de nuevo.')
      return
    }

    setSuccess(true)
    setForm(initialForm)
  }

  if (sessionLoading) return null

  if (!session) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #0f172a 0%, #020617 50%, #0f172a 100%)',
          padding: '2rem 1rem 3rem',
        }}
      >
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: '#94a3b8',
                fontSize: '0.9rem',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              ← Volver al inicio
            </Link>
          </div>

          <div
            style={{
              borderRadius: '16px',
              padding: '2.5rem 1.75rem',
              backgroundColor: 'rgba(30, 41, 59, 0.55)',
              border: '1px solid rgba(148, 163, 184, 0.15)',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.35)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔒</div>
            <h1
              style={{
                fontSize: '1.3rem',
                fontWeight: 800,
                color: '#f8fafc',
                marginBottom: '0.6rem',
                lineHeight: 1.2,
              }}
            >
              Iniciá sesión para continuar
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
              Necesitás una cuenta para sugerir un nuevo lugar en{' '}
              <span style={{ fontWeight: 700 }}><span style={{ color: '#F5A623' }}>S</span>potter</span>.
            </p>
            <Link
              to="/login"
              style={{
                display: 'inline-block',
                backgroundColor: '#0EA5E9',
                color: '#ffffff',
                borderRadius: '50px',
                padding: '0.75rem 2rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 8px 24px rgba(14, 165, 233, 0.25)',
              }}
            >
              Ir al login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const inputBase = {
    width: '100%',
    padding: '0.8rem 1rem',
    borderRadius: '10px',
    border: '1px solid rgba(148, 163, 184, 0.25)',
    fontSize: '0.95rem',
    color: '#f1f5f9',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s ease',
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0f172a 0%, #020617 50%, #0f172a 100%)',
        padding: '2rem 1rem 3rem',
      }}
    >
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.75rem' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: '#94a3b8',
              fontSize: '0.9rem',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            ← Volver al inicio
          </Link>
        </div>

        <div
          style={{
            borderRadius: '16px',
            padding: '2rem 1.75rem',
            backgroundColor: 'rgba(30, 41, 59, 0.55)',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.35)',
          }}
        >
          <h1
            style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              color: '#f8fafc',
              letterSpacing: '-0.02em',
              marginBottom: '0.35rem',
              lineHeight: 1.2,
            }}
          >
            Sugerir un lugar
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
            ¿Conocés un rincón que debería estar en{' '}
            <span style={{ fontWeight: 700 }}><span style={{ color: '#F5A623' }}>S</span>potter</span>? Contanos.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.1rem' }}>
              <label
                htmlFor="sug-nombre"
                style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}
              >
                Nombre del lugar <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input
                id="sug-nombre"
                type="text"
                value={form.nombre}
                onChange={handleChange('nombre')}
                autoComplete="off"
                placeholder="Ej. Mirador de la Puerta del Diablo"
                style={inputBase}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(14, 165, 233, 0.65)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(148, 163, 184, 0.25)'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.1rem' }}>
              <label htmlFor="sug-ubicacion" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Departamento / ubicación
              </label>
              <input
                id="sug-ubicacion"
                type="text"
                value={form.ubicacion}
                onChange={handleChange('ubicacion')}
                autoComplete="off"
                placeholder="Texto libre (ciudad, municipio, ruta…)"
                style={inputBase}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(14, 165, 233, 0.65)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(148, 163, 184, 0.25)'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.1rem' }}>
              <label htmlFor="sug-desc" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Descripción del lugar
              </label>
              <textarea
                id="sug-desc"
                value={form.descripcion}
                onChange={handleChange('descripcion')}
                rows={4}
                placeholder="¿Qué es? ¿Qué se puede hacer ahí?"
                style={{
                  ...inputBase,
                  resize: 'vertical',
                  minHeight: '100px',
                  lineHeight: 1.55,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(14, 165, 233, 0.65)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(148, 163, 184, 0.25)'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.1rem' }}>
              <label htmlFor="sug-motivo" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                ¿Por qué lo recomendás?
              </label>
              <textarea
                id="sug-motivo"
                value={form.motivo}
                onChange={handleChange('motivo')}
                rows={4}
                placeholder="Contanos por qué vale la pena incluirlo."
                style={{
                  ...inputBase,
                  resize: 'vertical',
                  minHeight: '100px',
                  lineHeight: 1.55,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(14, 165, 233, 0.65)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(148, 163, 184, 0.25)'
                }}
              />
            </div>

            <div style={{ height: '1px', background: 'rgba(148, 163, 184, 0.12)', margin: '1.35rem 0 1.15rem' }} />

            <div style={{ marginBottom: '1.1rem' }}>
              <label htmlFor="sug-nombre-contacto" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Tu nombre <span style={{ fontWeight: 400, color: '#64748b' }}>(opcional)</span>
              </label>
              <input
                id="sug-nombre-contacto"
                type="text"
                value={form.nombreContacto}
                onChange={handleChange('nombreContacto')}
                autoComplete="name"
                placeholder="Cómo te gustaría que te llamemos"
                style={inputBase}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(14, 165, 233, 0.65)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(148, 163, 184, 0.25)'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.35rem' }}>
              <label htmlFor="sug-email" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Tu email <span style={{ fontWeight: 400, color: '#64748b' }}>(opcional)</span>
              </label>
              <input
                id="sug-email"
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                autoComplete="email"
                placeholder="Por si queremos hacerte una consulta"
                style={inputBase}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(14, 165, 233, 0.65)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(148, 163, 184, 0.25)'
                }}
              />
            </div>

            {error && (
              <p
                role="alert"
                style={{
                  color: '#fca5a5',
                  fontSize: '0.88rem',
                  marginBottom: '1rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(248, 113, 113, 0.25)',
                }}
              >
                {error}
              </p>
            )}

            {success && (
              <p
                role="status"
                style={{
                  color: '#6ee7b7',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                  padding: '0.75rem 0.9rem',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(52, 211, 153, 0.28)',
                }}
              >
                ¡Gracias por tu sugerencia! La revisaremos pronto.
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: loading ? 'rgba(14, 165, 233, 0.65)' : '#0EA5E9',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50px',
                padding: '0.9rem 1.5rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.02em',
                boxShadow: '0 8px 24px rgba(14, 165, 233, 0.25)',
              }}
            >
              {loading ? 'Enviando…' : 'Enviar sugerencia'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.78rem', marginTop: '1.5rem' }}>
          © 2026 Spotter · Hecho en El Salvador 🇸🇻
        </p>
      </div>
    </div>
  )
}
