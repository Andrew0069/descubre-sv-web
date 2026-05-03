import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function TermsPage() {
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
        
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>TÉRMINOS Y CONDICIONES DE USO — SPOTTER</h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '2rem' }}>Última actualización: Mayo 2026</p>

        <div style={{ color: '#374151', fontSize: '1rem', lineHeight: 1.7 }}>
          <p style={{ marginBottom: '2rem' }}>
            Al acceder o utilizar Spotter, aceptas estos Términos y Condiciones. Los construimos para proteger a todos los que forman parte de esta comunidad.
          </p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginTop: '2rem', marginBottom: '1rem' }}>1. QUÉ ES SPOTTER</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            Spotter es una plataforma digital que conecta usuarios con lugares, experiencias y recomendaciones turísticas y culturales de El Salvador. La información publicada tiene carácter referencial. El usuario asume la responsabilidad de verificarla antes de planificar su visita.
          </p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginTop: '2rem', marginBottom: '1rem' }}>2. REGISTRO Y USO DE LA CUENTA</h2>
          <p style={{ marginBottom: '1rem' }}>Al crear una cuenta te comprometes a:</p>
          <ul style={{ marginBottom: '1.5rem', paddingLeft: '1.5rem', listStyleType: 'disc' }}>
            <li style={{ marginBottom: '0.5rem' }}>Proporcionar información veraz y mantenerla actualizada.</li>
            <li style={{ marginBottom: '0.5rem' }}>Mantener la confidencialidad de tus credenciales.</li>
            <li style={{ marginBottom: '0.5rem' }}>No compartir tu cuenta con terceros.</li>
            <li style={{ marginBottom: '0.5rem' }}>Notificar de inmediato cualquier acceso no autorizado.</li>
          </ul>
          <p style={{ marginBottom: '1.5rem' }}>Spotter puede suspender o eliminar cuentas que incumplan estos términos.</p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginTop: '2rem', marginBottom: '1rem' }}>3. USO ACEPTABLE</h2>
          <p style={{ marginBottom: '1rem' }}>La plataforma es para uso personal y lícito. Queda estrictamente prohibido:</p>
          <ul style={{ marginBottom: '1.5rem', paddingLeft: '1.5rem', listStyleType: 'disc' }}>
            <li style={{ marginBottom: '0.5rem' }}>Publicar contenido ofensivo, amenazante o que incite al odio.</li>
            <li style={{ marginBottom: '0.5rem' }}>Ejercer cualquier forma de acoso o bullying hacia otros usuarios.</li>
            <li style={{ marginBottom: '0.5rem' }}>Realizar o promover discriminación racial, étnica, religiosa, por género, orientación sexual, nacionalidad, condición socioeconómica o cualquier otra característica personal.</li>
            <li style={{ marginBottom: '0.5rem' }}>Usar lenguaje soez, insultos o expresiones hostiles de forma reiterada con intención de dañar.</li>
            <li style={{ marginBottom: '0.5rem' }}>Difundir contenido falso o engañoso sobre lugares, personas o eventos.</li>
            <li style={{ marginBottom: '0.5rem' }}>Usar la plataforma con fines comerciales o para extracción masiva de datos sin autorización.</li>
            <li style={{ marginBottom: '0.5rem' }}>Intentar interferir con los sistemas técnicos de la plataforma.</li>
          </ul>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginTop: '2rem', marginBottom: '1rem' }}>4. CÓDIGO DE CONDUCTA COMUNITARIA</h2>
          <p style={{ marginBottom: '1rem' }}>Spotter nació para la comunidad y así seguirá siendo. No toleramos conductas que dañen, excluyan o intimiden a otros usuarios.</p>
          <p style={{ marginBottom: '1rem' }}>Ante cualquier violación, podremos aplicar según la gravedad:</p>
          <ul style={{ marginBottom: '1.5rem', paddingLeft: '1.5rem', listStyleType: 'disc' }}>
            <li style={{ marginBottom: '0.5rem' }}>Eliminación del contenido infractor.</li>
            <li style={{ marginBottom: '0.5rem' }}>Advertencia formal al usuario.</li>
            <li style={{ marginBottom: '0.5rem' }}>Suspensión temporal de la cuenta.</li>
            <li style={{ marginBottom: '0.5rem' }}>Eliminación permanente de la cuenta sin posibilidad de recuperación.</li>
          </ul>
          <p style={{ marginBottom: '1.5rem' }}>Las decisiones de moderación son facultad de Spotter y pueden tomarse sin previo aviso cuando la situación lo requiera. Creemos en segundas oportunidades, pero no en la impunidad.</p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginTop: '2rem', marginBottom: '1rem' }}>5. CONTENIDO GENERADO POR USUARIOS</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            Al publicar contenido declaras que es veraz, no infringe derechos de terceros y cumple el Código de Conducta. Conservas la propiedad de tu contenido, pero otorgas a Spotter licencia para mostrarlo y moderarlo dentro de la plataforma.
          </p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginTop: '2rem', marginBottom: '1rem' }}>6. PROPIEDAD INTELECTUAL</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            Todo el contenido, diseño, marca y código de Spotter son propiedad exclusiva de sus creadores. Queda prohibida su reproducción o uso comercial sin autorización expresa.
          </p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginTop: '2rem', marginBottom: '1rem' }}>7. LIMITACIÓN DE RESPONSABILIDAD</h2>
          <p style={{ marginBottom: '1rem' }}>Spotter no se responsabiliza por:</p>
          <ul style={{ marginBottom: '1.5rem', paddingLeft: '1.5rem', listStyleType: 'disc' }}>
            <li style={{ marginBottom: '0.5rem' }}>Experiencias negativas derivadas de visitar lugares listados en la plataforma.</li>
            <li style={{ marginBottom: '0.5rem' }}>Inexactitudes en horarios, precios o disponibilidad de lugares.</li>
            <li style={{ marginBottom: '0.5rem' }}>Daños derivados del uso o imposibilidad de uso de la plataforma.</li>
            <li style={{ marginBottom: '0.5rem' }}>Contenido publicado por usuarios que no refleje los valores de la plataforma.</li>
          </ul>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginTop: '2rem', marginBottom: '1rem' }}>8. MODIFICACIONES AL SERVICIO</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            Podemos modificar, ampliar o descontinuar funcionalidades en cualquier momento. Los cambios significativos en estos Términos serán notificados. El uso continuado implica aceptación.
          </p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginTop: '2rem', marginBottom: '1rem' }}>9. LEY APLICABLE</h2>
          <p style={{ marginBottom: '1.5rem' }}>Estos Términos se rigen por las leyes de la República de El Salvador.</p>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginTop: '2rem', marginBottom: '1rem' }}>10. CONTACTO</h2>
          <p style={{ marginBottom: '1.5rem' }}>Spotter — contacto@spotter.com — El Salvador, Centroamérica</p>
        </div>
      </div>
    </div>
  )
}
