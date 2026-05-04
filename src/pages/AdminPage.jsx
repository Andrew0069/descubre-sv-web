import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getUsuarioAdmin, getUsuarioId } from '../services/usuariosService'
import { getLugaresAdmin, createLugar, updateLugar, deleteLugar, updateImagenPrincipal } from '../services/lugaresService'
import { resolveImageUrl } from '../lib/imageUrl'
import EditLugarForm from '../components/EditLugarForm'
import NewLugarForm, { DEPARTAMENTOS } from '../components/NewLugarForm'

const buttonBase = {
  border: 'none',
  borderRadius: '8px',
  padding: '8px 14px',
  fontSize: '0.82rem',
  fontWeight: 700,
  cursor: 'pointer',
}

export const DEFAULT_CATEGORY_COLOR = '#2196F3'

const emptyNewLugarForm = {
  nombre: '',
  descripcion: '',
  direccion: '',
  departamento_id: DEPARTAMENTOS[0].value,
  categoria_id: '',
  nueva_categoria_nombre: '',
  categoria_color: DEFAULT_CATEGORY_COLOR,
  nueva_categoria_color: DEFAULT_CATEGORY_COLOR,
  precio_entrada: '',
  subtipo: '',
  destacado: false,
  latitud: 0,
  longitud: 0,
}

function formatDateTime(value) {
  if (!value) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-SV', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function prettyJson(value) {
  if (!value) return '{}'
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2)
    } catch {
      return value
    }
  }
  return JSON.stringify(value, null, 2)
}

function actionBadgeStyle(action) {
  const colors = {
    DELETE: { backgroundColor: '#fee2e2', color: '#b91c1c' },
    UPDATE: { backgroundColor: '#fef3c7', color: '#92400e' },
    CREATE: { backgroundColor: '#dcfce7', color: '#166534' },
  }
  return {
    ...(colors[action] ?? { backgroundColor: '#e5e7eb', color: '#374151' }),
    borderRadius: '999px',
    padding: '4px 10px',
    fontSize: '0.72rem',
    fontWeight: 800,
    display: 'inline-flex',
  }
}


