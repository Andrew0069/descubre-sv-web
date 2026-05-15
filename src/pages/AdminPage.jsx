import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  bloquearUsuario,
  desbloquearUsuario,
  eliminarUsuarioPerfil,
  getUsuarioAdmin,
  getUsuarioId,
  getUsuariosAdmin,
  resetearIntentosUsuario,
} from '../services/usuariosService'
import { getLugaresAdmin, createLugar, updateLugar, deleteLugar, updateImagenPrincipal } from '../services/lugaresService'
import { getResenasAdmin, deleteResena } from '../services/resenasService'
import { getImagenesByLugar, createImagenLugar, deleteImagen, swapImagenOrden, reorderImagenes } from '../services/imagenesService'
import { createNotificacion } from '../services/notificacionesService'
import Toast from '../components/Toast'
import { resolveImageUrl } from '../lib/imageUrl'
import EditLugarForm from '../components/EditLugarForm'
import NewLugarForm, { DEPARTAMENTOS } from '../components/NewLugarForm'
import { createEmptyTravelerInfo, sanitizeTravelerInfo } from '../lib/travelerInfo'

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
  info_viajero: createEmptyTravelerInfo(),
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

function suggestionBadgeStyle(state) {
  const colors = {
    aprobada: { backgroundColor: 'rgba(16,185,129,0.12)', color: '#059669' },
    denegada: { backgroundColor: 'rgba(239,68,68,0.12)', color: '#dc2626' },
    pendiente: { backgroundColor: 'rgba(245,158,11,0.12)', color: '#d97706' },
  }
  return {
    ...(colors[state] ?? colors.pendiente),
    borderRadius: '999px',
    padding: '5px 10px',
    fontSize: '0.74rem',
    fontWeight: 800,
    display: 'inline-flex',
  }
}

function normalizeSuggestionState(state) {
  const normalized = String(state || '').trim().toLowerCase()
  if (normalized === 'aprobada' || normalized === 'aprobado') return 'aprobada'
  if (normalized === 'denegada' || normalized === 'rechazada' || normalized === 'rechazado') return 'denegada'
  return 'pendiente'
}

