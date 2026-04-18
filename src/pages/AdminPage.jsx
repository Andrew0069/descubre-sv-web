import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { resolveImageUrl } from '../lib/imageUrl'
import EditLugarForm from '../components/EditLugarForm'

export default function AdminPage() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [lugares, setLugares] = useState([])
  const [lugarSeleccionado, setLugarSeleccionado] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio_entrada: '',
    subtipo: 'Hotel',
    destacado: false,
  })
  const [imagenes, setImagenes] = useState([])
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState(null)
  const fileRef = useRef(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // Guard: verificar is_admin
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { navigate('/'); return }
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('is_admin')
        .eq('auth_id', session.user.id)
        .maybeSingle()
      if (!usuario?.is_admin) { navigate('/'); return }
      setChecking(false)
    }
    check()
  }, [navigate])

  // Cargar lugares
  useEffect(() => {
    if (checking) return
    supabase
      .from('lugares')
      .select(`
        id,
        nombre,
        descripcion,
        precio_entrada,
        subtipo,
        destacado,
        imagen_principal
      `)
      .order('nombre', { ascending: true })
      .then(({ data }) => setLugares(data ?? []))
  }, [checking])

  // Cargar imágenes del lugar seleccionado
  const cargarImagenes = useCallback(async (lugarId) => {
    const { data } = await supabase
      .from('imagenes_lugar')
      .select(`
        id,
        lugar_id,
        ruta_imagen
      `)
      .eq('lugar_id', lugarId)
      .order('id', { ascending: true })
    setImagenes(data ?? [])
  }, [])

  const handleSeleccionarLugar = (lugar) => {
    setLugarSeleccionado(lugar)
    cargarImagenes(lugar.id)
  }

  useEffect(() => {
    if (!lugarSeleccionado) {
      setFormData({
        nombre: '',
        descripcion: '',
        precio_entrada: '',
        subtipo: 'Hotel',
        destacado: false,
      })
      return
    }

    setFormData({
      nombre: lugarSeleccionado.nombre ?? '',
      descripcion: lugarSeleccionado.descripcion ?? '',
      precio_entrada: lugarSeleccionado.precio_entrada ?? '',
      subtipo: lugarSeleccionado.subtipo ?? 'Hotel',
      destacado: lugarSeleccionado.destacado ?? false,
    })
  }, [lugarSeleccionado])

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCancelarEdicion = () => {
    if (!lugarSeleccionado) return
    setFormData({
      nombre: lugarSeleccionado.nombre ?? '',
      descripcion: lugarSeleccionado.descripcion ?? '',
      precio_entrada: lugarSeleccionado.precio_entrada ?? '',
      subtipo: lugarSeleccionado.subtipo ?? 'Hotel',
      destacado: lugarSeleccionado.destacado ?? false,
    })
  }

  const handleToggleDestacado = () => {
    setFormData((prev) => ({ ...prev, destacado: !prev.destacado }))
  }

  const handleUpdateLugar = async () => {
    if (!lugarSeleccionado) return

    if (!formData.nombre.trim()) {
      alert('El nombre es obligatorio')
      return
    }

    if ((formData.descripcion ?? '').trim().length < 20) {
      alert('La descripción debe tener al menos 20 caracteres')
      return
    }

    if (!formData.subtipo) {
      alert('El subtipo es obligatorio')
      return
    }

    const { error } = await supabase
      .from('lugares')
      .update({
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio_entrada: formData.precio_entrada,
        subtipo: formData.subtipo,
        destacado: formData.destacado,
      })
      .eq('id', lugarSeleccionado.id)

    if (error) {
      console.error(error)
      alert('Error al actualizar')
      return
    }

    const payload = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      precio_entrada: formData.precio_entrada,
      subtipo: formData.subtipo,
      destacado: formData.destacado,
    }
    const lugarActualizado = { ...lugarSeleccionado, ...payload }
    setLugarSeleccionado(lugarActualizado)
    setLugares((prev) => prev.map((lugar) => (
      lugar.id === lugarSeleccionado.id ? { ...lugar, ...payload } : lugar
    )))
    alert('Lugar actualizado')
  }

  const handleSubirFoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const MAX_SIZE_MB = 5
    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast('Formato no válido. Usá JPG, PNG, WEBP o GIF.')
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      showToast(`La imagen no puede superar ${MAX_SIZE_MB}MB.`)
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    setUploading(true)

    const mimeMap = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }
    const ext = mimeMap[file.type] ?? 'jpg'
    const path = `${lugarSeleccionado.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('lugares-fotos')
      .upload(path, file)

    if (uploadError) {
      showToast(`Error: ${uploadError.message}`)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('lugares-fotos')
      .getPublicUrl(path)

    // Obtener usuario admin id
    const { data: { session } } = await supabase.auth.getSession()
    const { data: usuarioRow } = await supabase
      .from('usuarios')
      .select('id')
      .eq('auth_id', session.user.id)
      .maybeSingle()

    const { error: insertError } = await supabase
      .from('imagenes_lugar')
      .insert({
        lugar_id: lugarSeleccionado.id,
        ruta_imagen: urlData.publicUrl,
        usuario_id: usuarioRow.id,
      })

    if (insertError) {
      showToast(`Error al guardar: ${insertError.message}`)
    } else {
      showToast('✓ Foto subida')
      cargarImagenes(lugarSeleccionado.id)
    }

    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleEliminarFoto = async (imagen) => {
    const url = imagen.ruta_imagen ?? ''
    const bucketPrefix = '/object/public/lugares-fotos/'
    const idx = url.indexOf(bucketPrefix)

    if (idx !== -1) {
      const path = url.substring(idx + bucketPrefix.length)
      await supabase.storage.from('lugares-fotos').remove([path])
    }
    await supabase.from('imagenes_lugar').delete().eq('id', imagen.id)

    // Si eliminas la portada, limpiarla
    if (imagen.ruta_imagen === lugarSeleccionado.imagen_principal) {
      await supabase.from('lugares').update({ imagen_principal: null }).eq('id', lugarSeleccionado.id)
      setLugarSeleccionado((prev) => ({ ...prev, imagen_principal: null }))
    }

    showToast('Foto eliminada')
    cargarImagenes(lugarSeleccionado.id)
  }

  const handleSetPortada = async (imagen) => {
    const { error } = await supabase
      .from('lugares')
      .update({ imagen_principal: imagen.ruta_imagen })
      .eq('id', lugarSeleccionado.id)

    if (error) {
      showToast('Error al actualizar portada')
      return
    }

    setLugarSeleccionado((prev) => ({ ...prev, imagen_principal: imagen.ruta_imagen }))
    setLugares((prev) =>
      prev.map((l) =>
        l.id === lugarSeleccionado.id ? { ...l, imagen_principal: imagen.ruta_imagen } : l
      )
    )
    showToast('✓ Foto de portada actualizada')
  }

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#9ca3af' }}>Verificando acceso…</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem' }}>
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: '#111827', color: '#fff', padding: '12px 24px',
          borderRadius: '50px', fontSize: '0.875rem', fontWeight: 500,
          zIndex: 999, boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: 0 }}>
              Panel Admin — <span style={{ color: '#0EA5E9' }}>DescubreSV</span>
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '4px' }}>Gestión de galería de fotos</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              backgroundColor: 'transparent', border: '1px solid #e5e7eb',
              borderRadius: '8px', padding: '8px 16px', fontSize: '0.85rem',
              color: '#6b7280', cursor: 'pointer',
            }}
          >
            ← Volver al sitio
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
          {/* Lista de lugares */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', height: 'fit-content' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
              Lugares ({lugares.length})
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {lugares.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => handleSeleccionarLugar(l)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '10px 12px',
                      borderRadius: '8px', border: 'none', cursor: 'pointer',
                      fontSize: '0.88rem', fontWeight: lugarSeleccionado?.id === l.id ? 600 : 400,
                      color: lugarSeleccionado?.id === l.id ? '#0EA5E9' : '#374151',
                      backgroundColor: lugarSeleccionado?.id === l.id ? 'rgba(14,165,233,0.08)' : 'transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {l.nombre}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Panel de galería */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            {!lugarSeleccionado ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#9ca3af' }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📍</p>
                <p>Seleccioná un lugar para gestionar su galería</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                    {lugarSeleccionado.nombre}
                    <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#9ca3af', marginLeft: '8px' }}>
                      {imagenes.length} foto{imagenes.length !== 1 ? 's' : ''}
                    </span>
                  </h2>
                  <label style={{
                    backgroundColor: '#0EA5E9', color: '#fff', borderRadius: '8px',
                    padding: '8px 18px', fontSize: '0.85rem', fontWeight: 600,
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    opacity: uploading ? 0.7 : 1,
                  }}>
                    {uploading ? 'Subiendo…' : '+ Subir foto'}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleSubirFoto}
                      disabled={uploading}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                <EditLugarForm
                  formData={formData}
                  onChange={handleFormChange}
                  onToggleDestacado={handleToggleDestacado}
                  onSave={handleUpdateLugar}
                  onCancel={handleCancelarEdicion}
                />

                {imagenes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', border: '2px dashed #e5e7eb', borderRadius: '12px', color: '#9ca3af' }}>
                    <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🖼️</p>
                    <p>Sin fotos todavía. Subí la primera.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                    {imagenes.map((img) => {
                      const esPortada = img.ruta_imagen === lugarSeleccionado.imagen_principal
                      return (
                        <div key={img.id} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', aspectRatio: '4/3' }}>
                          <img
                            src={resolveImageUrl(img.ruta_imagen, 'lugares-fotos')}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />

                          {/* Indicador de portada actual */}
                          {esPortada && (
                            <div style={{
                              position: 'absolute', bottom: '8px', left: '8px',
                              backgroundColor: 'rgba(16,185,129,0.92)', color: '#fff',
                              fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px',
                              borderRadius: '20px', pointerEvents: 'none',
                            }}>
                              ★ Portada
                            </div>
                          )}

                          {/* Botón set portada */}
                          {!esPortada && (
                            <button
                              type="button"
                              onClick={() => handleSetPortada(img)}
                              style={{
                                position: 'absolute', bottom: '8px', left: '8px',
                                backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff',
                                border: 'none', borderRadius: '20px', padding: '3px 8px',
                                fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                              }}
                            >
                              ★ Usar portada
                            </button>
                          )}

                          {/* Botón eliminar */}
                          <button
                            type="button"
                            onClick={() => handleEliminarFoto(img)}
                            style={{
                              position: 'absolute', top: '8px', right: '8px',
                              backgroundColor: 'rgba(239,68,68,0.9)', color: '#fff',
                              border: 'none', borderRadius: '50%', width: '28px', height: '28px',
                              cursor: 'pointer', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
