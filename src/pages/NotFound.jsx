import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f9fafb',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.25rem',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <p style={{ fontSize: '4rem', margin: 0 }}>🗺️</p>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: 0 }}>
        Página no encontrada
      </h1>
      <p style={{ color: '#6b7280', fontSize: '0.95rem', margin: 0 }}>
        La ruta que buscás no existe.
      </p>
      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '0.65rem 1.75rem',
          borderRadius: '50px',
          backgroundColor: '#0EA5E9',
          color: '#fff',
          fontSize: '0.9rem',
          fontWeight: 700,
          textDecoration: 'none',
        }}
      >
        ← Volver al inicio
      </Link>
    </div>
  )
}
