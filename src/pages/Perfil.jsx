import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Perfil() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [nombre, setNombre] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      if (!data.session) { navigate('/login'); return }
      setSession(data.session)
    })
    return () => { cancelled = true }
  }, [navigate])

  useEffect(() => {
    if (!session) return
    const cargarPerfil = async () => {
      const { data } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', session.user.id)
        .maybeSingle()
      if (data) {
        setPerfil(data)
        setNombre(data.nombre || '')
        setBio(data.bio || '')
        setAvatarUrl(data.foto_perfil || '')
      }
      setLoading(false)
    }
    cargarPerfil()
  }, [session])

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  const handleAvatar = (e) => {
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const MAX_SIZE_MB = 5
    const file = e.target.files[0]
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Solo se permiten imágenes en formato JPG, PNG, WEBP o GIF.')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`La imagen no puede superar ${MAX_SIZE_MB}MB.`)
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleGuardar = async () => {
    setError('')
    setSuccess('')
    if (!nombre.trim()) { setError('El nombre de usuario es obligatorio.'); return }
    if (nombre.trim().length < 3) { setError('El nombre debe tener al menos 3 caracteres.'); return }
    if (bio.length > 200) { setError('La descripción no puede superar 200 caracteres.'); return }

    setSaving(true)

    let nuevaFotoUrl = avatarUrl

    if (avatarFile) {
      const mimeMap = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }
      const ext = mimeMap[avatarFile.type] ?? 'jpg'
      const path = `${session.user.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatares')
        .upload(path, avatarFile, { upsert: true })
      if (uploadError) {
        console.error('[Perfil] avatar upload error:', uploadError)
        setError('Ocurrió un error al subir la foto. Intentá de nuevo.')
        setSaving(false)
        return
      }
      const { data: urlData } = supabase.storage.from('avatares').getPublicUrl(path)
      nuevaFotoUrl = urlData.publicUrl
    }

    const { error: updateError } = await supabase
      .from('usuarios')
      .update({
        nombre: nombre.trim(),
        bio: bio.trim(),
        foto_perfil: nuevaFotoUrl,
      })
      .eq('auth_id', session.user.id)

    if (updateError) {
      console.error('[Perfil] update error:', updateError)
      setError('Ocurrió un error al guardar el perfil. Intentá de nuevo.')
      setSaving(false)
      return
    }

    setAvatarUrl(nuevaFotoUrl)
    setAvatarFile(null)
    setSuccess('¡Perfil actualizado!')
    setSaving(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#9ca3af' }}>Cargando perfil...</p>
      </div>
    )
  }

  const fotoMostrar = avatarPreview || avatarUrl
  const inicial = (nombre || 'U').charAt(0).toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button type="button" onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '0.9rem' }}>
            ← Volver
          </button>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: 0 }}>
            Mi perfil
          </h1>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>

          {/* Avatar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
            <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
              {fotoMostrar ? (
                <img src={fotoMostrar} alt="avatar"
                  style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #e5e7eb' }} />
              ) : (
                <div style={{
                  width: '96px', height: '96px', borderRadius: '50%',
                  backgroundColor: '#0EA5E9', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', fontWeight: 700, border: '3px solid #e5e7eb',
                }}>
                  {inicial}
                </div>
              )}
              <label style={{
                position: 'absolute', bottom: 0, right: 0,
                backgroundColor: '#0EA5E9', color: '#fff',
                borderRadius: '50%', width: '28px', height: '28px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: '0.8rem', border: '2px solid #fff',
              }}>
                📷
                <input type="file" accept="image/*" onChange={handleAvatar} style={{ display: 'none' }} />
              </label>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: 0 }}>Tocá el ícono para cambiar tu foto</p>
          </div>

          {/* Nombre */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
              Nombre de usuario
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value.slice(0, 30))}
              placeholder="Tu nombre público"
              style={{
                width: '100%', padding: '0.8rem 1rem', borderRadius: '10px',
                border: '1.5px solid #e5e7eb', fontSize: '0.95rem',
                color: '#111827', outline: 'none', boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.3rem 0 0' }}>
              {nombre.length}/30 · Este es el nombre que verán otros usuarios
            </p>
          </div>

          {/* Bio */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.4rem' }}>
              Descripción <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 200))}
              placeholder="Contá algo sobre vos..."
              rows={3}
              style={{
                width: '100%', padding: '0.8rem 1rem', borderRadius: '10px',
                border: '1.5px solid #e5e7eb', fontSize: '0.92rem',
                color: '#111827', outline: 'none', resize: 'none',
                boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6,
              }}
            />
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.3rem 0 0', textAlign: 'right' }}>
              {bio.length}/200
            </p>
          </div>

          {error && <p style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}
          {success && <p style={{ color: '#10B981', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{success}</p>}

          <button type="button" onClick={handleGuardar} disabled={saving}
            style={{
              width: '100%', backgroundColor: '#0EA5E9', color: '#fff',
              border: 'none', borderRadius: '50px', padding: '0.85rem',
              fontSize: '0.95rem', fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
