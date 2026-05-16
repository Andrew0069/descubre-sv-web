import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function PrivacyPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#ffffff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
        <div style={{ marginBottom: '2rem' }}>
          <Link to="/" style={{ color: '#0EA5E9', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
            ← Volver al inicio
          </Link>
        </div>
        
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>POLÍTICA DE PRIVACIDAD — SPOTTER</h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '2rem' }}>Última actualización: Mayo 2026</p>

        <div style={{ color: '#374151', fontSize: '1rem', lineHeight: 1.7 }}>
          <p style={{ marginBottom: '1.5rem' }}>
            Spotter es una plataforma comunitaria diseñada para conectar a visitantes, viajeros y salvadoreños con los lugares, experiencias y rincones que hacen único a El Salvador. Valoramos profundamente la confianza de nuestra comunidad, por lo que nos comprometemos a proteger su privacidad con total transparencia.
          </p>
          <p style={{ marginBottom: '2rem' }}>
            Esta Política de Privacidad explica qué información recopilamos, cómo la usamos y, sobre todo, lo que nunca haremos con ella.
          </p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginTop: '2rem', marginBottom: '1rem' }}>1. INFORMACIÓN QUE RECOPILAMOS</h2>
          <ul style={{ marginBottom: '1.5rem', paddingLeft: '1.5rem', listStyleType: 'disc' }}>
            <li style={{ marginBottom: '0.5rem' }}><strong>Información de registro:</strong> nombre y correo electrónico al crear una cuenta.</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>Datos de uso:</strong> páginas visitadas, búsquedas y contenido con el que interactúas.</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>Información técnica:</strong> tipo de dispositivo, navegador e IP aproximada, con fines de seguridad.</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>Ubicación precisa:</strong> únicamente si das permiso explícito desde tu navegador, para reforzar la seguridad de tu cuenta.</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>Contenido generado por el usuario:</strong> comentarios y reseñas publicados voluntariamente.</li>
          </ul>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginTop: '2rem', marginBottom: '1rem' }}>2. CÓMO USAMOS TU INFORMACIÓN</h2>
          <ul style={{ marginBottom: '1.5rem', paddingLeft: '1.5rem', listStyleType: 'disc' }}>
            <li style={{ marginBottom: '0.5rem' }}>Operar y mejorar la experiencia en la plataforma.</li>
            <li style={{ marginBottom: '0.5rem' }}>Personalizar el contenido según tus interacciones.</li>
            <li style={{ marginBottom: '0.5rem' }}>Garantizar la seguridad y prevenir usos indebidos.</li>
            <li style={{ marginBottom: '0.5rem' }}>Comunicarte actualizaciones del servicio, si así lo has autorizado.</li>
          </ul>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginTop: '2rem', marginBottom: '1rem' }}>3. LO QUE NUNCA HAREMOS CON TUS DATOS</h2>
          <p style={{ marginBottom: '1rem' }}>Nos comprometemos de forma irrevocable a:</p>
          <ul style={{ marginBottom: '1.5rem', paddingLeft: '1.5rem', listStyleType: 'disc' }}>
            <li style={{ marginBottom: '0.5rem' }}><strong>NUNCA</strong> vender tu información personal a terceros, bajo ningún concepto.</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>NUNCA</strong> compartir tus datos con empresas de publicidad o redes de marketing.</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>NUNCA</strong> ceder tu información a organismos gubernamentales salvo requerimiento legal expreso.</li>
            <li style={{ marginBottom: '0.5rem' }}><strong>NUNCA</strong> utilizarte para perfilarte comercialmente fuera del contexto de la plataforma.</li>
          </ul>
          <p style={{ marginBottom: '2rem', fontWeight: 600 }}>Tus datos son tuyos. Están aquí porque confías en nosotros, y esa confianza no tiene precio.</p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginTop: '2rem', marginBottom: '1rem' }}>4. SERVICIOS DE TERCEROS</h2>
          <p style={{ marginBottom: '1.5rem' }}>Utilizamos proveedores de infraestructura técnica (base de datos, hospedaje) que actúan únicamente como procesadores bajo nuestras instrucciones y no acceden a tus datos para propósitos propios.</p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginTop: '2rem', marginBottom: '1rem' }}>5. COOKIES</h2>
          <p style={{ marginBottom: '1.5rem' }}>Usamos cookies de sesión, caché local y almacenamiento técnico para mantener tu acceso activo y mejorar el rendimiento. No usamos cookies publicitarias ni de terceros con fines de marketing. Este consentimiento es independiente del permiso de ubicación del navegador.</p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginTop: '2rem', marginBottom: '1rem' }}>6. SEGURIDAD</h2>
          <p style={{ marginBottom: '1.5rem' }}>Implementamos medidas técnicas razonables para proteger tu información. Al iniciar sesión podemos registrar IP aproximada, navegador, dispositivo y, solo con tu permiso, ubicación precisa para detectar accesos sospechosos. En caso de incidente relevante, te notificaremos oportunamente.</p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginTop: '2rem', marginBottom: '1rem' }}>7. MENORES DE EDAD</h2>
          <p style={{ marginBottom: '1.5rem' }}>No recopilamos datos de menores de 13 años. Si eres tutor y crees que tu hijo proporcionó datos, contáctanos para eliminarlos de inmediato.</p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginTop: '2rem', marginBottom: '1rem' }}>8. TUS DERECHOS</h2>
          <p style={{ marginBottom: '1.5rem' }}>Puedes acceder, corregir, eliminar tus datos o retirar tu consentimiento en cualquier momento escribiendo a: <strong>contacto@spotter.sv</strong></p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginTop: '2rem', marginBottom: '1rem' }}>9. CAMBIOS A ESTA POLÍTICA</h2>
          <p style={{ marginBottom: '1.5rem' }}>Cambios significativos serán notificados por la plataforma o correo electrónico.</p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginTop: '2rem', marginBottom: '1rem' }}>10. CONTACTO</h2>
          <p style={{ marginBottom: '1.5rem' }}>Spotter — contacto@spotter.com — El Salvador, Centroamérica</p>
        </div>
      </div>
    </div>
  )
}