function getPersistedSuggestionState(state) {
  return normalizeSuggestionState(state) === 'denegada' ? 'rechazada' : normalizeSuggestionState(state)
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
    direccion: '',
    categoria_id: '',
    nueva_categoria_nombre: '',
    categoria_color: DEFAULT_CATEGORY_COLOR,
    nueva_categoria_color: DEFAULT_CATEGORY_COLOR,
    precio_entrada: '',
    subtipo: '',
    destacado: false,
    latitud: '',
    longitud: '',
    horarios: null,
    info_viajero: createEmptyTravelerInfo(),
  })
  const [imagenes, setImagenes] = useState([])
  const [resenas, setResenas] = useState([])
  const [respuestas, setRespuestas] = useState({})
  const [sugerencias, setSugerencias] = useState([])
  const [logs, setLogs] = useState([])
  const [loadingResenas, setLoadingResenas] = useState(false)
  const [loadingSugerencias, setLoadingSugerencias] = useState(false)
  const [moderatingSuggestionId, setModeratingSuggestionId] = useState(null)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [securityLogs, setSecurityLogs] = useState([])
  const [loadingSecurityLogs, setLoadingSecurityLogs] = useState(false)
  const [securityFilter, setSecurityFilter] = useState('todos')
  const [usuarios, setUsuarios] = useState([])
  const [loadingUsuarios, setLoadingUsuarios] = useState(false)
  const [userActionId, setUserActionId] = useState(null)
  const [userSearch, setUserSearch] = useState('')
  const [confirmEliminarUser, setConfirmEliminarUser] = useState(null)
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
    const { data, error } = await getResenasAdmin()

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
      .select('id, resena_id, usuario_id, contenido, created_at, parent_respuesta_id, usuarios(nombre)')
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

  const cargarSugerencias = useCallback(async () => {
    setLoadingSugerencias(true)
    try {
      const nowIso = new Date().toISOString()
      const { data, error } = await supabase
        .from('sugerencias')
        .select('id, nombre, ubicacion, descripcion, motivo_recomendacion, nombre_contacto, email, estado, created_at, usuario_id')
        .lte('created_at', nowIso)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSugerencias((data ?? []).map((item) => ({
        ...item,
        estado: normalizeSuggestionState(item.estado),
      })))
    } catch (error) {
      console.error(error)
      showToast('Error al cargar sugerencias')
      setSugerencias([])
    }

    setLoadingSugerencias(false)
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
    cargarSugerencias()
  }, [cargarCategorias, cargarLugares, cargarSugerencias, checking])

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
    if (checking || activeSection !== 'sugerencias') return
    cargarSugerencias()
  }, [activeSection, cargarSugerencias, checking])

  useEffect(() => {
    if (checking || activeSection !== 'bitacora') return
    cargarLogs()
  }, [activeSection, cargarLogs, checking])

  const cargarUsuarios = useCallback(async () => {
    setLoadingUsuarios(true)
    const { data, error } = await getUsuariosAdmin()

    if (error) {
      console.error(error)
      showToast('Error al cargar usuarios')
      setUsuarios([])
    } else {
      setUsuarios(data ?? [])
    }

    setLoadingUsuarios(false)
  }, [showToast])

  useEffect(() => {
    if (checking || activeSection !== 'usuarios') return
    cargarUsuarios()
  }, [activeSection, cargarUsuarios, checking])

  const cargarSecurityLogs = useCallback(async () => {
    setLoadingSecurityLogs(true)
    const { data } = await supabase
      .from('security_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    setSecurityLogs(data ?? [])
    setLoadingSecurityLogs(false)
  }, [])

  useEffect(() => {
    if (checking || activeSection !== 'seguridad') return
    cargarSecurityLogs()
  }, [activeSection, cargarSecurityLogs, checking])

  const handleToggleFlag = async (log) => {
    await supabase.from('security_logs').update({ flagged: !log.flagged }).eq('id', log.id)
    setSecurityLogs(prev => prev.map(l => l.id === log.id ? { ...l, flagged: !l.flagged } : l))
  }

  const updateUsuarioLocalState = useCallback((userId, changes) => {
    setUsuarios((prev) => prev.map((user) => (
      user.id === userId ? { ...user, ...changes } : user
    )))
  }, [])

  const handleBloquearUsuario = useCallback(async (user, detail = {}) => {
    if (!user?.id) return false
    setUserActionId(user.id)

    const { error } = await bloquearUsuario(user.id)
    if (error) {
      console.error(error)
      showToast('No se pudo bloquear el usuario')
      setUserActionId(null)
      return false
    }

    updateUsuarioLocalState(user.id, { bloqueado: true })

    const { error: logError } = await insertAdminLog({
      accion: 'UPDATE',
      tabla: 'usuarios',
      registro_id: user.id,
      detalle: {
        accion_admin: 'bloquear_usuario',
        email: user.email ?? null,
        ...detail,
      },
    })

    if (logError) showToast('Usuario bloqueado, pero no se pudo registrar en bitácora')
    else showToast('Usuario bloqueado')

    setUserActionId(null)
    return true
  }, [insertAdminLog, showToast, updateUsuarioLocalState])

  const handleDesbloquearUsuario = useCallback(async (user) => {
    if (!user?.id) return
    setUserActionId(user.id)

    const { error: unlockError } = await desbloquearUsuario(user.id)
    if (unlockError) {
      console.error(unlockError)
      showToast('No se pudo desbloquear el usuario')
      setUserActionId(null)
      return
    }

    const { error: resetError } = await resetearIntentosUsuario(user.id)
    if (resetError) {
      console.error(resetError)
      showToast('Se desbloqueó, pero no se reiniciaron los intentos')
    } else {
      showToast('Usuario desbloqueado')
    }

    updateUsuarioLocalState(user.id, { bloqueado: false })

    const { error: logError } = await insertAdminLog({
      accion: 'UPDATE',
      tabla: 'usuarios',
      registro_id: user.id,
      detalle: {
        accion_admin: 'desbloquear_usuario',
        email: user.email ?? null,
      },
    })

    if (logError) showToast('Usuario desbloqueado, pero no se pudo registrar en bitácora')

    setUserActionId(null)
  }, [insertAdminLog, showToast, updateUsuarioLocalState])

  const handleResetearIntentosUsuario = useCallback(async (user) => {
    if (!user?.id) return
    setUserActionId(user.id)

    const { error } = await resetearIntentosUsuario(user.id)
    if (error) {
      console.error(error)
      showToast('No se pudieron reiniciar los intentos')
      setUserActionId(null)
      return
    }

    const { error: logError } = await insertAdminLog({
      accion: 'UPDATE',
      tabla: 'usuarios',
      registro_id: user.id,
      detalle: {
        accion_admin: 'resetear_intentos',
        email: user.email ?? null,
      },
    })

    if (logError) showToast('Intentos reiniciados, pero no se pudo registrar en bitácora')
    else showToast('Intentos reiniciados')

    setUserActionId(null)
  }, [insertAdminLog, showToast])

  const handleEliminarUsuario = useCallback(async (user) => {
    if (!user?.id) return
    setUserActionId(user.id)
    setConfirmEliminarUser(null)

    await insertAdminLog({
      accion: 'DELETE',
      tabla: 'usuarios',
      registro_id: user.id,
      detalle: {
        accion_admin: 'eliminar_perfil',
        email: user.email ?? null,
        username: user.username ?? null,
        nombre: user.nombre ?? null,
      },
    })

    const { error } = await eliminarUsuarioPerfil(user.id)
    if (error) {
      console.error(error)
      showToast('No se pudo eliminar el perfil')
      setUserActionId(null)
      return
    }

    setUsuarios((prev) => prev.filter((u) => u.id !== user.id))
    showToast('Perfil eliminado')
    setUserActionId(null)
  }, [insertAdminLog, showToast])

  const handleBloquearUsuarioSecurity = async (log) => {
    if (!log.usuario_db_id) return
    await handleBloquearUsuario(
      { id: log.usuario_db_id, email: log.email ?? null },
      { motivo: 'seguridad', security_log_id: log.id },
    )
  }

  const cargarImagenes = useCallback(async (lugarId) => {
    const { data } = await getImagenesByLugar(lugarId)
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
        direccion: '',
        categoria_id: '',
        nueva_categoria_nombre: '',
        categoria_color: DEFAULT_CATEGORY_COLOR,
        nueva_categoria_color: DEFAULT_CATEGORY_COLOR,
        precio_entrada: '',
        subtipo: '',
        destacado: false,
        latitud: '',
        longitud: '',
        horarios: null,
        info_viajero: createEmptyTravelerInfo(),
      })
      return
    }

    const categoria = categorias.find((item) => item.id === lugarSeleccionado.categoria_id)
    setFormData({
      nombre: lugarSeleccionado.nombre ?? '',
      descripcion: lugarSeleccionado.descripcion ?? '',
      direccion: lugarSeleccionado.direccion ?? '',
      categoria_id: lugarSeleccionado.categoria_id ?? '',
      nueva_categoria_nombre: '',
      categoria_color: categoria?.color || DEFAULT_CATEGORY_COLOR,
      nueva_categoria_color: DEFAULT_CATEGORY_COLOR,
      precio_entrada: lugarSeleccionado.precio_entrada ?? '',
      subtipo: lugarSeleccionado.subtipo ?? '',
      destacado: lugarSeleccionado.destacado ?? false,
      latitud: lugarSeleccionado.latitud ?? '',
      longitud: lugarSeleccionado.longitud ?? '',
      horarios: lugarSeleccionado.horarios ?? null,
      info_viajero: lugarSeleccionado.info_viajero ?? createEmptyTravelerInfo(),
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

  const handleTravelerInfoChange = (nextValue) => {
    setFormData((prev) => ({ ...prev, info_viajero: nextValue }))
  }

  const handleNewTravelerInfoChange = (nextValue) => {
    setNewLugarForm((prev) => ({ ...prev, info_viajero: nextValue }))
  }

  const handleCancelarEdicion = () => {
    if (!lugarSeleccionado) return
    const categoria = categorias.find((item) => item.id === lugarSeleccionado.categoria_id)
    setFormData({
      nombre: lugarSeleccionado.nombre ?? '',
      descripcion: lugarSeleccionado.descripcion ?? '',
      direccion: lugarSeleccionado.direccion ?? '',
      categoria_id: lugarSeleccionado.categoria_id ?? '',
      nueva_categoria_nombre: '',
      categoria_color: categoria?.color || DEFAULT_CATEGORY_COLOR,
      nueva_categoria_color: DEFAULT_CATEGORY_COLOR,
      precio_entrada: lugarSeleccionado.precio_entrada ?? '',
      subtipo: lugarSeleccionado.subtipo ?? '',
      destacado: lugarSeleccionado.destacado ?? false,
      latitud: lugarSeleccionado.latitud ?? '',
      longitud: lugarSeleccionado.longitud ?? '',
      horarios: lugarSeleccionado.horarios ?? null,
      info_viajero: lugarSeleccionado.info_viajero ?? createEmptyTravelerInfo(),
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
      info_viajero: sanitizeTravelerInfo(newLugarForm.info_viajero),
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
      direccion: formData.direccion?.trim() || null,
      categoria_id: categoriaId || null,
      precio_entrada: formData.precio_entrada,
      subtipo: formData.subtipo || null,
      destacado: formData.destacado,
      latitud: formData.latitud !== '' ? Number(formData.latitud) : null,
      longitud: formData.longitud !== '' ? Number(formData.longitud) : null,
      info_viajero: sanitizeTravelerInfo(formData.info_viajero),
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

    const { data: imgs } = await getImagenesByLugar(lugarSeleccionado.id)

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
      detalle: {
        nombre: lugarSeleccionado.nombre,
        descripcion: lugarSeleccionado.descripcion ?? null,
        direccion: lugarSeleccionado.direccion ?? null,
        departamento: lugarSeleccionado.departamentos?.nombre ?? null,
        departamento_id: lugarSeleccionado.departamento_id ?? null,
        categoria: lugarSeleccionado.categorias?.nombre ?? null,
        categoria_id: lugarSeleccionado.categoria_id ?? null,
        precio_entrada: lugarSeleccionado.precio_entrada ?? null,
        subtipo: lugarSeleccionado.subtipo ?? null,
        destacado: lugarSeleccionado.destacado ?? false,
        latitud: lugarSeleccionado.latitud ?? null,
        longitud: lugarSeleccionado.longitud ?? null,
        horarios: lugarSeleccionado.horarios ?? null,
        imagen_principal: lugarSeleccionado.imagen_principal ?? null,
        imagenes_eliminadas: paths.length,
      },
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

    const { error: insertError, data: imagenInsertada } = await createImagenLugar({
      lugar_id: lugarSeleccionado.id,
      ruta_imagen: urlData.publicUrl,
      usuario_id: adminId,
      orden: imagenes.length,
    })

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
    const { error } = await deleteImagen(imagen.id)
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

    const { errorA, errorB } = await swapImagenOrden(imgA.id, ordenB, imgB.id, ordenA)

    if (errorA || errorB) {
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

    await reorderImagenes(updates)

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

  const handleModerateSuggestion = useCallback(async (suggestion, nextState) => {
    if (!suggestion?.id || !adminId || moderatingSuggestionId) return

    setModeratingSuggestionId(suggestion.id)

    const persistedNextState = getPersistedSuggestionState(nextState)
    let draftLugar = null

    if (persistedNextState === 'aprobada') {
      const payload = {
        nombre: suggestion.nombre?.trim() || 'Lugar sin nombre',
        direccion: suggestion.ubicacion?.trim() || null,
        descripcion: suggestion.descripcion?.trim() || suggestion.motivo_recomendacion?.trim() || '',
        usuario_id: suggestion.usuario_id ?? null,
        aprobado: false,
        destacado: false,
        categoria_id: null,
        departamento_id: null,
        precio_entrada: null,
        subtipo: null,
        latitud: null,
        longitud: null,
        promedio_estrellas: 0,
        total_resenas: 0,
      }

      const { data: createdLugar, error: createError } = await createLugar(payload)
      if (createError || !createdLugar) {
        console.error(createError)
        showToast('Error al crear el borrador del lugar')
        setModeratingSuggestionId(null)
        return
      }

      draftLugar = createdLugar
    }

    let appliedState = persistedNextState
    let { error: updateError } = await supabase
      .from('sugerencias')
      .update({ estado: appliedState })
      .eq('id', suggestion.id)

    if (updateError && persistedNextState === 'rechazada') {
      appliedState = 'denegada'
      const fallback = await supabase
        .from('sugerencias')
        .update({ estado: appliedState })
        .eq('id', suggestion.id)
      updateError = fallback.error
    }

    if (updateError) {
      console.error(updateError)
      showToast(`Error al ${persistedNextState === 'aprobada' ? 'aprobar' : 'rechazar'} la sugerencia`)
      setModeratingSuggestionId(null)
      return
    }

    const persistedState = normalizeSuggestionState(appliedState)

    await insertAdminLog({
      accion: 'UPDATE',
      tabla: 'sugerencias',
      registro_id: suggestion.id,
      detalle: {
        nombre: suggestion.nombre,
        estado: persistedState,
        borrador_lugar_id: draftLugar?.id ?? null,
      },
    })

    if (draftLugar) {
      await insertAdminLog({
        accion: 'CREATE',
        tabla: 'lugares',
        registro_id: draftLugar.id,
        detalle: {
          origen: 'sugerencia_aprobada',
          sugerencia_id: suggestion.id,
          nombre: draftLugar.nombre,
        },
      })
    }

    if (suggestion.usuario_id) {
      const { error: notifError } = await createNotificacion({
        usuario_id: suggestion.usuario_id,
        tipo: persistedNextState === 'aprobada' ? 'sugerencia_aprobada' : 'sugerencia_rechazada',
      })
      if (notifError) {
        console.error('[sugerencias] notif error:', notifError)
      }
    }

    setSugerencias((prev) => prev.map((item) => (
      item.id === suggestion.id ? { ...item, estado: persistedState } : item
    )))

    if (draftLugar) {
      setLugares((prev) => [...prev, draftLugar].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '')))
    }

    showToast(persistedNextState === 'aprobada' ? 'Sugerencia aprobada y borrador creado' : 'Sugerencia rechazada')
    setModeratingSuggestionId(null)
  }, [adminId, insertAdminLog, moderatingSuggestionId, showToast])

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

    const { error: deleteError } = await deleteResena(resena.id)
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
    { id: 'sugerencias', label: `Sugerencias (${sugerencias.filter((s) => (s.estado || 'pendiente') === 'pendiente').length})` },
    { id: 'usuarios', label: `Usuarios (${usuarios.length})` },
    { id: 'resenas', label: 'Reseñas' },
    { id: 'bitacora', label: 'Bitácora' },
    { id: 'seguridad', label: 'Seguridad' },
  ]

  const filteredUsuarios = usuarios.filter((user) => {
    const query = userSearch.trim().toLowerCase()
    if (!query) return true

    return [user.nombre, user.email, user.username]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  })

  return (
    <div className="admin-page">
      <Toast msg={toast} />

      {confirmEliminarUser && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '14px', padding: '2rem',
            maxWidth: '420px', width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginTop: 0 }}>
              Eliminar perfil
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.5 }}>
              ¿Estás seguro que deseas eliminar el perfil de{' '}
              <strong>{confirmEliminarUser.nombre || confirmEliminarUser.username || confirmEliminarUser.email}</strong>?
            </p>
            <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '1.5rem' }}>
              El usuario deberá crear una nueva cuenta. La acción quedará registrada en la bitácora.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setConfirmEliminarUser(null)}
                style={{ ...buttonBase, backgroundColor: '#f3f4f6', color: '#374151' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={userActionId === confirmEliminarUser.id}
                onClick={() => handleEliminarUsuario(confirmEliminarUser)}
                style={{
                  ...buttonBase,
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  opacity: userActionId === confirmEliminarUser.id ? 0.7 : 1,
                }}
              >
                {userActionId === confirmEliminarUser.id ? 'Eliminando...' : 'Confirmar eliminación'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-container">
        <div className="admin-topbar">
          <div>
            <h1 className="admin-topbar__title">
              Panel Admin —{' '}
              <svg viewBox="0 0 200 48" height="36" xmlns="http://www.w3.org/2000/svg" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
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
            <p className="admin-topbar__subtitle">Gestión de lugares, usuarios, sugerencias, reseñas y bitácora</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="admin-pill-secondary"
          >
            ← Volver al sitio
          </button>
        </div>

        <div className="admin-layout">
          <aside className="admin-sidebar">
            <p className="admin-eyebrow">Admin</p>
            <nav className="admin-sidebar__nav">
              {sidebarItems.map((item) => (
                <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`admin-tab${activeSection === item.id ? ' is-active' : ''}`}
                  >
                    {item.label}
                  </button>
                  {item.id === 'lugares' && (
                    <button
                      type="button"
                      onClick={handleActivarCreacionLugar}
                      className={`admin-cta-primary${isCreatingLugar ? ' is-active' : ''}`}
                    >
                      + Nuevo lugar
                    </button>
                  )}
                </div>
              ))}
            </nav>

            {activeSection === 'lugares' && (
              <div className="admin-sidebar__divider">
                <p className="admin-eyebrow">Lugares</p>
                <ul className="admin-place-list">
                  {lugares.map((l) => (
                    <li key={l.id} style={{ minWidth: 0 }}>
                      <button
                        type="button"
                        onClick={() => handleSeleccionarLugar(l)}
                        className={`admin-place-row${lugarSeleccionado?.id === l.id ? ' is-active' : ''}`}
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
              <div className="admin-panel">
                {isCreatingLugar ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="admin-panel__header">
                      <div>
                        <p className="admin-eyebrow">Crear lugar</p>
                        <h2 className="admin-title">Nuevo lugar</h2>
                        <p className="admin-subtitle">
                          Completa la información principal. Después podrás agregar fotos desde la edición del lugar.
                        </p>
                      </div>
                    </div>

                    <NewLugarForm
                      formData={newLugarForm}
                      categorias={categorias}
                      isSaving={creatingLugar}
                      onChange={handleNewLugarChange}
                      onTravelerInfoChange={handleNewTravelerInfoChange}
                      onToggleDestacado={handleToggleNewDestacado}
                      onSave={handleCrearLugar}
                      onCancel={handleCancelarCreacionLugar}
                    />
                  </div>
                ) : !lugarSeleccionado ? (
                  <div className="admin-empty">
                    <p className="admin-eyebrow">Lugares</p>
                    <p className="admin-empty__title">Selecciona un lugar</p>
                    <p className="admin-empty__body">Elige un lugar del sidebar para editar su información y galería.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="admin-panel__header">
                      <div>
                        <p className="admin-eyebrow">Editar lugar</p>
                        <h2 className="admin-title">{lugarSeleccionado.nombre}</h2>
                        <p className="admin-subtitle">
                          Actualiza los datos principales y administra las fotos del lugar.
                        </p>
                      </div>
                      <div className="admin-panel__header-actions">
                        <span className="admin-chip">
                          {imagenes.length} foto{imagenes.length !== 1 ? 's' : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(true)}
                          className="admin-pill-danger"
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
                      onTravelerInfoChange={handleTravelerInfoChange}
                      onToggleDestacado={handleToggleDestacado}
                      onSave={handleUpdateLugar}
                      onCancel={handleCancelarEdicion}
                    />

                    <section className="admin-gallery">
                      <div className="admin-gallery__header">
                        <div>
                          <p className="admin-eyebrow">Galería</p>
                          <h3 className="admin-title-sm">Fotos del lugar</h3>
                        </div>
                        <label className={`admin-cta-primary admin-cta-primary--inline${uploading ? ' is-loading' : ''}`}>
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

                      <div className="admin-gallery__body">
                        {imagenes.length === 0 ? (
                          <div className="admin-empty" style={{ padding: '2.5rem 1rem' }}>
                            <p className="admin-empty__title">Sin fotos todavía</p>
                            <p className="admin-empty__body">Subí la primera con el botón de arriba.</p>
                          </div>
                        ) : (
                          <div className="admin-gallery__grid">
                            {imagenes.map((img, idx) => {
                              const esPortada = idx === 0
                              return (
                                <div
                                  key={img.id}
                                  className={`admin-photo-card${esPortada ? ' is-cover' : ''}`}
                                  style={{ '--i': idx }}
                                >
                                  <img
                                    src={resolveImageUrl(img.ruta_imagen, 'lugares-fotos')}
                                    alt=""
                                  />

                                  {/* ↑/↓ reorder buttons */}
                                  <div className="admin-photo-reorder">
                                    {idx > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => handleMoverImagen(idx, -1)}
                                        className="admin-photo-btn"
                                        aria-label="Mover arriba"
                                      >↑</button>
                                    )}
                                    {idx < imagenes.length - 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleMoverImagen(idx, 1)}
                                        className="admin-photo-btn"
                                        aria-label="Mover abajo"
                                      >↓</button>
                                    )}
                                  </div>

                                  {/* Delete button */}
                                  <button
                                    type="button"
                                    onClick={() => handleEliminarFoto(img)}
                                    className="admin-photo-btn--danger"
                                    aria-label="Eliminar foto"
                                  >×</button>

                                  {/* Portada badge / button */}
                                  {esPortada ? (
                                    <div className="admin-photo-badge">Portada</div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleHacerPortada(img)}
                                      className="admin-photo-btn--ghost"
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

                    {/* ── Horarios ── */}
                    {lugarSeleccionado && (() => {
                      const dias = [
                        { key: 'lunes', label: 'Lunes' },
                        { key: 'martes', label: 'Martes' },
                        { key: 'miercoles', label: 'Miércoles' },
                        { key: 'jueves', label: 'Jueves' },
                        { key: 'viernes', label: 'Viernes' },
                        { key: 'sabado', label: 'Sábado' },
                        { key: 'domingo', label: 'Domingo' },
                      ]
                      const handleHorarioChange = (dia, campo, valor) => {
                        setFormData(prev => {
                          const diaActual = (prev.horarios || {})[dia] || { abierto: false, abre: '09:00', cierra: '18:00' }
                          return {
                            ...prev,
                            horarios: { ...prev.horarios, [dia]: { ...diaActual, [campo]: valor } }
                          }
                        })
                      }
                      const handleGuardarHorarios = async () => {
                        const { error } = await supabase
                          .from('lugares')
                          .update({ horarios: formData.horarios })
                          .eq('id', lugarSeleccionado.id)
                        if (error) { alert('Error al guardar horarios'); return }
                        alert('Horarios guardados ✓')
                      }
                      const es24Horas = (formData.horarios || {}).es24Horas || false;
                      const handleEs24HorasChange = (e) => {
                        const checked = e.target.checked;
                        setFormData(prev => ({
                          ...prev,
                          horarios: { ...(prev.horarios || {}), es24Horas: checked }
                        }))
                      }
                      return (
                        <section className="admin-hours">
                          <div className="admin-hours__header">
                            <p className="admin-eyebrow" style={{ margin: 0 }}>Horarios</p>
                            <h3 className="admin-title-sm">🕐 Horarios (GMT-6)</h3>
                          </div>

                          <label className="admin-hours__24h">
                            <input
                              type="checkbox"
                              checked={es24Horas}
                              onChange={handleEs24HorasChange}
                              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#f59e0b' }}
                            />
                            Abierto 24 horas
                          </label>

                          {!es24Horas && (
                            <div className="admin-hours__list">
                              {dias.map(({ key, label }) => {
                                const d = (formData.horarios || {})[key] || { abierto: false, abre: '09:00', cierra: '18:00' }
                                return (
                                  <div key={key} className="admin-hours-row">
                                    <span className="admin-hours-row__label">{label}</span>
                                    <label className={`admin-hours-row__toggle${d.abierto ? ' is-on' : ''}`}>
                                      <input
                                        type="checkbox"
                                        checked={d.abierto || false}
                                        onChange={(e) => handleHorarioChange(key, 'abierto', e.target.checked)}
                                        style={{ accentColor: '#16a34a' }}
                                      />
                                      <span>
                                        {d.abierto ? 'Abierto' : 'Cerrado'}
                                      </span>
                                    </label>
                                    {d.abierto && (
                                      <>
                                        <input
                                          type="time"
                                          value={d.abre || '09:00'}
                                          onChange={(e) => handleHorarioChange(key, 'abre', e.target.value)}
                                          className="admin-time-input"
                                        />
                                        <span className="admin-hours-row__dash">–</span>
                                        <input
                                          type="time"
                                          value={d.cierra || '18:00'}
                                          onChange={(e) => handleHorarioChange(key, 'cierra', e.target.value)}
                                          className="admin-time-input"
                                        />
                                      </>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                          <button
                            onClick={handleGuardarHorarios}
                            className="admin-cta-primary admin-cta-primary--inline"
                            style={{ marginTop: '20px' }}
                          >
                            Guardar horarios
                          </button>
                        </section>
                      )
                    })()}
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

            {activeSection === 'sugerencias' && (
              <section style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827', margin: 0 }}>Moderación de Sugerencias</h2>
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '4px 0 0' }}>
                      {sugerencias.filter((s) => (s.estado || 'pendiente') === 'pendiente').length} pendiente{sugerencias.filter((s) => (s.estado || 'pendiente') === 'pendiente').length !== 1 ? 's' : ''} de {sugerencias.length}
                    </p>
                  </div>
                  <button type="button" onClick={cargarSugerencias} style={{ ...buttonBase, backgroundColor: '#f3f4f6', color: '#374151' }}>
                    Actualizar
                  </button>
                </div>

                {loadingSugerencias ? (
                  <p style={{ color: '#6b7280' }}>Cargando sugerencias...</p>
                ) : sugerencias.length === 0 ? (
                  <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#9ca3af', border: '1px dashed #e5e7eb', borderRadius: '12px' }}>
                    No hay sugerencias por revisar.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {sugerencias.map((suggestion) => {
                      const state = suggestion.estado || 'pendiente'
                      const isPending = state === 'pendiente'
                      const isWorking = moderatingSuggestionId === suggestion.id

                      return (
                        <article
                          key={suggestion.id}
                          style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: '14px',
                            padding: '1rem 1rem 1.1rem',
                            backgroundColor: '#fff',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '0.45rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#111827' }}>{suggestion.nombre || 'Lugar sin nombre'}</h3>
                                <span style={suggestionBadgeStyle(state)}>
                                  {state === 'aprobada' ? 'Aprobada' : state === 'denegada' ? 'Denegada' : 'Pendiente'}
                                </span>
                              </div>
                              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.84rem' }}>
                                {suggestion.ubicacion ? `${suggestion.ubicacion} · ` : ''}{formatDateTime(suggestion.created_at)}
                              </p>
                            </div>

                            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                disabled={!isPending || isWorking}
                                onClick={() => handleModerateSuggestion(suggestion, 'aprobada')}
                                style={{
                                  ...buttonBase,
                                  backgroundColor: isPending ? '#0EA5E9' : '#e5e7eb',
                                  color: isPending ? '#fff' : '#9ca3af',
                                  opacity: isWorking ? 0.7 : 1,
                                }}
                              >
                                {isWorking && isPending ? 'Procesando...' : 'Aprobar'}
                              </button>
                              <button
                                type="button"
                                disabled={!isPending || isWorking}
                                onClick={() => handleModerateSuggestion(suggestion, 'rechazada')}
                                style={{
                                  ...buttonBase,
                                  backgroundColor: isPending ? 'rgba(239,68,68,0.12)' : '#f3f4f6',
                                  color: isPending ? '#dc2626' : '#9ca3af',
                                  opacity: isWorking ? 0.7 : 1,
                                }}
                              >
                                Rechazar
                              </button>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gap: '0.9rem', marginTop: '1rem' }}>
                            {suggestion.descripcion && (
                              <div style={{ padding: '0.9rem 1rem', borderRadius: '12px', backgroundColor: '#f9fafb', border: '1px solid #f3f4f6' }}>
                                <p style={{ margin: '0 0 0.35rem', color: '#111827', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Descripción</p>
                                <p style={{ margin: 0, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{suggestion.descripcion}</p>
                              </div>
                            )}

                            {suggestion.motivo_recomendacion && (
                              <div style={{ padding: '0.9rem 1rem', borderRadius: '12px', backgroundColor: 'rgba(14,165,233,0.04)', border: '1px solid rgba(14,165,233,0.1)' }}>
                                <p style={{ margin: '0 0 0.35rem', color: '#0EA5E9', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Por qué lo recomienda</p>
                                <p style={{ margin: 0, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{suggestion.motivo_recomendacion}</p>
                              </div>
                            )}

                            {(suggestion.nombre_contacto || suggestion.email) && (
                              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                {suggestion.nombre_contacto && (
                                  <span style={{ padding: '0.5rem 0.8rem', borderRadius: '999px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151', fontSize: '0.84rem', fontWeight: 600 }}>
                                    Contacto: {suggestion.nombre_contacto}
                                  </span>
                                )}
                                {suggestion.email && (
                                  <span style={{ padding: '0.5rem 0.8rem', borderRadius: '999px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151', fontSize: '0.84rem', fontWeight: 600 }}>
                                    Email: {suggestion.email}
                                  </span>
                                )}
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

            {activeSection === 'usuarios' && (
              <section style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflowX: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827', margin: 0 }}>Gestión de Usuarios</h2>
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '4px 0 0' }}>{filteredUsuarios.length} usuario{filteredUsuarios.length !== 1 ? 's' : ''} visible{filteredUsuarios.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                      type="search"
                      placeholder="Buscar por nombre, correo o username"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      style={{
                        minWidth: '260px',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.85rem',
                        color: '#111827',
                      }}
                    />
                    <button type="button" onClick={cargarUsuarios} style={{ ...buttonBase, backgroundColor: '#f3f4f6', color: '#374151' }}>
                      Actualizar
                    </button>
                  </div>
                </div>

                {loadingUsuarios ? (
                  <p style={{ color: '#6b7280' }}>Cargando usuarios...</p>
                ) : filteredUsuarios.length === 0 ? (
                  <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#9ca3af', border: '1px dashed #e5e7eb', borderRadius: '12px' }}>
                    {usuarios.length === 0 ? 'No hay usuarios para mostrar.' : 'No hay usuarios que coincidan con la búsqueda.'}
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '920px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <th style={{ textAlign: 'left', padding: '10px', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>Usuario</th>
                        <th style={{ textAlign: 'left', padding: '10px', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>Correo</th>
                        <th style={{ textAlign: 'left', padding: '10px', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>Estado</th>
                        <th style={{ textAlign: 'left', padding: '10px', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>Rol</th>
                        <th style={{ textAlign: 'left', padding: '10px', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>Registro</th>
                        <th style={{ textAlign: 'left', padding: '10px', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsuarios.map((user) => {
                        const isWorking = userActionId === user.id

                        return (
                          <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' }}>
                            <td style={{ padding: '12px 10px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <span style={{ color: '#111827', fontWeight: 700, fontSize: '0.88rem' }}>{user.nombre || 'Sin nombre'}</span>
                                <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>@{user.username || 'sin-username'}</span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 10px', color: '#374151', fontSize: '0.84rem' }}>{user.email || 'Sin correo'}</td>
                            <td style={{ padding: '12px 10px' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                borderRadius: '999px',
                                padding: '5px 10px',
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                backgroundColor: user.bloqueado ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                                color: user.bloqueado ? '#dc2626' : '#059669',
                              }}>
                                {user.bloqueado ? 'Bloqueado' : 'Activo'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 10px', color: '#374151', fontSize: '0.84rem', fontWeight: 600 }}>
                              {user.is_admin ? 'Admin' : 'Usuario'}
                            </td>
                            <td style={{ padding: '12px 10px', color: '#374151', fontSize: '0.84rem', whiteSpace: 'nowrap' }}>
                              {formatDateTime(user.created_at)}
                            </td>
                            <td style={{ padding: '12px 10px' }}>
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {user.bloqueado ? (
                                  <button
                                    type="button"
                                    disabled={isWorking}
                                    onClick={() => handleDesbloquearUsuario(user)}
                                    style={{
                                      ...buttonBase,
                                      backgroundColor: 'rgba(16,185,129,0.12)',
                                      color: '#059669',
                                      opacity: isWorking ? 0.7 : 1,
                                    }}
                                  >
                                    {isWorking ? 'Procesando...' : 'Desbloquear'}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={isWorking}
                                    onClick={() => handleBloquearUsuario(user)}
                                    style={{
                                      ...buttonBase,
                                      backgroundColor: '#fef2f2',
                                      color: '#dc2626',
                                      opacity: isWorking ? 0.7 : 1,
                                    }}
                                  >
                                    {isWorking ? 'Procesando...' : 'Bloquear'}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={isWorking}
                                  onClick={() => handleResetearIntentosUsuario(user)}
                                  style={{
                                    ...buttonBase,
                                    backgroundColor: '#f3f4f6',
                                    color: '#374151',
                                    opacity: isWorking ? 0.7 : 1,
                                  }}
                                >
                                  Reiniciar intentos
                                </button>
                                {!user.is_admin && (
                                  <button
                                    type="button"
                                    disabled={isWorking}
                                    onClick={() => setConfirmEliminarUser(user)}
                                    style={{
                                      ...buttonBase,
                                      backgroundColor: '#fef2f2',
                                      color: '#991b1b',
                                      opacity: isWorking ? 0.7 : 1,
                                    }}
                                  >
                                    Eliminar perfil
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
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

            {activeSection === 'seguridad' && (
              <section style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflowX: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827', margin: 0 }}>Registros de Seguridad</h2>
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '4px 0 0' }}>{securityLogs.length} acceso{securityLogs.length !== 1 ? 's' : ''} recientes</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['todos', 'marcados', 'proxy'].map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setSecurityFilter(f)}
                        style={{
                          ...buttonBase,
                          backgroundColor: securityFilter === f ? '#0EA5E9' : '#f3f4f6',
                          color: securityFilter === f ? '#fff' : '#374151',
                          fontSize: '0.8rem', padding: '6px 14px',
                        }}
                      >
                        {f === 'todos' ? 'Todos' : f === 'marcados' ? 'Marcados' : 'Con proxy'}
                      </button>
                    ))}
                    <button type="button" onClick={cargarSecurityLogs} style={{ ...buttonBase, backgroundColor: '#f3f4f6', color: '#374151' }}>
                      Actualizar
                    </button>
                  </div>
                </div>

                {loadingSecurityLogs ? (
                  <p style={{ color: '#6b7280' }}>Cargando registros...</p>
                ) : securityLogs.length === 0 ? (
                  <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#9ca3af', border: '1px dashed #e5e7eb', borderRadius: '12px' }}>
                    No hay registros de seguridad aún.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        {['Fecha', 'Email', 'Evento', 'IP', 'País', 'Ciudad', 'GPS', 'Proxy', 'Acciones'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '10px', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {securityLogs
                        .filter(l => {
                          if (securityFilter === 'marcados') return l.flagged
                          if (securityFilter === 'proxy') return l.ip_is_proxy
                          return true
                        })
                        .map((log) => (
                          <tr key={log.id} style={{ borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle', backgroundColor: log.flagged ? '#fffbeb' : 'transparent' }}>
                            <td style={{ padding: '10px', fontSize: '0.82rem', color: '#374151', whiteSpace: 'nowrap' }}>{formatDateTime(log.created_at)}</td>
                            <td style={{ padding: '10px', fontSize: '0.82rem', color: '#111827', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.email ?? '—'}</td>
                            <td style={{ padding: '10px' }}>
                              <span style={{ ...actionBadgeStyle(log.event_type === 'login' ? 'INSERT' : 'UPDATE'), fontSize: '0.75rem' }}>{log.event_type}</span>
                            </td>
                            <td style={{ padding: '10px', fontSize: '0.82rem', color: '#374151', whiteSpace: 'nowrap' }}>{log.ip_address ?? '—'}</td>
                            <td style={{ padding: '10px', fontSize: '0.82rem', color: '#374151' }}>{log.ip_country_code ? `${log.ip_country_name} (${log.ip_country_code})` : '—'}</td>
                            <td style={{ padding: '10px', fontSize: '0.82rem', color: '#374151' }}>{log.ip_city ?? '—'}</td>
                            <td style={{ padding: '10px', fontSize: '0.82rem', color: '#374151', whiteSpace: 'nowrap' }}>
                              {log.gps_denied ? <span style={{ color: '#ef4444' }}>Denegado</span> : log.gps_lat ? `${log.gps_lat.toFixed(4)}, ${log.gps_lng.toFixed(4)}` : '—'}
                            </td>
                            <td style={{ padding: '10px' }}>
                              {log.ip_is_proxy ? <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>SÍ</span> : <span style={{ color: '#9ca3af', fontSize: '0.82rem' }}>No</span>}
                            </td>
                            <td style={{ padding: '10px' }}>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleFlag(log)}
                                  style={{ ...buttonBase, fontSize: '0.78rem', padding: '4px 10px', backgroundColor: log.flagged ? '#fef3c7' : '#f3f4f6', color: log.flagged ? '#92400e' : '#374151' }}
                                >
                                  {log.flagged ? '★ Marcado' : '☆ Marcar'}
                                </button>
                                {log.usuario_db_id && (
                                  <button
                                    type="button"
                                    onClick={() => handleBloquearUsuarioSecurity(log)}
                                    style={{ ...buttonBase, fontSize: '0.78rem', padding: '4px 10px', backgroundColor: '#fef2f2', color: '#dc2626' }}
                                  >
                                    Bloquear
                                  </button>
                                )}
                              </div>
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
