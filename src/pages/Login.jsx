import { Link } from 'react-router-dom'

export default function Login() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem' }}>
      <p style={{ color: '#6b7280' }}>Iniciar sesión — próximamente</p>
      <Link to="/" style={{ color: '#0EA5E9', fontWeight: 600 }}>Volver al inicio</Link>
    </div>
  )
}
