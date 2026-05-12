import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getUsuarioCompleto } from '../services/usuariosService'

const initialForm = {
  nombre: '',
  ubicacion: '',
  descripcion: '',
  motivo: '',
  nombreContacto: '',
  email: '',
}

const pagePalette = {
  bg: '#fffaf0',
  bgSoft: '#f8e7a6',
  panel: 'rgba(255, 253, 247, 0.92)',
  panelStrong: '#fffdf8',
  border: 'rgba(164, 122, 28, 0.14)',
  text: '#2e241c',
  textSoft: '#6f5a38',
  textMuted: '#9a8359',
  accent: '#f2c94c',
  accentDeep: '#dba90a',
  accentSoft: '#f8e7a6',
  teal: '#7f5c00',
  tealSoft: '#fff3c6',
  successBg: 'rgba(219, 169, 10, 0.12)',
  successBorder: 'rgba(219, 169, 10, 0.24)',
  successText: '#7f5c00',
  errorBg: 'rgba(166, 68, 45, 0.10)',
  errorBorder: 'rgba(166, 68, 45, 0.18)',
  errorText: '#8b3f2d',
}


function PageShell({ children }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: `
          radial-gradient(circle at top left, rgba(242, 201, 76, 0.24), transparent 30%),
          radial-gradient(circle at top right, rgba(242, 201, 76, 0.18), transparent 28%),
          linear-gradient(180deg, ${pagePalette.bg} 0%, ${pagePalette.bgSoft} 100%)
        `,
        padding: 'clamp(1.25rem, 3vw, 2.5rem) 1rem 3rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        .suggest-page {
          position: relative;
          z-index: 1;
          max-width: 1040px;
          margin: 0 auto;
          animation: suggestFadeIn 540ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .suggest-back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: ${pagePalette.textSoft};
          font-size: 0.92rem;
          font-weight: 600;
          text-decoration: none;
          transition: transform 180ms ease, color 180ms ease, opacity 180ms ease;
        }

        .suggest-back-link:hover {
          color: ${pagePalette.text};
          transform: translateX(-2px);
        }

        .suggest-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 1.35rem;
        }

        .suggest-card {
          position: relative;
          overflow: hidden;
          border-radius: 30px;
          border: 1px solid ${pagePalette.border};
          background:
            linear-gradient(145deg, rgba(255, 255, 255, 0.94), rgba(255, 250, 238, 0.98)),
            ${pagePalette.panel};
          box-shadow:
            0 26px 60px rgba(144, 111, 28, 0.11),
            inset 0 1px 0 rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .suggest-card::before {
          content: "";
          position: absolute;
          inset: -1px;
          background:
            radial-gradient(circle at top right, rgba(242, 201, 76, 0.18), transparent 32%),
            radial-gradient(circle at bottom left, rgba(242, 201, 76, 0.08), transparent 34%);
          pointer-events: none;
        }

        .suggest-hero-card {
          padding: clamp(1.5rem, 3vw, 2rem);
        }

        .suggest-form-card {
          padding: clamp(1.4rem, 3vw, 2rem);
        }

        .suggest-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          width: fit-content;
          border-radius: 999px;
          padding: 0.45rem 0.85rem;
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid rgba(164, 122, 28, 0.12);
          color: ${pagePalette.textSoft};
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .suggest-lock-orb,
        .suggest-loading-orb {
          width: 78px;
          height: 78px;
          border-radius: 24px;
          display: grid;
          place-items: center;
          margin-bottom: 1.15rem;
          background:
            linear-gradient(160deg, rgba(242, 201, 76, 0.3), rgba(255, 248, 223, 0.95)),
            rgba(255, 255, 255, 0.82);
          box-shadow:
            0 16px 34px rgba(219, 169, 10, 0.16),
            inset 0 1px 0 rgba(255, 255, 255, 0.65);
          animation: suggestFloat 4.5s ease-in-out infinite;
        }

        .suggest-loading-orb {
          margin: 0 auto 1rem;
        }

        .suggest-spinner {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          border: 3px solid rgba(219, 169, 10, 0.16);
          border-top-color: ${pagePalette.teal};
          animation: suggestSpin 850ms linear infinite;
        }

        .suggest-hero-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 1rem;
          align-items: stretch;
        }

        .suggest-copy {
          position: relative;
          z-index: 1;
        }

        .suggest-title {
          color: ${pagePalette.text};
          font-size: clamp(2.15rem, 4.4vw, 3.4rem);
          line-height: 1.02;
          letter-spacing: -0.06em;
          margin: 0.75rem 0 0.8rem;
          font-weight: 900;
          max-width: 12ch;
        }

        .suggest-title span {
          color: ${pagePalette.accentDeep};
        }

        .suggest-body {
          color: ${pagePalette.textSoft};
          font-size: 0.97rem;
          line-height: 1.7;
          max-width: 42ch;
        }

        .suggest-highlight {
          display: grid;
          gap: 0.8rem;
          margin-top: 1.2rem;
        }

        .suggest-highlight-item {
          display: flex;
          align-items: flex-start;
          gap: 0.8rem;
          padding: 0.95rem 1rem;
          border-radius: 20px;
          background: rgba(255, 249, 232, 0.86);
          border: 1px solid rgba(219, 169, 10, 0.12);
        }

        .suggest-highlight-mark {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          flex: 0 0 34px;
          display: grid;
          place-items: center;
          background: ${pagePalette.accent};
          color: #624500;
          font-size: 0.95rem;
          font-weight: 900;
        }

        .suggest-highlight-copy strong {
          display: block;
          color: ${pagePalette.text};
          font-size: 0.98rem;
          margin-bottom: 0.18rem;
        }

        .suggest-highlight-copy span {
          color: ${pagePalette.textMuted};
          font-size: 0.85rem;
          line-height: 1.5;
        }

        .suggest-login-shell {
          max-width: 620px;
          margin: 0 auto;
        }

        .suggest-login-card {
          text-align: center;
          padding: clamp(1.6rem, 4vw, 2.6rem);
        }

        .suggest-login-card h1,
        .suggest-loading-state h1 {
          color: ${pagePalette.text};
          font-size: clamp(1.8rem, 4vw, 2.5rem);
          line-height: 1.02;
          letter-spacing: -0.05em;
          margin: 0 0 0.9rem;
          font-weight: 900;
        }

        .suggest-login-card p,
        .suggest-loading-state p {
          max-width: 46ch;
          margin: 0 auto;
          color: ${pagePalette.textSoft};
          font-size: 0.98rem;
          line-height: 1.75;
        }

        .suggest-login-actions {
          display: flex;
          justify-content: center;
          gap: 0.85rem;
          margin-top: 1.7rem;
          flex-wrap: wrap;
        }

        .suggest-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.55rem;
          width: 100%;
          border: none;
          border-radius: 999px;
          padding: 0.95rem 1.35rem;
          font-size: 0.95rem;
          font-weight: 800;
          letter-spacing: 0.02em;
          cursor: pointer;
          text-decoration: none;
          transition:
            transform 180ms ease,
            box-shadow 180ms ease,
            background-color 180ms ease,
            color 180ms ease,
            border-color 180ms ease;
        }

        .suggest-button-primary {
          background: linear-gradient(135deg, ${pagePalette.accent} 0%, ${pagePalette.accentDeep} 100%);
          color: #4d3900;
          box-shadow: 0 14px 32px rgba(219, 169, 10, 0.24);
        }

        .suggest-button-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 18px 34px rgba(219, 169, 10, 0.3);
        }

        .suggest-button-primary:disabled {
          cursor: not-allowed;
          background: linear-gradient(135deg, rgba(242, 201, 76, 0.72), rgba(219, 169, 10, 0.62));
          box-shadow: none;
          transform: none;
        }

        .suggest-button-secondary {
          width: auto;
          background: rgba(255, 255, 255, 0.62);
          color: ${pagePalette.text};
          border: 1px solid rgba(164, 122, 28, 0.12);
        }

        .suggest-button-secondary:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.88);
        }

        .suggest-form {
          display: grid;
          gap: 1.4rem;
          position: relative;
          z-index: 1;
        }

        .suggest-form-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 1rem;
        }

        .suggest-section {
          display: grid;
          gap: 1rem;
          padding-top: 0.25rem;
        }

        .suggest-section-header {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding-bottom: 0.35rem;
          border-bottom: 1px solid rgba(219, 169, 10, 0.14);
        }

        .suggest-section-header strong {
          color: ${pagePalette.text};
          font-size: 0.96rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .suggest-section-header span {
          color: ${pagePalette.textMuted};
          font-size: 0.84rem;
          line-height: 1.55;
        }

        .suggest-field {
          display: grid;
          gap: 0.45rem;
        }

        .suggest-field label {
          color: ${pagePalette.text};
          font-size: 0.84rem;
          font-weight: 700;
        }

        .suggest-field label small {
          color: ${pagePalette.textMuted};
          font-size: 0.78rem;
          font-weight: 500;
        }

        .suggest-input,
        .suggest-textarea {
          width: 100%;
          box-sizing: border-box;
          border-radius: 18px;
          border: 1px solid rgba(164, 122, 28, 0.12);
          background: rgba(255, 255, 255, 0.94);
          color: ${pagePalette.text};
          padding: 0.95rem 1rem;
          font-family: inherit;
          font-size: 0.95rem;
          line-height: 1.5;
          outline: none;
          transition:
            border-color 180ms ease,
            box-shadow 180ms ease,
            background-color 180ms ease,
            transform 180ms ease;
        }

        .suggest-input::placeholder,
        .suggest-textarea::placeholder {
          color: #ab9885;
        }

        .suggest-input:hover,
        .suggest-textarea:hover {
          border-color: rgba(219, 169, 10, 0.24);
        }

        .suggest-input:focus,
        .suggest-textarea:focus {
          border-color: rgba(219, 169, 10, 0.5);
          box-shadow:
            0 0 0 4px rgba(242, 201, 76, 0.2),
            0 16px 34px rgba(219, 169, 10, 0.08);
          background: #ffffff;
          transform: translateY(-1px);
        }

        .suggest-textarea {
          resize: vertical;
          min-height: 122px;
        }

        .suggest-alert {
          border-radius: 18px;
          padding: 0.95rem 1rem;
          font-size: 0.9rem;
          line-height: 1.65;
          animation: suggestFadeIn 240ms ease;
        }

        .suggest-alert-error {
          background: ${pagePalette.errorBg};
          border: 1px solid ${pagePalette.errorBorder};
          color: ${pagePalette.errorText};
        }

        .suggest-alert-success {
          background: ${pagePalette.successBg};
          border: 1px solid ${pagePalette.successBorder};
          color: ${pagePalette.successText};
          font-weight: 700;
        }

        .suggest-footer {
          text-align: center;
          color: ${pagePalette.textMuted};
          font-size: 0.78rem;
          margin-top: 1.35rem;
        }

        .suggest-loading-state {
          max-width: 480px;
          margin: 18vh auto 0;
          text-align: center;
          padding: 2rem 1.2rem;
        }

        .suggest-loading-state .suggest-pill {
          margin: 0 auto 1rem;
        }

        @keyframes suggestFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes suggestFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes suggestSpin {
          to { transform: rotate(360deg); }
        }

        @media (min-width: 900px) {
          .suggest-grid {
            grid-template-columns: minmax(280px, 0.78fr) minmax(0, 1.22fr);
          }

          .suggest-hero-layout {
            grid-template-columns: minmax(0, 1fr);
          }

          .suggest-form-grid.two-up {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .suggest-card {
            border-radius: 24px;
          }

          .suggest-login-actions {
            flex-direction: column;
          }

          .suggest-button-secondary {
            width: 100%;
          }
        }
      `}</style>

      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '-110px',
          left: '-80px',
          width: '240px',
          height: '240px',
          borderRadius: '999px',
          background: 'radial-gradient(circle, rgba(242, 201, 76, 0.24), transparent 68%)',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: '-90px',
          top: '10%',
          width: '280px',
          height: '280px',
          borderRadius: '999px',
          background: 'radial-gradient(circle, rgba(242, 201, 76, 0.18), transparent 70%)',
        }}
      />

      {children}
    </div>
  )
}

export default function SugerirLugar() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [session, setSession] = useState(null)
  const [accountProfile, setAccountProfile] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const currentSession = data.session ?? null
      setSession(currentSession)

      if (!currentSession) {
        navigate('/login', { replace: true })
        return
      }

      if (currentSession?.user?.id) {
        const profile = await getUsuarioCompleto(currentSession.user.id)
        const accountEmail = currentSession.user.email || profile?.email || ''
        setAccountProfile(profile)
        setForm((prev) => ({
          ...prev,
          nombreContacto: prev.nombreContacto || profile?.nombre || '',
          email: accountEmail,
        }))
      }

      setSessionLoading(false)
    })
  }, [navigate])

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
    const nombreContacto = form.nombreContacto.trim()
    const accountEmail = session?.user?.email || accountProfile?.email || ''

    if (!nombre) {
      setError('El nombre del lugar es obligatorio.')
      return
    }

    if (!nombreContacto) {
      setError('Tu nombre es obligatorio.')
      return
    }

    if (!accountEmail) {
      setError('No pudimos obtener el correo registrado en tu cuenta.')
      return
    }

    setLoading(true)

    const userProfile = accountProfile || (session?.user?.id ? await getUsuarioCompleto(session.user.id) : null)
    const usuarioId = userProfile?.id ?? null

    const payload = {
      nombre,
      ubicacion: form.ubicacion.trim() || null,
      descripcion: form.descripcion.trim() || null,
      motivo_recomendacion: form.motivo.trim() || null,
      nombre_contacto: nombreContacto,
      email: accountEmail,
      usuario_id: usuarioId,
      estado: 'pendiente',
    }

    const { error: insertError } = await supabase.from('sugerencias').insert(payload)

    setLoading(false)

    if (insertError) {
      console.error('[SugerirLugar] insert error:', insertError)
      setError('Ocurrio un error inesperado. Intenta de nuevo.')
      return
    }

    setSuccess(true)
    setForm({
      ...initialForm,
      nombreContacto,
      email: accountEmail,
    })
  }

  if (sessionLoading) {
    return (
      <PageShell>
        <div className="suggest-loading-state">
          <div className="suggest-pill">Spotter</div>
          <div className="suggest-loading-orb">
            <div className="suggest-spinner" />
          </div>
          <h1>Preparando tu acceso</h1>
          <p>Estamos verificando tu sesion para mostrarte la experiencia correcta sin alterar el flujo actual.</p>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="suggest-page">
        <div style={{ marginBottom: '1.15rem' }}>
          <Link to="/" className="suggest-back-link">
            <span aria-hidden>&larr;</span>
            <span>Volver al inicio</span>
          </Link>
        </div>

        <div className="suggest-grid">
          <section className="suggest-card suggest-hero-card">
            <div className="suggest-hero-layout">
              <div className="suggest-copy">
                <div className="suggest-pill">Tu sugerencia importa</div>
                <h1 className="suggest-title">
                  Lo que encontraste <span>puede cambiar la guia</span>
                </h1>
                <p className="suggest-body">
                  Danos los datos clave. Nosotros hacemos el resto para revisar, validar y darle visibilidad a ese lugar que vale la pena descubrir.
                </p>

                <div className="suggest-highlight">
                  <div className="suggest-highlight-item">
                    <div className="suggest-highlight-mark">1</div>
                    <div className="suggest-highlight-copy">
                      <strong>Se claro</strong>
                      <span>Nombre y ubicacion aceleran la revision.</span>
                    </div>
                  </div>
                  <div className="suggest-highlight-item">
                    <div className="suggest-highlight-mark">2</div>
                    <div className="suggest-highlight-copy">
                      <strong>Conta por que importa</strong>
                      <span>Tu criterio es lo que le da valor a la sugerencia.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="suggest-card suggest-form-card">
            <form onSubmit={handleSubmit} className="suggest-form">
              <div className="suggest-section">
                <div className="suggest-section-header">
                  <strong>Datos del lugar</strong>
                  <span>Lo esencial para revisar y ubicar la recomendacion.</span>
                </div>

                <div className="suggest-form-grid">
                  <div className="suggest-field">
                    <label htmlFor="sug-nombre">
                      Nombre del lugar <span style={{ color: pagePalette.accentDeep }}>*</span>
                    </label>
                    <input
                      id="sug-nombre"
                      type="text"
                      value={form.nombre}
                      onChange={handleChange('nombre')}
                      autoComplete="off"
                      placeholder="Ej. Mirador de la Puerta del Diablo"
                      className="suggest-input"
                    />
                  </div>

                  <div className="suggest-field">
                    <label htmlFor="sug-ubicacion">Departamento o ubicacion</label>
                    <input
                      id="sug-ubicacion"
                      type="text"
                      value={form.ubicacion}
                      onChange={handleChange('ubicacion')}
                      autoComplete="off"
                      placeholder="Ciudad, municipio, ruta o punto de referencia"
                      className="suggest-input"
                    />
                  </div>
                </div>

                <div className="suggest-field">
                  <label htmlFor="sug-desc">Descripcion del lugar</label>
                  <textarea
                    id="sug-desc"
                    value={form.descripcion}
                    onChange={handleChange('descripcion')}
                    rows={4}
                    placeholder="Que es, que se puede hacer ahi y que tipo de experiencia ofrece."
                    className="suggest-textarea"
                  />
                </div>

                <div className="suggest-field">
                  <label htmlFor="sug-motivo">Por que lo recomendas</label>
                  <textarea
                    id="sug-motivo"
                    value={form.motivo}
                    onChange={handleChange('motivo')}
                    rows={4}
                    placeholder="Contanos que lo hace especial o por que deberia estar en la plataforma."
                    className="suggest-textarea"
                  />
                </div>
              </div>

              <div className="suggest-section">
                <div className="suggest-section-header">
                  <strong>Datos de contacto</strong>
                  <span>Usaremos estos datos si necesitamos confirmar algun detalle de la sugerencia.</span>
                </div>

                <div className="suggest-form-grid two-up">
                  <div className="suggest-field">
                    <label htmlFor="sug-nombre-contacto">
                      Tu nombre <span style={{ color: pagePalette.accentDeep }}>*</span>
                    </label>
                    <input
                      id="sug-nombre-contacto"
                      type="text"
                      value={form.nombreContacto}
                      onChange={handleChange('nombreContacto')}
                      autoComplete="name"
                      placeholder="Como te gustaria que te llamemos"
                      className="suggest-input"
                    />
                  </div>

                  <div className="suggest-field">
                    <label htmlFor="sug-email">
                      Tu email <span style={{ color: pagePalette.accentDeep }}>*</span>
                    </label>
                    <input
                      id="sug-email"
                      type="email"
                      value={session?.user?.email || accountProfile?.email || form.email}
                      readOnly
                      autoComplete="email"
                      placeholder="Correo registrado en tu cuenta"
                      className="suggest-input"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <p role="alert" className="suggest-alert suggest-alert-error">
                  {error}
                </p>
              )}

              {success && (
                <p role="status" className="suggest-alert suggest-alert-success">
                  Gracias por tu sugerencia. La revisaremos pronto.
                </p>
              )}

              <button type="submit" disabled={loading} className="suggest-button suggest-button-primary">
                {loading ? 'Enviando...' : 'Enviar sugerencia'}
              </button>
            </form>
          </section>
        </div>

        <p className="suggest-footer">© 2026 Spotter · Tu guia local, siempre.</p>
      </div>
    </PageShell>
  )
}