export default function AdminPage() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [adminId, setAdminId] = useState(null)
  const [activeSection, setActiveSection] = useState('lugares')
  const [lugares, setLugares] = useState([])
  const [categorias, setCategorias] = useState([])
  const [lugarSeleccionado, setLugarSeleccionado] = useState(null)
  const [isCreatingLugar, setIsCreatingLugar] = useState(false)
  const [newLugarForm, setNewLugarForm] = useState(emptyNewLugarForm)
  const [creatingLugar, setCreatingLugar] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria_id: '',
    nueva_categoria_nombre: '',
    categoria_color: DEFAULT_CATEGORY_COLOR,
    nueva_categoria_color: DEFAULT_CATEGORY_COLOR,
    precio_entrada: '',
    subtipo: '',
    destacado: false,
  })
  const [imagenes, setImagenes] = useState([])
  const [resenas, setResenas] = useState([])
  const [respuestas, setRespuestas] = useState({})
  const [logs, setLogs] = useState([])
  const [loadingResenas, setLoadingResenas] = useState(false)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deletingLugar, setDeletingLugar] = useState(false)
  const [toast, setToast] = useState(null)
  const fileRef = useRef(null)

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  const cargarCategorias = useCallback(async () => {
    const { data, error } = await supabase
      .from('categorias')
      .select('id, nombre, color')
      .order('nombre')

    if (error) {
      console.error(error)
      showToast('Error al cargar categorías')
      setCategorias([])
      return []
    }

    const rows = data ?? []
    setCategorias(rows)
    return rows
  }, [showToast])

  const insertAdminLog = useCallback(async ({ accion, tabla, registro_id, detalle }) => {
    if (!adminId) return { error: new Error('No se encontro el admin autenticado') }
    const { error } = await supabase.from('admin_logs').insert({
      accion,
      tabla,
      registro_id,
      detalle,
      admin_id: adminId,
    })
    if (error) console.error('[admin_logs] insert error:', error)
    return { error }
  }, [adminId])

  const cargarLogs = useCallback(async () => {
    setLoadingLogs(true)
    const { data, error } = await supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      showToast('Error al cargar la bitácora')
      setLogs([])
    } else {
      setLogs(data ?? [])
    }
    setLoadingLogs(false)
  }, [showToast])

  const cargarResenas = useCallback(async () => {
    setLoadingResenas(true)
    const { data, error } = await supabase
      .from('resenas')
      .select(`
        id,
        usuario_id,
        lugar_id,
        titulo,
        contenido,
        created_at,
        estrellas,
        usuarios(nombre),
        lugares(nombre)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      showToast('Error al cargar reseñas')
      setResenas([])
      setRespuestas({})
      setLoadingResenas(false)
      return
    }

    const rows = data ?? []
    setResenas(rows)

    const ids = rows.map((r) => r.id).filter(Boolean)
    if (ids.length === 0) {
      setRespuestas({})
      setLoadingResenas(false)
      return
    }

    const { data: respuestasRows, error: respuestasError } = await supabase
      .from('respuestas_resena')
      .select('id, resena_id, usuario_id, contenido, created_at, usuarios(nombre)')
      .in('resena_id', ids)
      .order('created_at', { ascending: true })

    if (respuestasError) {
      console.error(respuestasError)
      showToast('Error al cargar respuestas')
      setRespuestas({})
    } else {
      const map = {}
      for (const respuesta of respuestasRows ?? []) {
        if (!map[respuesta.resena_id]) map[respuesta.resena_id] = []
        map[respuesta.resena_id].push(respuesta)
      }
      setRespuestas(map)
    }
    setLoadingResenas(false)
  }, [showToast])

  // Guard: verificar is_admin
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { navigate('/'); return }
      const usuario = await getUsuarioAdmin(session.user.id)
      if (!usuario?.is_admin) { navigate('/'); return }
      setAdminId(usuario.id)
      setChecking(false)
    }
    check()
  }, [navigate])

  const cargarLugares = useCallback(async () => {
    const { data, error } = await getLugaresAdmin()

    if (error) {
      console.error(error)
      showToast('Error al cargar lugares')
      setLugares([])
      return []
    }

    const rows = data ?? []
    setLugares(rows)
    return rows
  }, [showToast])

  // Cargar lugares
  useEffect(() => {
    if (checking) return
    cargarLugares()
    cargarCategorias()
  }, [cargarCategorias, cargarLugares, checking])

  useEffect(() => {
    if (newLugarForm.categoria_id || categorias.length === 0) return
    setNewLugarForm((prev) => ({
      ...prev,
      categoria_id: categorias[0].id,
      categoria_color: categorias[0].color || DEFAULT_CATEGORY_COLOR,
    }))
  }, [categorias, newLugarForm.categoria_id])

  useEffect(() => {
    if (checking || activeSection !== 'resenas') return
    cargarResenas()
  }, [activeSection, cargarResenas, checking])

  useEffect(() => {
    if (checking || activeSection !== 'bitacora') return
    cargarLogs()
  }, [activeSection, cargarLogs, checking])

  const cargarImagenes = useCallback(async (lugarId) => {
    const { data } = await supabase
      .from('imagenes_lugar')
      .select('id, lugar_id, ruta_imagen, orden')
      .eq('lugar_id', lugarId)
      .order('orden', { ascending: true })
    setImagenes(data ?? [])
  }, [])

  const handleSeleccionarLugar = (lugar) => {
    setIsCreatingLugar(false)
    setLugarSeleccionado(lugar)
    cargarImagenes(lugar.id)
  }

  const handleActivarCreacionLugar = () => {
    setActiveSection('lugares')
    setLugarSeleccionado(null)
    setImagenes([])
    setIsCreatingLugar(true)
  }

  const handleCancelarCreacionLugar = () => {
    setIsCreatingLugar(false)
    setNewLugarForm(emptyNewLugarForm)
  }

  useEffect(() => {
    if (!lugarSeleccionado) {
      setFormData({
        nombre: '',
        descripcion: '',
        categoria_id: '',
        nueva_categoria_nombre: '',
        categoria_color: DEFAULT_CATEGORY_COLOR,
        nueva_categoria_color: DEFAULT_CATEGORY_COLOR,
        precio_entrada: '',
        subtipo: '',
        destacado: false,
      })
      return
    }

    const categoria = categorias.find((item) => item.id === lugarSeleccionado.categoria_id)
    setFormData({
      nombre: lugarSeleccionado.nombre ?? '',
      descripcion: lugarSeleccionado.descripcion ?? '',
      categoria_id: lugarSeleccionado.categoria_id ?? '',
      nueva_categoria_nombre: '',
      categoria_color: categoria?.color || DEFAULT_CATEGORY_COLOR,
      nueva_categoria_color: DEFAULT_CATEGORY_COLOR,
      precio_entrada: lugarSeleccionado.precio_entrada ?? '',
      subtipo: lugarSeleccionado.subtipo ?? '',
      destacado: lugarSeleccionado.destacado ?? false,
    })
  }, [categorias, lugarSeleccionado])

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      if (name === 'categoria_id') {
        const categoria = categorias.find((item) => item.id === value)
        return {
          ...prev,
          categoria_id: value,
          categoria_color: categoria?.color || DEFAULT_CATEGORY_COLOR,
          nueva_categoria_color: DEFAULT_CATEGORY_COLOR,
        }
      }
      return { ...prev, [name]: value }
    })
  }

  const handleNewLugarChange = (e) => {
    const { name, value } = e.target
    setNewLugarForm((prev) => {
      if (name === 'categoria_id') {
        const categoria = categorias.find((item) => item.id === value)
        return {
          ...prev,
          categoria_id: value,
          categoria_color: categoria?.color || DEFAULT_CATEGORY_COLOR,
          nueva_categoria_color: DEFAULT_CATEGORY_COLOR,
        }
      }
      return { ...prev, [name]: value }
    })
  }

  const handleCancelarEdicion = () => {
    if (!lugarSeleccionado) return
    const categoria = categorias.find((item) => item.id === lugarSeleccionado.categoria_id)
    setFormData({
      nombre: lugarSeleccionado.nombre ?? '',
      descripcion: lugarSeleccionado.descripcion ?? '',
      categoria_id: lugarSeleccionado.categoria_id ?? '',
      nueva_categoria_nombre: '',
      categoria_color: categoria?.color || DEFAULT_CATEGORY_COLOR,
      nueva_categoria_color: DEFAULT_CATEGORY_COLOR,
      precio_entrada: lugarSeleccionado.precio_entrada ?? '',
      subtipo: lugarSeleccionado.subtipo ?? '',
      destacado: lugarSeleccionado.destacado ?? false,
    })
  }

  const handleToggleDestacado = () => {
    setFormData((prev) => ({ ...prev, destacado: !prev.destacado }))
  }

  const handleToggleNewDestacado = () => {
    setNewLugarForm((prev) => ({ ...prev, destacado: !prev.destacado }))
  }

  const handleCrearLugar = async () => {
    if (creatingLugar) return

    const nombre = newLugarForm.nombre.trim()
    const descripcion = newLugarForm.descripcion.trim()

    if (!nombre || !descripcion) {
      showToast('Nombre y descripción son obligatorios')
      return
    }

    setCreatingLugar(true)

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error(userError)
      showToast('Error al crear el lugar')
      setCreatingLugar(false)
      return
    }

    const usuario = await getUsuarioId(user.id)

    if (!usuario) {
      console.error('Error: no se pudo encontrar id del usuario')
      showToast('Error al crear el lugar')
      setCreatingLugar(false)
      return
    }

    let categoriaId = newLugarForm.categoria_id
    if (categoriaId === '__nueva__') {
      const nombreNuevaCategoria = newLugarForm.nueva_categoria_nombre.trim()

      if (!nombreNuevaCategoria) {
        showToast('Escribe el nombre de la nueva categoría')
        setCreatingLugar(false)
        return
      }

      const { data: categoriaCreada, error: categoriaError } = await supabase
        .from('categorias')
        .insert({
          nombre: nombreNuevaCategoria,
          color: newLugarForm.nueva_categoria_color || DEFAULT_CATEGORY_COLOR,
        })
        .select('id, nombre, color')
        .maybeSingle()

      if (categoriaError || !categoriaCreada?.id) {
        console.error(categoriaError)
        showToast('Error al crear la categoría')
        setCreatingLugar(false)
        return
      }

      categoriaId = categoriaCreada.id
      await cargarCategorias()
    } else if (categoriaId && newLugarForm.categoria_color) {
      const { error: colorError } = await supabase
        .from('categorias')
        .update({ color: newLugarForm.categoria_color })
        .eq('id', categoriaId)
      if (colorError) {
        console.error(colorError)
        showToast('Error al actualizar el color de la categoria')
        setCreatingLugar(false)
        return
      }
      await cargarCategorias()
    }

    const payload = {
      nombre,
      descripcion,
      direccion: newLugarForm.direccion.trim() || null,
      departamento_id: newLugarForm.departamento_id,
      categoria_id: categoriaId,
      precio_entrada: newLugarForm.precio_entrada.trim() || null,
      subtipo: newLugarForm.subtipo.trim() || null,
      destacado: newLugarForm.destacado,
      latitud: Number(newLugarForm.latitud) || 0,
      longitud: Number(newLugarForm.longitud) || 0,
      usuario_id: usuario,
      aprobado: true,
      promedio_estrellas: 0,
      total_resenas: 0,
    }

    const { data: lugarCreado, error } = await createLugar(payload)

    if (error || !lugarCreado) {
      console.error(error)
      showToast('Error al crear el lugar')
      setCreatingLugar(false)
      return
    }

    await insertAdminLog({
      accion: 'CREATE',
      tabla: 'lugares',
      registro_id: lugarCreado.id,
      detalle: { nombre },
    })

    await cargarLugares()

    setNewLugarForm(emptyNewLugarForm)
    setIsCreatingLugar(false)
    handleSeleccionarLugar(lugarCreado)
    showToast('Lugar creado correctamente')
    setCreatingLugar(false)
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

    let categoriaId = formData.categoria_id
    if (categoriaId === '__nueva__') {
      const nombreNuevaCategoria = (formData.nueva_categoria_nombre ?? '').trim()

      if (!nombreNuevaCategoria) {
        showToast('Escribe el nombre de la nueva categoría')
        return
      }

      const { data: categoriaCreada, error: categoriaError } = await supabase
        .from('categorias')
        .insert({
          nombre: nombreNuevaCategoria,
          color: formData.nueva_categoria_color || DEFAULT_CATEGORY_COLOR,
        })
        .select('id, nombre, color')
        .maybeSingle()

      if (categoriaError || !categoriaCreada?.id) {
        console.error(categoriaError)
        showToast('Error al crear la categoría')
        return
      }

      categoriaId = categoriaCreada.id
      await cargarCategorias()
    } else if (categoriaId && formData.categoria_color) {
      const { error: colorError } = await supabase
        .from('categorias')
        .update({ color: formData.categoria_color })
        .eq('id', categoriaId)
      if (colorError) {
        console.error(colorError)
        showToast('Error al actualizar el color de la categoria')
        return
      }
      await cargarCategorias()
    }

    const payload = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      categoria_id: categoriaId || null,
      precio_entrada: formData.precio_entrada,
      subtipo: formData.subtipo || null,
      destacado: formData.destacado,
    }
    const camposModificados = Object.keys(payload).filter((key) => payload[key] !== lugarSeleccionado[key])

    const { error } = await updateLugar(lugarSeleccionado.id, payload)

    if (error) {
      console.error(error)
      alert('Error al actualizar')
      return
    }

    await insertAdminLog({
      accion: 'UPDATE',
      tabla: 'lugares',
      registro_id: lugarSeleccionado.id,
      detalle: {
        nombre: payload.nombre,
        campo_modificado: camposModificados.join(', ') || 'sin cambios',
      },
    })

    const lugarActualizado = { ...lugarSeleccionado, ...payload }
    setFormData((prev) => ({
      ...prev,
      categoria_id: payload.categoria_id ?? '',
      nueva_categoria_nombre: '',
      categoria_color: formData.categoria_color || DEFAULT_CATEGORY_COLOR,
      nueva_categoria_color: DEFAULT_CATEGORY_COLOR,
    }))
    setLugarSeleccionado(lugarActualizado)
    setLugares((prev) => prev.map((lugar) => (
      lugar.id === lugarSeleccionado.id ? { ...lugar, ...payload } : lugar
    )))
    alert('Lugar actualizado')
  }

  const handleEliminarLugar = async () => {
    if (!lugarSeleccionado || deletingLugar) return
    setDeletingLugar(true)

    if (!adminId) {
      showToast('No se encontro el admin autenticado')
      setDeletingLugar(false)
      return
    }

    const bucketPrefix = '/object/public/lugares-fotos/'

    const { data: imgs } = await supabase
      .from('imagenes_lugar')
      .select('ruta_imagen')
      .eq('lugar_id', lugarSeleccionado.id)

    const paths = (imgs ?? [])
      .map((img) => {
        const value = img.ruta_imagen ?? ''
        const idx = value.indexOf(bucketPrefix)
        return idx !== -1 ? value.substring(idx + bucketPrefix.length) : value
      })
      .filter(Boolean)

    const { error: ownerError } = await updateLugar(lugarSeleccionado.id, { usuario_id: adminId })

    if (ownerError) {
      console.error(ownerError)
      showToast('Error al preparar el lugar para eliminar')
      setDeletingLugar(false)
      return
    }

    const { data: deletedRows, error: deleteError } = await deleteLugar(lugarSeleccionado.id)

    if (deleteError || !deletedRows?.length) {
      console.error(deleteError ?? new Error('No se elimino ninguna fila'))
      showToast('Error al eliminar el lugar')
      setDeletingLugar(false)
      return
    }

    if (paths.length > 0) {
      await supabase.storage.from('lugares-fotos').remove(paths)
    }

    await insertAdminLog({
      accion: 'DELETE',
      tabla: 'lugares',
      registro_id: lugarSeleccionado.id,
      detalle: { nombre: lugarSeleccionado.nombre },
    })

    const idEliminado = lugarSeleccionado.id
    setConfirmDelete(false)
    setDeletingLugar(false)
    setLugarSeleccionado(null)
    setImagenes([])
    setLugares((prev) => prev.filter((l) => l.id !== idEliminado))
    showToast('Lugar eliminado correctamente')
  }

  const handleSubirFoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !lugarSeleccionado) return

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const MAX_SIZE_MB = 5
    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast('Formato no válido. Usa JPG, PNG, WEBP o GIF.')
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

    const { error: insertError, data: imagenInsertada } = await supabase
      .from('imagenes_lugar')
      .insert({
        lugar_id: lugarSeleccionado.id,
        ruta_imagen: urlData.publicUrl,
        usuario_id: adminId,
        orden: imagenes.length,
      })
      .select('id')
      .maybeSingle()

    if (insertError || !imagenInsertada) {
      showToast(insertError ? `Error al guardar: ${insertError.message}` : 'Error al guardar la imagen')
    } else {
      await insertAdminLog({
        accion: 'CREATE',
        tabla: 'imagenes_lugar',
        registro_id: imagenInsertada.id,
        detalle: {
          lugar_nombre: lugarSeleccionado.nombre,
          ruta_imagen: urlData.publicUrl,
        },
      })
      showToast('Foto subida')
      cargarImagenes(lugarSeleccionado.id)
    }

    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleEliminarFoto = async (imagen) => {
    if (!lugarSeleccionado) return
    const url = imagen.ruta_imagen ?? ''
    const bucketPrefix = '/object/public/lugares-fotos/'
    const idx = url.indexOf(bucketPrefix)

    const { error: logError } = await insertAdminLog({
      accion: 'DELETE',
      tabla: 'imagenes_lugar',
      registro_id: imagen.id,
      detalle: {
        lugar_nombre: lugarSeleccionado.nombre,
        ruta_imagen: imagen.ruta_imagen,
      },
    })
    if (logError) {
      showToast('No se pudo registrar la bitácora')
      return
    }

    if (idx !== -1) {
      const path = url.substring(idx + bucketPrefix.length)
      await supabase.storage.from('lugares-fotos').remove([path])
    }
    const { error } = await supabase.from('imagenes_lugar').delete().eq('id', imagen.id)
    if (error) {
      showToast('Error al eliminar foto')
      return
    }

    if (imagen.ruta_imagen === lugarSeleccionado.imagen_principal) {
      const remaining = imagenes
        .filter((i) => i.id !== imagen.id)
        .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      const nextPortada = remaining[0]?.ruta_imagen ?? null
      await updateImagenPrincipal(lugarSeleccionado.id, nextPortada)
      setLugarSeleccionado((prev) => ({ ...prev, imagen_principal: nextPortada }))
      setLugares((prev) =>
        prev.map((l) => l.id === lugarSeleccionado.id ? { ...l, imagen_principal: nextPortada } : l)
      )
    }

    showToast('Foto eliminada')
    cargarImagenes(lugarSeleccionado.id)
  }

  const handleMoverImagen = async (idx, dir) => {
    const targetIdx = idx + dir
    if (targetIdx < 0 || targetIdx >= imagenes.length) return

    const imgA = imagenes[idx]
    const imgB = imagenes[targetIdx]
    const ordenA = imgA.orden ?? idx
    const ordenB = imgB.orden ?? targetIdx

    const [resA, resB] = await Promise.all([
      supabase.from('imagenes_lugar').update({ orden: ordenB }).eq('id', imgA.id),
      supabase.from('imagenes_lugar').update({ orden: ordenA }).eq('id', imgB.id),
    ])

    if (resA.error || resB.error) {
      showToast('Error al reordenar')
      return
    }

    const updated = imagenes
      .map((img) => {
        if (img.id === imgA.id) return { ...img, orden: ordenB }
        if (img.id === imgB.id) return { ...img, orden: ordenA }
        return img
      })
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))

    setImagenes(updated)

    const newFirst = updated[0]
    if (newFirst && newFirst.ruta_imagen !== lugarSeleccionado.imagen_principal) {
      await updateImagenPrincipal(lugarSeleccionado.id, newFirst.ruta_imagen)
      setLugarSeleccionado((prev) => ({ ...prev, imagen_principal: newFirst.ruta_imagen }))
      setLugares((prev) =>
        prev.map((l) => l.id === lugarSeleccionado.id ? { ...l, imagen_principal: newFirst.ruta_imagen } : l)
      )
    }
  }

  const handleHacerPortada = async (imagen) => {
    const others = imagenes.filter((i) => i.id !== imagen.id)
    const updates = [
      { id: imagen.id, orden: 0 },
      ...others.map((i, pos) => ({ id: i.id, orden: pos + 1 })),
    ]

    await Promise.all(
      updates.map((u) => supabase.from('imagenes_lugar').update({ orden: u.orden }).eq('id', u.id))
    )

    const { error } = await updateImagenPrincipal(lugarSeleccionado.id, imagen.ruta_imagen)

    if (error) {
      showToast('Error al actualizar portada')
      return
    }

    await insertAdminLog({
      accion: 'UPDATE',
      tabla: 'lugares',
      registro_id: lugarSeleccionado.id,
      detalle: { nombre: lugarSeleccionado.nombre, campo_modificado: 'imagen_principal' },
    })

    const newImagenes = updates
      .map((u) => ({ ...imagenes.find((i) => i.id === u.id), orden: u.orden }))
      .sort((a, b) => a.orden - b.orden)

    setImagenes(newImagenes)
    setLugarSeleccionado((prev) => ({ ...prev, imagen_principal: imagen.ruta_imagen }))
    setLugares((prev) =>
      prev.map((l) => l.id === lugarSeleccionado.id ? { ...l, imagen_principal: imagen.ruta_imagen } : l)
    )
    showToast('Foto de portada actualizada')
  }

  const handleEliminarResena = async (resena) => {
    const ok = window.confirm('¿Seguro que quieres eliminar esta reseña? Esta acción no se puede deshacer.')
    if (!ok) return

    const usuarioNombre = resena.usuarios?.nombre ?? 'Anonimo'
    const lugarNombre = resena.lugares?.nombre ?? 'Lugar desconocido'
    const { error: logError } = await supabase.from('admin_logs').insert({
      accion: 'DELETE',
      tabla: 'resenas',
      registro_id: resena.id,
      detalle: {
        titulo: resena.titulo ?? null,
        contenido: resena.contenido,
        usuario_nombre: usuarioNombre,
        lugar_nombre: lugarNombre,
        estrellas: resena.estrellas ?? null,
      },
      admin_id: adminId,
    })
    if (logError) {
      console.error('Error al registrar bitácora:', logError)
    }

    const { error: deleteError } = await supabase.from('resenas').delete().eq('id', resena.id)
    if (deleteError) {
      showToast('Error al eliminar. Intenta de nuevo.')
      console.error(deleteError)
      return
    }
    setResenas((prev) => prev.filter((r) => r.id !== resena.id))
    setRespuestas((prev) => {
      const next = { ...prev }
      delete next[resena.id]
      return next
    })
    showToast('Eliminado correctamente')
  }

  const handleEliminarRespuesta = async (respuesta, resena) => {
    const ok = window.confirm('¿Seguro que quieres eliminar esta respuesta? Esta acción no se puede deshacer.')
    if (!ok) return

    const { error: logError } = await supabase.from('admin_logs').insert({
      accion: 'DELETE',
      tabla: 'respuestas_resena',
      registro_id: respuesta.id,
      detalle: {
        contenido: respuesta.contenido,
        usuario_nombre: respuesta.usuarios?.nombre ?? 'Anonimo',
        lugar_nombre: resena?.lugares?.nombre ?? 'Lugar desconocido',
      },
      admin_id: adminId,
    })
    if (logError) {
      console.error('Error al registrar bitácora:', logError)
    }

    const { error: deleteError } = await supabase.from('respuestas_resena').delete().eq('id', respuesta.id)
    if (deleteError) {
      showToast('Error al eliminar. Intenta de nuevo.')
      console.error(deleteError)
      return
    }
    setRespuestas((prev) => ({
      ...prev,
      [respuesta.resena_id]: (prev[respuesta.resena_id] ?? []).filter((r) => r.id !== respuesta.id),
    }))
    showToast('Eliminado correctamente')
  }

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#9ca3af' }}>Verificando acceso...</p>
      </div>
    )
  }

  const sidebarItems = [
    { id: 'lugares', label: `Lugares (${lugares.length})` },
    { id: 'resenas', label: 'Reseñas' },
    { id: 'bitacora', label: 'Bitácora' },
  ]

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

      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: 0 }}>
              Panel Admin —{' '}
              <svg viewBox="0 0 200 48" height="36" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2 C13 2, 5 10, 5 20 C5 33, 22 48, 22 48 C22 48, 39 33, 39 20 C39 10 31 2, 22 2 Z" fill="#F5A623" />
                <circle cx="22" cy="19" r="10" fill="#1a1a2e" />
                <path d="M10 19 C13 14, 18 14, 22 19 C26 24, 31 24, 34 19" fill="none" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
                <path d="M11 24 C14 20, 18 20, 22 24 C26 28, 30 28, 33 24" fill="none" stroke="#F5A623" strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
                <circle cx="33" cy="8" r="2.5" fill="#F5A623" opacity="0.4" />
                <text x="46" y="30" fontFamily="Georgia, serif" fontSize="26" fontWeight="700" letterSpacing="-1" fill="#1a1a2e">
                  <tspan fill="#F5A623">S</tspan><tspan fill="#1a1a2e">potter</tspan>
                </text>
              </svg>
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '4px' }}>Gestión de lugares, reseñas y bitácora</p>
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

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem' }}>
          <aside style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', height: 'fit-content' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
              Admin
            </p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {sidebarItems.map((item) => (
                <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '10px 12px',
                      borderRadius: '8px', border: 'none', cursor: 'pointer',
                      fontSize: '0.9rem', fontWeight: activeSection === item.id ? 700 : 500,
                      color: activeSection === item.id ? '#0EA5E9' : '#374151',
                      backgroundColor: activeSection === item.id ? 'rgba(14,165,233,0.08)' : 'transparent',
                    }}
                  >
                    {item.label}
                  </button>
                  {item.id === 'lugares' && (
                    <button
                      type="button"
                      onClick={handleActivarCreacionLugar}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '9px 12px 9px 24px',
                        borderRadius: '8px',
                        border: '1px solid rgba(14,165,233,0.18)',
                        cursor: 'pointer',
                        fontSize: '0.86rem',
                        fontWeight: 800,
                        color: '#0EA5E9',
                        backgroundColor: isCreatingLugar ? 'rgba(14,165,233,0.12)' : 'rgba(14,165,233,0.05)',
                      }}
                    >
                      + Nuevo lugar
                    </button>
                  )}
                </div>
              ))}
            </nav>

            {activeSection === 'lugares' && (
              <div style={{ marginTop: '1.25rem', borderTop: '1px solid #f3f4f6', paddingTop: '1rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
                  Lugares
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {lugares.map((l) => (
                    <li key={l.id} style={{ minWidth: 0 }}>
                      <button
                        type="button"
                        onClick={() => handleSeleccionarLugar(l)}
                        style={{
                          width: '100%',
                          minHeight: '42px',
                          textAlign: 'left',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.88rem', fontWeight: lugarSeleccionado?.id === l.id ? 600 : 400,
                          lineHeight: 1.35,
                          color: lugarSeleccionado?.id === l.id ? '#0EA5E9' : '#374151',
                          backgroundColor: lugarSeleccionado?.id === l.id ? 'rgba(14,165,233,0.08)' : 'transparent',
                          overflowWrap: 'anywhere',
                          wordBreak: 'break-word',
                        }}
                      >
                        {l.nombre}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          <main style={{ minWidth: 0 }}>
            {activeSection === 'lugares' && (
              <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                {isCreatingLugar ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem' }}>
                      <div>
                        <p style={{ fontSize: '0.78rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.35rem' }}>
                          Crear lugar
                        </p>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                          Nuevo lugar
                        </h2>
                        <p style={{ fontSize: '0.86rem', color: '#6b7280', margin: '0.35rem 0 0' }}>
                          Completa la información principal. Después podrás agregar fotos desde la edición del lugar.
                        </p>
                      </div>
                    </div>

                    <NewLugarForm
                      formData={newLugarForm}
                      categorias={categorias}
                      isSaving={creatingLugar}
                      onChange={handleNewLugarChange}
                      onToggleDestacado={handleToggleNewDestacado}
                      onSave={handleCrearLugar}
                      onCancel={handleCancelarCreacionLugar}
                    />
                  </div>
                ) : !lugarSeleccionado ? (
                  <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#9ca3af', border: '1px dashed #e5e7eb', borderRadius: '12px' }}>
                    <p style={{ fontSize: '1rem', fontWeight: 700, color: '#6b7280', margin: '0 0 0.35rem' }}>Lugares</p>
                    <p style={{ margin: 0 }}>Selecciona un lugar del sidebar para editar su información y galería.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem' }}>
                      <div>
                        <p style={{ fontSize: '0.78rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.35rem' }}>
                          Editar lugar
                        </p>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                          {lugarSeleccionado.nombre}
                        </h2>
                        <p style={{ fontSize: '0.86rem', color: '#6b7280', margin: '0.35rem 0 0' }}>
                          Actualiza los datos principales y administra las fotos del lugar.
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          borderRadius: '999px',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          padding: '5px 10px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          whiteSpace: 'nowrap',
                        }}>
                          {imagenes.length} foto{imagenes.length !== 1 ? 's' : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(true)}
                          style={{
                            ...buttonBase,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#FEF2F2',
                            color: '#DC2626',
                            border: '1px solid #FECACA',
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4h6v2" />
                          </svg>
                          Eliminar lugar
                        </button>
                      </div>
                    </div>

                    <EditLugarForm
                      formData={formData}
                      categorias={categorias}
                      onChange={handleFormChange}
                      onToggleDestacado={handleToggleDestacado}
                      onSave={handleUpdateLugar}
                      onCancel={handleCancelarEdicion}
                    />

                    <section style={{ border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', borderBottom: '1px solid #f3f4f6' }}>
                        <div>
                          <p style={{ fontSize: '0.78rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                            Galería
                          </p>
                          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#111827', margin: '0.25rem 0 0' }}>
                            Fotos del lugar
                          </h3>
                        </div>
                        <label style={{
                          backgroundColor: '#0EA5E9', color: '#fff', borderRadius: '8px',
                          padding: '8px 18px', fontSize: '0.85rem', fontWeight: 700,
                          cursor: uploading ? 'not-allowed' : 'pointer',
                          opacity: uploading ? 0.7 : 1,
                          whiteSpace: 'nowrap',
                        }}>
                          {uploading ? 'Subiendo...' : '+ Subir foto'}
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

                      <div style={{ padding: '1.25rem' }}>
                        {imagenes.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '3rem 1rem', border: '1px dashed #e5e7eb', borderRadius: '10px', color: '#9ca3af', backgroundColor: '#f9fafb' }}>
                            <p style={{ margin: 0 }}>Sin fotos todavía. Subí la primera.</p>
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '1rem' }}>
                            {imagenes.map((img, idx) => {
                              const esPortada = idx === 0
                              return (
                                <div key={img.id} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', aspectRatio: '4/3', border: `2px solid ${esPortada ? '#10B981' : '#e5e7eb'}`, backgroundColor: '#f3f4f6' }}>
                                  <img
                                    src={resolveImageUrl(img.ruta_imagen, 'lugares-fotos')}
                                    alt=""
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />

                                  {/* ↑/↓ reorder buttons */}
                                  <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    {idx > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => handleMoverImagen(idx, -1)}
                                        style={{
                                          backgroundColor: 'rgba(17,24,39,0.72)', color: '#fff',
                                          border: 'none', borderRadius: '6px', width: '26px', height: '26px',
                                          cursor: 'pointer', display: 'flex', alignItems: 'center',
                                          justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800,
                                        }}
                                        aria-label="Mover arriba"
                                      >↑</button>
                                    )}
                                    {idx < imagenes.length - 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleMoverImagen(idx, 1)}
                                        style={{
                                          backgroundColor: 'rgba(17,24,39,0.72)', color: '#fff',
                                          border: 'none', borderRadius: '6px', width: '26px', height: '26px',
                                          cursor: 'pointer', display: 'flex', alignItems: 'center',
                                          justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800,
                                        }}
                                        aria-label="Mover abajo"
                                      >↓</button>
                                    )}
                                  </div>

                                  {/* Delete button */}
                                  <button
                                    type="button"
                                    onClick={() => handleEliminarFoto(img)}
                                    style={{
                                      position: 'absolute', top: '8px', right: '8px',
                                      backgroundColor: 'rgba(239,68,68,0.94)', color: '#fff',
                                      border: 'none', borderRadius: '999px', width: '28px', height: '28px',
                                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                                      justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800,
                                    }}
                                    aria-label="Eliminar foto"
                                  >×</button>

                                  {/* Portada badge / button */}
                                  {esPortada ? (
                                    <div style={{
                                      position: 'absolute', bottom: '8px', left: '8px',
                                      backgroundColor: 'rgba(16,185,129,0.94)', color: '#fff',
                                      fontSize: '0.7rem', fontWeight: 800, padding: '4px 9px',
                                      borderRadius: '999px', pointerEvents: 'none',
                                    }}>
                                      Portada
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleHacerPortada(img)}
                                      style={{
                                        position: 'absolute', bottom: '8px', left: '8px',
                                        backgroundColor: 'rgba(17,24,39,0.72)', color: '#fff',
                                        border: 'none', borderRadius: '999px', padding: '4px 9px',
                                        fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                                      }}
                                    >
                                      Hacer portada
                                    </button>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'resenas' && (
              <section style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827', margin: 0 }}>Moderación de Reseñas</h2>
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '4px 0 0' }}>{resenas.length} reseña{resenas.length !== 1 ? 's' : ''}</p>
                  </div>
                  <button type="button" onClick={cargarResenas} style={{ ...buttonBase, backgroundColor: '#f3f4f6', color: '#374151' }}>
                    Actualizar
                  </button>
                </div>

                {loadingResenas ? (
                  <p style={{ color: '#6b7280' }}>Cargando reseñas...</p>
                ) : resenas.length === 0 ? (
                  <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#9ca3af', border: '1px dashed #e5e7eb', borderRadius: '12px' }}>
                    No hay reseñas para moderar.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {resenas.map((resena) => {
                      const respuestaRows = respuestas[resena.id] ?? []
                      return (
                        <article key={resena.id} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem', backgroundColor: '#fff' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
                            <div>
                              <p style={{ margin: '0 0 4px', color: '#111827', fontWeight: 800 }}>{resena.titulo || 'Sin titulo'}</p>
                              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.82rem' }}>
                                {resena.usuarios?.nombre ?? 'Anonimo'} en {resena.lugares?.nombre ?? 'Lugar desconocido'} · {formatDateTime(resena.created_at)}
                              </p>
                              <p style={{ margin: '6px 0 0', color: '#f59e0b', fontWeight: 800 }}>
                                {'★'.repeat(Number(resena.estrellas ?? 0)) || 'Sin estrellas'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleEliminarResena(resena)}
                              style={{ ...buttonBase, backgroundColor: '#dc2626', color: '#fff', flexShrink: 0 }}
                            >
                              Eliminar reseña
                            </button>
                          </div>
                          <p style={{ color: '#374151', lineHeight: 1.6, margin: '12px 0 0', whiteSpace: 'pre-line' }}>{resena.contenido}</p>

                          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
                            <p style={{ margin: '0 0 0.75rem', color: '#6b7280', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                              Respuestas ({respuestaRows.length})
                            </p>
                            {respuestaRows.length === 0 ? (
                              <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.88rem' }}>Sin respuestas.</p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {respuestaRows.map((respuesta) => (
                                  <div key={respuesta.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px', padding: '0.85rem' }}>
                                    <div>
                                      <p style={{ margin: '0 0 4px', color: '#374151', fontSize: '0.82rem', fontWeight: 700 }}>
                                        {respuesta.usuarios?.nombre ?? 'Anonimo'}
                                      </p>
                                      <p style={{ margin: 0, color: '#4b5563', lineHeight: 1.5 }}>{respuesta.contenido}</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleEliminarRespuesta(respuesta, resena)}
                                      style={{ ...buttonBase, backgroundColor: '#fee2e2', color: '#b91c1c', flexShrink: 0 }}
                                    >
                                      Eliminar respuesta
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </section>
            )}

            {activeSection === 'bitacora' && (
              <section style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflowX: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827', margin: 0 }}>Bitácora de Cambios</h2>
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '4px 0 0' }}>{logs.length} registro{logs.length !== 1 ? 's' : ''}</p>
                  </div>
                  <button type="button" onClick={cargarLogs} style={{ ...buttonBase, backgroundColor: '#f3f4f6', color: '#374151' }}>
                    Actualizar
                  </button>
                </div>

                {loadingLogs ? (
                  <p style={{ color: '#6b7280' }}>Cargando bitácora...</p>
                ) : logs.length === 0 ? (
                  <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#9ca3af', border: '1px dashed #e5e7eb', borderRadius: '12px' }}>
                    No hay registros en la bitácora.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <th style={{ textAlign: 'left', padding: '10px', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>Fecha</th>
                        <th style={{ textAlign: 'left', padding: '10px', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>Acción</th>
                        <th style={{ textAlign: 'left', padding: '10px', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>Tabla</th>
                        <th style={{ textAlign: 'left', padding: '10px', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>Detalle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} style={{ borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' }}>
                          <td style={{ padding: '12px 10px', color: '#374151', fontSize: '0.86rem', whiteSpace: 'nowrap' }}>{formatDateTime(log.created_at)}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <span style={actionBadgeStyle(log.accion)}>{log.accion}</span>
                          </td>
                          <td style={{ padding: '12px 10px', color: '#111827', fontWeight: 700 }}>{log.tabla}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.78rem', color: '#374151', backgroundColor: '#f9fafb', borderRadius: '8px', padding: '10px' }}>
                              {prettyJson(log.detalle)}
                            </pre>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            )}
          </main>
        </div>
      </div>

      {confirmDelete && lugarSeleccionado && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          backgroundColor: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '16px', padding: '1.75rem',
            maxWidth: '420px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', margin: '0 0 0.75rem' }}>
              Eliminar lugar
            </h3>
            <p style={{ fontSize: '0.92rem', color: '#374151', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
              ¿Estás seguro de que querés eliminar <strong>{lugarSeleccionado.nombre}</strong>? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deletingLugar}
                style={{ ...buttonBase, backgroundColor: '#f3f4f6', color: '#374151' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEliminarLugar}
                disabled={deletingLugar}
                style={{ ...buttonBase, backgroundColor: '#DC2626', color: '#fff', opacity: deletingLugar ? 0.7 : 1 }}
              >
                {deletingLugar ? 'Eliminando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
