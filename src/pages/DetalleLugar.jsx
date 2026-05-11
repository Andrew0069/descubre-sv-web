import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { checkRateLimit } from '../lib/rateLimit'
import { resolveImageUrl } from '../lib/imageUrl'
import { getGradiente } from '../lib/categoriaVisual'
import { useIdioma } from '../lib/idiomaContext'
import { filterProfanity } from '../lib/profanityFilter'
import { getUsuarioId, getUsuarioPerfil } from '../services/usuariosService'
import { getLugarById } from '../services/lugaresService'
import { getFavoritoStatus, getFavoritosCount, addFavorito, removeFavorito } from '../services/favoritosService'
import {
  getLikesCountLugar, getUserLikeLugar, addLikeLugar, removeLikeLugar,
  addLikeResena, removeLikeResena, upsertRatingLugar, getAllResenaLikes, getMyResenaLikes
} from '../services/likesService'
import { getResenasByLugar, createResena } from '../services/resenasService'
import { createNotificacion } from '../services/notificacionesService'
import { getImagenesByLugar } from '../services/imagenesService'
import Loader from '../components/Loader'
import PhotoPickerSheet from '../components/PhotoPickerSheet'
import { formatRelativeEs } from '../lib/dateUtils'




function AvatarImg({ src, fallbackSrc, nombre, size = 36, fontSize = '0.85rem' }) {
  const [srcIndex, setSrcIndex] = useState(0)
  const inicial = (nombre || '?').charAt(0).toUpperCase()
  const sources = [src, fallbackSrc].filter(Boolean)
  const currentSrc = sources[srcIndex] || null

  useEffect(() => {
    setSrcIndex(0)
  }, [src, fallbackSrc])

  if (!currentSrc) {
    return (
      <div style={{
        width: `${size}px`, height: `${size}px`,
        borderRadius: '50%', backgroundColor: '#0EA5E9',
        color: '#ffffff', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize, fontWeight: 700, flexShrink: 0,
      }}>
        {inicial}
      </div>
    )
  }

  return (
    <img
      src={currentSrc}
      alt={nombre}
      referrerPolicy="no-referrer"
      onError={() => {
        if (srcIndex < sources.length - 1) {
          setSrcIndex((prev) => prev + 1)
        } else {
          setSrcIndex(sources.length)
        }
      }}
      style={{
        width: `${size}px`, height: `${size}px`,
        borderRadius: '50%', objectFit: 'cover',
        flexShrink: 0, border: '2px solid #e5e7eb',
      }}
    />
  )
}


function HeartIcon({ filled = false, size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? '#ef4444' : 'none'}
      stroke={filled ? '#ef4444' : 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function CategoryPill({ nombre }) {
  const bg = getGradiente(nombre)
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 14px',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: '#ffffff',
        background: bg,
        letterSpacing: '0.02em',
      }}
    >
      {nombre}
    </span>
  )
}

export default function DetalleLugar() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { idioma } = useIdioma()

  const t = {
    volver: idioma === 'en' ? '← Back' : '← Volver',
    sobre: idioma === 'en' ? 'About this place' : 'Sobre este lugar',
    ubicacion: idioma === 'en' ? '📍 Location' : '📍 Ubicación',
    resenas: idioma === 'en' ? 'Reviews' : 'Reseñas',
    escribir: idioma === 'en' ? 'Write a review' : 'Escribir reseña',
    primero: idioma === 'en' ? 'Be the first to review this place' : 'Sé el primero en reseñar este lugar',
    resena: idioma === 'en' ? 'review' : 'reseña',
    resenas2: idioma === 'en' ? 'reviews' : 'reseñas',
    anonimo: idioma === 'en' ? 'Anonymous' : 'Anónimo',
    sinDesc: idioma === 'en' ? 'No description available.' : 'Sin descripción disponible.',
    proximamente: idioma === 'en' ? 'Sign in to write a review' : 'Iniciá sesión para escribir una reseña',
    modalTitulo: idioma === 'en' ? 'Write a review' : 'Escribir reseña',
    modalPlaceholder: idioma === 'en' ? 'Tell us about your experience...' : 'Contá tu experiencia en este lugar...',
    modalFotos: idioma === 'en' ? 'Photos' : 'Fotos',
    modalPublicar: idioma === 'en' ? 'Publish review' : 'Publicar reseña',
    modalPublicando: idioma === 'en' ? 'Publishing...' : 'Publicando...',
    modalExito: idioma === 'en' ? '¡Review published!' : '¡Reseña publicada!',
    minimo: idioma === 'en' ? 'Minimum 50 characters' : 'Mínimo 50 caracteres',
    valido: idioma === 'en' ? '✓ Valid length' : '✓ Longitud válida',
    cargando: idioma === 'en' ? 'Loading...' : 'Cargando…',
    noEncontrado: idioma === 'en' ? 'We couldn\'t find this place.' : 'No encontramos este lugar.',
    volverInicio: idioma === 'en' ? 'Back to home' : 'Volver al inicio',
    errorResena: idioma === 'en' ? 'The review must be at least 50 characters.' : 'La reseña debe tener al menos 50 caracteres.',
  }

  const [lugar, setLugar] = useState(null)
  const [resenas, setResenas] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [toast, setToast] = useState(null)
  const [likesCount, setLikesCount] = useState(0)
  const [userLiked, setUserLiked] = useState(false)
  const [ratingPromedio, setRatingPromedio] = useState(null)
  const [userRating, setUserRating] = useState(null)
  const [resenaLikeCounts, setResenaLikeCounts] = useState({})
  const [userResenaLikes, setUserResenaLikes] = useState({})
  const [modalOpen, setModalOpen] = useState(false)
  const [modalRatingHover, setModalRatingHover] = useState(null)
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [resenaTitulo, setResenaTitulo] = useState('')
  const [resenaTexto, setResenaTexto] = useState('')
  const [resenaFotos, setResenaFotos] = useState([])
  const [resenaPreview, setResenaPreview] = useState([])
  const [fotosPickerOpen, setFotosPickerOpen] = useState(false)
  const [resenaLoading, setResenaLoading] = useState(false)
  const [resenaError, setResenaError] = useState('')
  const [resenaSuccess, setResenaSuccess] = useState(false)
  const [imagenes, setImagenes] = useState([])
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const fotosRef = useRef([])
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [respuestaAbierta, setRespuestaAbierta] = useState(null) // resena_id activo
  const [respuestaTexto, setRespuestaTexto] = useState('')
  const [respuestaLoading, setRespuestaLoading] = useState(false)
  const [respuestas, setRespuestas] = useState({}) // { [resena_id]: [...] }
  const [loginMensaje, setLoginMensaje] = useState('')
  const [esFavorito, setEsFavorito] = useState(false)
  const [favoritosCount, setFavoritosCount] = useState(0)
  const returnTo = `${location.pathname}${location.search}${location.hash}`

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  useEffect(() => {
    const urls = resenaPreview
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [resenaPreview])

  useEffect(() => {
    const initSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session ?? null)
      setAuthReady(true)
    }
    initSession()

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })
    return () => data?.subscription?.unsubscribe()
  }, [])

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setNotFound(false)

    const { data: lugarRow, error: lugarErr } = await getLugarById(id)

    if (lugarErr || !lugarRow) {
      setLugar(null)
      setNotFound(true)
      setResenas([])
      setRatingPromedio(null)
      setUserRating(null)
      setResenaLikeCounts({})
      setUserResenaLikes({})
      setLoading(false)
      return
    }

    setLugar(lugarRow)

    const userLikePromise = session?.user?.id
      ? getUserLikeLugar(id, session.user.id)
      : Promise.resolve({ data: null })

    const [
      { data: resenasRows },
      { data: allLikesRows },
      { data: userLikeRow },
      { data: imagenesRows },
    ] = await Promise.all([
      getResenasByLugar(id),
      getLikesCountLugar(id),
      userLikePromise,
      getImagenesByLugar(id),
    ])

    const allLikes = allLikesRows ?? []
    setLikesCount(allLikes.length)

    const ratingRows = allLikes.filter((r) => r.rating != null)
    setRatingPromedio(
      ratingRows.length > 0
        ? ratingRows.reduce((s, r) => s + Number(r.rating), 0) / ratingRows.length
        : null,
    )
    setUserLiked(!!userLikeRow)
    setUserRating(userLikeRow?.rating != null ? Number(userLikeRow.rating) : null)

    const ids = (resenasRows ?? []).map((r) => r.id).filter(Boolean)
    const likeCountMap = {}
    const userLikedMap = {}
    if (ids.length > 0) {
      const { data: allResenaLikes } = await getAllResenaLikes(ids)
      for (const rid of ids) {
        likeCountMap[rid] = 0
      }
      for (const row of allResenaLikes ?? []) {
        const rid = row.resena_id
        likeCountMap[rid] = (likeCountMap[rid] ?? 0) + 1
      }
      if (session?.user?.id) {
        const { data: myResenaLikes } = await getMyResenaLikes(session.user.id, ids)
        for (const row of myResenaLikes ?? []) {
          userLikedMap[row.resena_id] = true
        }
      }
    }
    setResenaLikeCounts(likeCountMap)
    setUserResenaLikes(userLikedMap)

    setImagenes(imagenesRows ?? [])
    setResenas(resenasRows ?? [])

    const idsResenas = (resenasRows ?? []).map((r) => r.id)
    if (idsResenas.length > 0) {
      const { data: respData } = await supabase
        .from('respuestas_resena')
        .select('*, usuarios(nombre, foto_perfil, avatar_url)')
        .in('resena_id', idsResenas)
        .order('created_at', { ascending: true })
      const rmap = {}
      for (const rr of respData ?? []) {
        if (!rmap[rr.resena_id]) rmap[rr.resena_id] = []
        rmap[rr.resena_id].push(rr)
      }
      setRespuestas(rmap)
    }

    // --- Favoritos: check user status + total count ---
    if (session) {
      const usuarioId = await getUsuarioId(session.user.id)
      if (usuarioId) {
        const esFav = await getFavoritoStatus(id, usuarioId)
        setEsFavorito(esFav)
      }
    }
    const favCount = await getFavoritosCount(id)
    setFavoritosCount(favCount)

    // Track visit in historial_visitas
    if (session) {
      const usuarioId = await getUsuarioId(session.user.id)
      if (usuarioId) {
        supabase
          .from('historial_visitas')
          .upsert(
            { usuario_id: usuarioId, lugar_id: id, visited_at: new Date().toISOString() },
            { onConflict: 'usuario_id,lugar_id' }
          )
          .then(({ error: hErr }) => {
            if (hErr) console.error('[historial] upsert error:', hErr)
          })
      }
    }

    setLoading(false)
  }, [id, session])

  const cargarRespuestas = useCallback(async (resenaIds) => {
    if (!resenaIds.length) return
    const { data } = await supabase
      .from('respuestas_resena')
      .select('*, usuarios(nombre, foto_perfil, avatar_url)')
      .in('resena_id', resenaIds)
      .order('created_at', { ascending: true })
    const map = {}
    for (const r of data ?? []) {
      if (!map[r.resena_id]) map[r.resena_id] = []
      map[r.resena_id].push(r)
    }
    setRespuestas(map)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!lightboxOpen) return
    const handleKey = (e) => {
      const len = fotosRef.current.length
      if (len === 0) return
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i + 1) % len)
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i - 1 + len) % len)
      if (e.key === 'Escape') setLightboxOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxOpen])

  const redirectToLogin = useCallback(() => {
    navigate('/login', {
      state: { from: returnTo },
    })
  }, [navigate, returnTo])

  useEffect(() => {
    if (!showLoginModal) return
    setShowLoginModal(false)
    redirectToLogin()
  }, [showLoginModal, redirectToLogin])

  const handleToggleLike = useCallback(async () => {
    if (!session?.user) {
      setLoginMensaje('Guardá tus lugares favoritos y llevá El Salvador en el bolsillo.')
      redirectToLogin()
      return
    }
    const uid = session.user.id
    if (userLiked) {
      const { error } = await removeLikeLugar(id, uid)
      if (error) {
        console.error('[handleToggleLike] delete error:', error)
      } else {
        setUserLiked(false)
        setUserRating(null)
        setLikesCount((c) => Math.max(0, c - 1))
      }
    } else {
      const { error } = await addLikeLugar(id, uid)
      if (error) {
        console.error('[handleToggleLike] insert error:', error)
      } else {
        setUserLiked(true)
        setLikesCount((c) => c + 1)
      }
    }
  }, [userLiked, id, session])

  const handleToggleFavorito = useCallback(async () => {
    if (!session) {
      setLoginMensaje('Guardá tus lugares favoritos y llevá El Salvador en el bolsillo.')
      redirectToLogin()
      return
    }
    const activeSession = session
    const usuarioId = await getUsuarioId(activeSession.user.id)
    if (!usuarioId) return

    if (esFavorito) {
      await removeFavorito(id, usuarioId)
      setEsFavorito(false)
      setFavoritosCount((prev) => Math.max(0, prev - 1))
    } else {
      await addFavorito(id, usuarioId)
      setEsFavorito(true)
      setFavoritosCount((prev) => prev + 1)
    }
  }, [esFavorito, id, session])

  const refreshLugarRatings = useCallback(async () => {
    const { data: allRows } = await getLikesCountLugar(id)

    const rows = allRows ?? []
    setLikesCount(rows.length)

    const ratingRows = rows.filter((r) => r.rating != null)
    setRatingPromedio(
      ratingRows.length > 0
        ? ratingRows.reduce((sum, r) => sum + Number(r.rating), 0) / ratingRows.length
        : null,
    )

    if (session?.user?.id) {
      const { data: mine } = await getUserLikeLugar(id, session.user.id)
      setUserLiked(!!mine)
      setUserRating(mine?.rating != null ? Number(mine.rating) : null)
    } else {
      setUserLiked(false)
      setUserRating(null)
    }
  }, [id, session])

  const handleRatingClick = useCallback(
    async (valor) => {
      if (!session?.user) {
        setLoginMensaje('Iniciá sesión para calificar este lugar.')
        redirectToLogin()
        return
      }
      const uid = session.user.id
      const prevRating = userRating

      if (userRating === valor) {
        // Same heart clicked again → clear the rating
        setUserRating(null)
        const { error } = await upsertRatingLugar(id, uid, null)
        if (error) {
          console.error('[handleRatingClick] clear rating error:', error)
          setUserRating(prevRating)
        } else {
          await refreshLugarRatings()
        }
      } else {
        // New or changed rating
        setUserRating(valor)
        const { error } = await upsertRatingLugar(id, uid, valor)
        if (error) {
          console.error('[handleRatingClick] upsert rating error:', error)
          setUserRating(prevRating)
        } else {
          await refreshLugarRatings()
        }
      }
    },
    [userRating, id, refreshLugarRatings, session],
  )

  const handleToggleResenaLike = useCallback(
    async (resenaId) => {
      if (!session?.user) {
        setLoginMensaje('Iniciá sesión para dar like a reseñas.')
        redirectToLogin()
        return
      }
      const liked = !!userResenaLikes[resenaId]
      if (liked) {
        const { error } = await removeLikeResena(resenaId, session.user.id)
        if (!error) {
          setUserResenaLikes((prev) => ({ ...prev, [resenaId]: false }))
          setResenaLikeCounts((prev) => ({
            ...prev,
            [resenaId]: Math.max(0, (prev[resenaId] ?? 0) - 1),
          }))
        }
      } else {
        const { error } = await addLikeResena(resenaId, session.user.id)
        if (!error) {
          setUserResenaLikes((prev) => ({ ...prev, [resenaId]: true }))
          setResenaLikeCounts((prev) => ({
            ...prev,
            [resenaId]: (prev[resenaId] ?? 0) + 1,
          }))
          // Notificar al dueño (si es otro usuario)
          const resena = resenas.find((r) => r.id === resenaId)
          if (resena && resena.usuario_id) {
            const actorId = await getUsuarioId(session.user.id)
            if (actorId && actorId !== resena.usuario_id) {
              const { error: notifError } = await createNotificacion({
                usuario_id: resena.usuario_id,
                tipo: 'like',
                resena_id: resenaId,
                actor_id: actorId,
              })
            }
          }
        }
      }
    },
    [session, userResenaLikes, resenas],
  )

  const handleResponder = useCallback(async (resenaId, duenioResenaId) => {
    if (!session?.user) {
      setLoginMensaje('Iniciá sesión para responder reseñas.')
      redirectToLogin()
      return
    }

    const texto = respuestaTexto.trim()
    if (!texto || texto.length < 5) return

    const allowedRespuesta = await checkRateLimit(session.user.id, 'crear_respuesta')
    if (allowedRespuesta === false) {
      setToast('Demasiadas solicitudes. Espera un momento antes de continuar.')
      return
    }

    setRespuestaLoading(true)

    const usuarioRow = await getUsuarioPerfil(session.user.id)

    if (!usuarioRow) { setRespuestaLoading(false); return }

    const contenidoRespuesta = filterProfanity(texto)

    const { error } = await supabase
      .from('respuestas_resena')
      .insert({
        resena_id: resenaId,
        usuario_id: usuarioRow.id,
        contenido: contenidoRespuesta,
      })

    if (error) {
      console.error('[handleResponder] insert error:', error)
      setRespuestaLoading(false)
      return
    }

    if (duenioResenaId && duenioResenaId !== usuarioRow.id) {
      await createNotificacion({
        usuario_id: duenioResenaId,
        tipo: 'respuesta',
        resena_id: resenaId,
        actor_id: usuarioRow.id,
      })
    }

    const nuevaRespuesta = {
      id: crypto.randomUUID(),
      resena_id: resenaId,
      usuario_id: usuarioRow.id,
      contenido: contenidoRespuesta,
      created_at: new Date().toISOString(),
      usuarios: {
        nombre: usuarioRow.nombre ?? 'Tú',
        foto_perfil: usuarioRow.foto_perfil ?? null,
        avatar_url: usuarioRow.avatar_url ?? null,
      },
    }
    setRespuestas((prev) => ({
      ...prev,
      [resenaId]: [...(prev[resenaId] ?? []), nuevaRespuesta],
    }))
    setRespuestaTexto('')
    setRespuestaAbierta(null)
    setRespuestaLoading(false)
  }, [respuestaTexto, session])

  const handleFotos = (e) => {
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const MAX_SIZE_MB = 5
    const files = Array.from(e.target.files)
    setResenaError('')

    const invalidType = files.find((f) => !ALLOWED_TYPES.includes(f.type))
    if (invalidType) {
      setResenaError('Solo se permiten imágenes en formato JPG, PNG, WEBP o GIF.')
      e.target.value = ''
      return
    }
    const oversize = files.find((f) => f.size > MAX_SIZE_MB * 1024 * 1024)
    if (oversize) {
      setResenaError(`Cada imagen no puede superar ${MAX_SIZE_MB}MB.`)
      e.target.value = ''
      return
    }

    const disponibles = 3 - resenaFotos.length
    const nuevas = files.slice(0, disponibles)
    setResenaFotos(prev => [...prev, ...nuevas])
    const previews = nuevas.map(f => URL.createObjectURL(f))
    setResenaPreview(prev => [...prev, ...previews])
    e.target.value = ''
  }

  const extensionSegura = (file) => {
    const mimeMap = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    }
    return mimeMap[file.type] ?? 'jpg'
  }

  const quitarFoto = (i) => {
    setResenaFotos(prev => prev.filter((_, idx) => idx !== i))
    setResenaPreview(prev => prev.filter((_, idx) => idx !== i))
  }

  const handleSubmitResena = async () => {
    setResenaError('')
    if (!session?.user) {
      redirectToLogin()
      return
    }
    if (resenaTexto.trim().length < 50) {
      setResenaError(t.errorResena)
      return
    }

    if (!session?.user) {
      setResenaError('Iniciá sesión para publicar una reseña.')
      return
    }

    const allowedResena = await checkRateLimit(session.user.id, 'crear_resena')
    if (allowedResena === false) {
      setToast('Demasiadas solicitudes. Espera un momento antes de continuar.')
      return
    }

    setResenaLoading(true)

    // Subir fotos
    const urlsFotos = []
    for (const foto of resenaFotos) {
      const ext = extensionSegura(foto)
      const path = `${id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('resenas-fotos')
        .upload(path, foto)
      if (uploadError) { setResenaError(`Error subiendo foto: ${uploadError.message}`); setResenaLoading(false); return }
      const { data: urlData } = supabase.storage.from('resenas-fotos').getPublicUrl(path)
      urlsFotos.push(urlData.publicUrl)
    }

    // Insertar reseña
    const usuarioRow = await getUsuarioPerfil(session.user.id)

    if (!usuarioRow) {
      setResenaError('No se encontró tu perfil. Intentá cerrar sesión y volver a entrar.')
      setResenaLoading(false)
      return
    }

    if (!resenaTitulo.trim()) {
      setResenaError(idioma === 'en' ? 'The title is required.' : 'El título es obligatorio.')
      return
    }

    const contenidoResena = filterProfanity(resenaTexto.trim())
    const tituloResena = filterProfanity(resenaTitulo.trim()).slice(0, 80)

    const { error: insertError } = await createResena({
      lugar_id: id,
      usuario_id: usuarioRow.id,
      titulo: tituloResena,
      contenido: contenidoResena,
      estrellas: userRating ?? 5,
      fotos: urlsFotos,
    })

    if (insertError) {
      setResenaError(`Error: ${insertError.message}`)
      setResenaLoading(false)
      return
    }

    const nuevaResena = {
      id: crypto.randomUUID(),
      lugar_id: id,
      usuario_id: usuarioRow.id,
      titulo: tituloResena,
      contenido: contenidoResena,
      estrellas: userRating ?? 5,
      fotos: urlsFotos,
      created_at: new Date().toISOString(),
      usuarios: {
        nombre: usuarioRow.nombre ?? '',
        foto_perfil: usuarioRow.foto_perfil ?? null,
        avatar_url: usuarioRow.avatar_url ?? null,
      },
    }
    setResenas((prev) => [nuevaResena, ...prev])
    setResenaLikeCounts((prev) => ({ ...prev, [nuevaResena.id]: 0 }))

    setResenaSuccess(true)
    setResenaLoading(false)
    setTimeout(() => {
      setModalOpen(false)
      setResenaTitulo('')
      setResenaTexto('')
      setResenaFotos([])
      setResenaPreview([])
      setResenaSuccess(false)
    }, 800)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader text={t.cargando} />
      </div>
    )
  }

  if (notFound || !lugar) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <p style={{ color: '#9ca3af', fontSize: '1rem' }}>{t.noEncontrado}</p>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.6rem 1.5rem',
            borderRadius: '8px',
            backgroundColor: '#0EA5E9',
            color: '#fff',
            fontSize: '0.9rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          {t.volverInicio}
        </Link>
      </div>
    )
  }

  const cat = lugar.categorias
  const dep = lugar.departamentos
  const img = resolveImageUrl(lugar.imagen_principal, 'lugares-fotos')
  const totalResenas = resenas.length
  const entrada = lugar.precio_entrada ?? null
  const urlsDesdeTabla = (imagenes ?? [])
    .map((i) => resolveImageUrl(i.ruta_imagen, 'lugares-fotos'))
    .filter(Boolean)
  const fotosCarousel = urlsDesdeTabla.length > 0
    ? urlsDesdeTabla
    : (img ? [img] : [])
  fotosRef.current = fotosCarousel

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            backgroundColor: '#1f2937',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '12px',
            fontSize: '0.875rem',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            maxWidth: 'calc(100% - 2rem)',
            textAlign: 'center',
          }}
          role="status"
        >
          {toast}
        </div>
      )}

      {modalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}
          onClick={(e) => { if (e.target === e.currentTarget) { setModalOpen(false); setResenaTitulo(''); setResenaTexto('') } }}
        >
          <div style={{
            backgroundColor: '#ffffff', borderRadius: '16px',
            padding: '2rem', width: '100%', maxWidth: '480px',
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                {t.modalTitulo}
              </h2>
              <button type="button" onClick={() => { setModalOpen(false); setResenaTitulo(''); setResenaTexto('') }}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#9ca3af' }}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1.25rem' }}>
              📍 {lugar.nombre}
            </p>

            {/* Campo título */}
            <input
              type="text"
              value={resenaTitulo}
              onChange={(e) => setResenaTitulo(e.target.value.slice(0, 80))}
              placeholder={idioma === 'en' ? 'Title' : 'Título'}
              style={{
                width: '100%', padding: '0.75rem 1rem', borderRadius: '10px',
                border: '1.5px solid #e5e7eb', fontSize: '0.93rem',
                outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                color: '#111827', background: '#fafafa', marginBottom: '0.75rem',
              }}
            />

            {/* Campo contenido */}
            <textarea
              value={resenaTexto}
              onChange={(e) => setResenaTexto(e.target.value.slice(0, 1000))}
              placeholder={t.modalPlaceholder}
              rows={5}
              className="resena-textarea"
              style={{
                width: '100%', padding: '0.9rem 1rem', borderRadius: '10px',
                border: '1.5px solid #e5e7eb', fontSize: '0.93rem',
                lineHeight: 1.65, resize: 'vertical', outline: 'none',
                fontFamily: 'inherit', boxSizing: 'border-box',
                color: '#111827', background: '#fafafa',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: resenaTexto.length < 50 ? '#EF4444' : '#10B981' }}>
                {resenaTexto.length < 50 ? `${t.minimo} — ${50 - resenaTexto.length}` : t.valido}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                {resenaTexto.length}/1000
              </span>
            </div>

            {/* Calificación dentro del modal */}
            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                {idioma === 'en' ? 'Rate this place' : 'Calificá este lugar'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {[1, 2, 3, 4, 5].map((v) => {
                  const active = modalRatingHover != null ? v <= modalRatingHover : (userRating != null && v <= userRating)
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleRatingClick(v)}
                      onMouseEnter={() => setModalRatingHover(v)}
                      onMouseLeave={() => setModalRatingHover(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '4px',
                        cursor: 'pointer',
                        lineHeight: 0,
                        transition: 'transform 0.15s ease',
                        transform: modalRatingHover === v ? 'scale(1.2)' : 'scale(1)',
                      }}
                      aria-label={idioma === 'en' ? `Rate ${v} of 5` : `Calificar ${v} de 5`}
                    >
                      <HeartIcon filled={active} size={30} />
                    </button>
                  )
                })}
                {userRating != null && (
                  <span style={{ fontSize: '0.78rem', color: '#6b7280', marginLeft: '6px' }}>
                    {userRating}/5
                  </span>
                )}
              </div>
            </div>

            {/* Fotos */}
            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                {t.modalFotos} ({resenaFotos.length}/3)
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {resenaPreview.map((src, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={src} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                    <button type="button" onClick={() => quitarFoto(i)}
                      style={{
                        position: 'absolute', top: '-6px', right: '-6px',
                        background: '#EF4444', color: '#fff', border: 'none',
                        borderRadius: '50%', width: '20px', height: '20px',
                        fontSize: '0.7rem', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}>✕</button>
                  </div>
                ))}
                {resenaFotos.length < 3 && (
                  'ontouchstart' in window || window.innerWidth < 768 ? (
                    <button
                      type="button"
                      onClick={() => setFotosPickerOpen(true)}
                      style={{
                        width: '80px', height: '80px', borderRadius: '8px',
                        border: '2px dashed #d1d5db', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#9ca3af', fontSize: '1.5rem',
                        background: 'none',
                      }}
                    >+</button>
                  ) : (
                    <label style={{
                      width: '80px', height: '80px', borderRadius: '8px',
                      border: '2px dashed #d1d5db', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#9ca3af', fontSize: '1.5rem',
                    }}>
                      +
                      <input type="file" accept="image/*" multiple onChange={handleFotos} style={{ display: 'none' }} />
                    </label>
                  )
                )}
                <PhotoPickerSheet
                  open={fotosPickerOpen}
                  onClose={() => setFotosPickerOpen(false)}
                  onFileSelected={handleFotos}
                  multiple
                />
              </div>
            </div>

            {resenaError && <p style={{ color: '#EF4444', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{resenaError}</p>}
            {resenaSuccess && <p style={{ color: '#10B981', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{t.modalExito}</p>}

            <button type="button" onClick={handleSubmitResena} disabled={resenaLoading}
              style={{
                width: '100%', backgroundColor: '#0EA5E9', color: '#fff',
                border: 'none', borderRadius: '50px', padding: '0.85rem',
                fontSize: '0.95rem', fontWeight: 700,
                cursor: resenaLoading ? 'not-allowed' : 'pointer',
                opacity: resenaLoading ? 0.7 : 1,
              }}>
              {resenaLoading ? t.modalPublicando : t.modalPublicar}
            </button>
          </div>
        </div>
      )}

      {/* HERO */}
      <section style={{ background: '#ffffff' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '20px 24px 0' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              fontSize: '0.85rem',
              fontWeight: 500,
              textDecoration: 'none',
              marginBottom: '16px',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e5e7eb' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6' }}
          >
            {t.volver}
          </Link>

          {fotosCarousel.length === 0 ? (
            <div style={{
              height: '480px',
              borderRadius: '16px',
              background: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: '5rem' }}>🏝️</span>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', height: '480px' }}>
              <div
                style={{
                  flex: '0 0 60%',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  borderRadius: '16px 0 0 16px',
                  background: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => { setLightboxIndex(0); setLightboxOpen(true) }}
              >
                <img
                  src={fotosCarousel[0]}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease, filter 0.3s ease',
                    display: 'block',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.filter = 'brightness(0.92)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)' }}
                />
              </div>
              <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    cursor: fotosCarousel[1] ? 'pointer' : 'default',
                    borderRadius: '0 16px 0 0',
                    background: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={() => { if (fotosCarousel[1]) { setLightboxIndex(1); setLightboxOpen(true); } }}
                >
                  {fotosCarousel[1] ? (
                    <img
                      src={fotosCarousel[1]}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease, filter 0.3s ease',
                        display: 'block',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.filter = 'brightness(0.92)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)' }}
                    />
                  ) : <span style={{ fontSize: '2.5rem' }}>🏝️</span>}
                </div>
                <div
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    cursor: fotosCarousel[2] ? 'pointer' : 'default',
                    borderRadius: '0 0 16px 0',
                    position: 'relative',
                    background: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={() => { if (fotosCarousel[2]) { setLightboxIndex(2); setLightboxOpen(true); } }}
                >
                  {fotosCarousel[2] ? (
                    <img
                      src={fotosCarousel[2]}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease, filter 0.3s ease',
                        display: 'block',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.filter = 'brightness(0.92)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)' }}
                    />
                  ) : <span style={{ fontSize: '2.5rem' }}>🏝️</span>}
                  
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(0); setLightboxOpen(true) }}
                    style={{
                      position: 'absolute',
                      bottom: '14px',
                      right: '14px',
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      border: '1.5px solid #d1d5db',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                    </svg>
                    {idioma === 'en' ? 'See all photos' : 'Ver todas las fotos'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{ padding: '20px 0 24px' }}>
            {cat && (
              <div style={{ marginBottom: '10px' }}>
                <CategoryPill nombre={cat.nombre} />
              </div>
            )}
            <h1 style={{
              fontSize: 'clamp(1.5rem, 5vw, 2.25rem)',
              fontWeight: 800,
              color: '#111827',
              lineHeight: 1.15,
              margin: 0,
            }}>
              {lugar.nombre}
            </h1>
          </div>
        </div>
      </section>

      {/* LIGHTBOX */}
      {lightboxOpen && (() => {
        const mob = window.innerWidth < 768
        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 300,
              backgroundColor: mob ? '#111' : 'rgba(0,0,0,0.88)',
              display: 'flex',
              alignItems: mob ? 'flex-start' : 'center',
              justifyContent: 'center',
            }}
            onClick={() => setLightboxOpen(false)}
          >
            {/* Contenedor principal */}
            <div
              style={{
                display: 'flex',
                flexDirection: mob ? 'column' : 'row',
                width: mob ? '100%' : 'auto',
                height: mob ? '100%' : 'auto',
                maxHeight: mob ? '100vh' : '90vh',
                borderRadius: mob ? 0 : '8px',
                overflow: 'hidden',
                boxShadow: mob ? 'none' : '0 24px 64px rgba(0,0,0,0.6)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Área de imagen */}
              <div style={{
                position: 'relative',
                backgroundColor: '#111',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {/* Volver */}
                <button
                  type="button"
                  onClick={() => setLightboxOpen(false)}
                  style={{
                    position: 'absolute',
                    top: '14px',
                    left: '14px',
                    color: '#fff',
                    background: 'rgba(0,0,0,0.55)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: '24px',
                    padding: '5px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    zIndex: 10,
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Volver
                </button>

                {/* Contador */}
                <div style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  color: '#fff',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  pointerEvents: 'none',
                  zIndex: 10,
                }}>
                  {lightboxIndex + 1} / {fotosCarousel.length}
                </div>

                <img
                  src={fotosCarousel[lightboxIndex]}
                  alt=""
                  style={{
                    maxHeight: mob ? '58vh' : '90vh',
                    maxWidth: mob ? '100vw' : '65vw',
                    width: mob ? '100%' : 'auto',
                    objectFit: mob ? 'cover' : 'contain',
                    userSelect: 'none',
                    display: 'block',
                  }}
                />

                {fotosCarousel.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Foto anterior"
                      onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i - 1 + fotosCarousel.length) % fotosCarousel.length) }}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#fff',
                        background: 'rgba(255,255,255,0.15)',
                        border: '1px solid rgba(255,255,255,0.25)',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      aria-label="Foto siguiente"
                      onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i + 1) % fotosCarousel.length) }}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#fff',
                        background: 'rgba(255,255,255,0.15)',
                        border: '1px solid rgba(255,255,255,0.25)',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Panel de info */}
              <div
                style={{
                  width: mob ? '100%' : '300px',
                  flex: mob ? 1 : 'none',
                  backgroundColor: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: mob ? '18px 20px' : '28px 22px',
                  overflowY: 'auto',
                }}
              >
                <h2 style={{ fontSize: mob ? '1rem' : '1.15rem', fontWeight: 700, color: '#111', margin: '0 0 4px 0', lineHeight: 1.3 }}>
                  {lugar.nombre}
                </h2>
                <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: '0 0 12px 0' }}>
                  {lightboxIndex + 1} de {fotosCarousel.length} {fotosCarousel.length === 1 ? 'foto' : 'fotos'}
                </p>

                {ratingPromedio != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
                    {[1, 2, 3, 4, 5].map((star) => {
                      const full = ratingPromedio >= star
                      const half = !full && ratingPromedio >= star - 0.5
                      return (
                        <span key={star} style={{ fontSize: '1.1rem', lineHeight: 1 }}>
                          {full ? '❤️' : half ? '🩷' : '🤍'}
                        </span>
                      )
                    })}
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#374151', marginLeft: '4px' }}>
                      {ratingPromedio.toFixed(1)}
                    </span>
                  </div>
                )}

                {lugar.descripcion && (
                  <>
                    <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0 0 12px 0' }} />
                    <p style={{ fontSize: mob ? '0.83rem' : '0.87rem', color: '#374151', lineHeight: 1.6, margin: 0 }}>
                      {lugar.descripcion}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* INFO BAR */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '0',
        overflowX: 'auto',
        fontSize: '0.85rem',
        color: '#4b5563',
      }}>
        {dep && (
          <>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
              📍 {dep.nombre}
            </span>
            <span style={{ margin: '0 14px', color: '#d1d5db' }}>|</span>
          </>
        )}
        {entrada != null && (
          <>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
              🎫 {entrada}
            </span>
            <span style={{ margin: '0 14px', color: '#d1d5db' }}>|</span>
          </>
        )}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', color: '#ef4444' }}>
          <span aria-hidden>♥</span>
          <span style={{ fontWeight: 600, color: '#4b5563' }}>
            {ratingPromedio != null ? ratingPromedio.toFixed(1) : '—'}
          </span>
        </span>
        <span style={{ margin: '0 14px', color: '#d1d5db' }}>|</span>
        <button
          type="button"
          onClick={handleToggleFavorito}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap',
            color: '#ef4444',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            font: 'inherit',
          }}
        >
          <HeartIcon filled={esFavorito} size={15} />
          <span style={{ fontWeight: 600 }}>{favoritosCount}</span>
        </button>
        <span style={{ margin: '0 14px', color: '#d1d5db' }}>|</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
          💬 {totalResenas} {totalResenas === 1 ? t.resena : t.resenas2}
        </span>
      </div>

      {/* BODY */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '28px 20px 60px',
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '28px',
      }}
        className="detalle-body-grid"
      >
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', marginBottom: '14px' }}>
              {t.sobre}
            </h2>
            <p style={{
              fontSize: '0.95rem',
              lineHeight: 1.7,
              color: '#374151',
              whiteSpace: 'pre-line',
              margin: 0,
            }}>
              {lugar.descripcion || t.sinDesc}
            </p>
          </div>

          {lugar.direccion && (
            <div style={{
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              padding: '20px 24px',
              border: '1px solid #f3f4f6',
            }}>
              <p style={{ fontWeight: 600, fontSize: '15px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 10px' }}>
                📍 {idioma === 'en' ? 'Location' : 'Ubicación'}
              </p>
              {(() => {
                const mapSrc = lugar.latitud && lugar.longitud
                  ? `https://www.google.com/maps?q=${lugar.latitud},${lugar.longitud}&output=embed`
                  : `https://www.google.com/maps?q=${encodeURIComponent(lugar.direccion || '')}&output=embed`
                const directionsUrl = lugar.latitud && lugar.longitud
                  ? `https://maps.google.com/?q=${lugar.latitud},${lugar.longitud}`
                  : `https://maps.google.com/?q=${encodeURIComponent(lugar.direccion || '')}`
                return (
                  <>
                    <p style={{ fontSize: '14px', color: '#555', marginBottom: '10px' }}>{lugar.direccion}</p>
                    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e8e8e8', marginBottom: '10px' }}>
                      <iframe
                        title="Mapa de ubicación"
                        width="100%"
                        height="220"
                        style={{ border: 0, display: 'block' }}
                        src={mapSrc}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 18px', background: '#1a1a1a', color: '#fff', borderRadius: '24px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                      {idioma === 'en' ? 'Get directions' : 'Cómo llegar'}
                    </a>
                  </>
                )
              })()}
              {lugar.horarios && (() => {
                if (lugar.horarios.es24Horas) {
                  return (
                    <div style={{ marginTop: '20px' }}>
                      <p style={{ fontWeight: 600, fontSize: '15px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🕐 Horarios (GMT-6)
                      </p>
                      <div style={{ padding: '12px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>🌟</span>
                        <span style={{ color: '#065f46', fontWeight: 600, fontSize: '14px' }}>Abierto 24 horas todos los días</span>
                      </div>
                    </div>
                  )
                }

                const dias = [
                  { key: 'lunes', label: 'Lunes' },
                  { key: 'martes', label: 'Martes' },
                  { key: 'miercoles', label: 'Miércoles' },
                  { key: 'jueves', label: 'Jueves' },
                  { key: 'viernes', label: 'Viernes' },
                  { key: 'sabado', label: 'Sábado' },
                  { key: 'domingo', label: 'Domingo' },
                ]
                return (
                  <div style={{ marginTop: '20px' }}>
                    <p style={{ fontWeight: 600, fontSize: '15px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🕐 Horarios (GMT-6)
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {dias.map(({ key, label }) => {
                        const d = lugar.horarios[key]
                        const format12h = (time) => {
                          if (!time || time === '?') return '?'
                          const parts = time.split(':')
                          if (parts.length !== 2) return time
                          let h = parseInt(parts[0], 10)
                          const m = parts[1]
                          const ampm = h >= 12 ? 'PM' : 'AM'
                          h = h % 12 || 12
                          return `${h}:${m} ${ampm}`
                        }
                        return (
                          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '4px 0', borderBottom: '1px solid #f5f5f5' }}>
                            <span style={{ color: '#555' }}>{label}</span>
                            <span style={{ color: d?.abierto ? '#1a1a1a' : '#aaa', fontWeight: d?.abierto ? 500 : 400 }}>
                              {d?.abierto ? `${format12h(d.abre)} – ${format12h(d.cierra)}` : 'Cerrado'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                {t.resenas} <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: '0.9rem' }}>({totalResenas})</span>
              </h2>
              <button
                type="button"
                onClick={() => {
                  if (session) {
                    setModalOpen(true)
                  } else {
                    setLoginMensaje('Iniciá sesión para compartir tu experiencia en este lugar.')
                    redirectToLogin()
                  }
                }}
                style={{
                  backgroundColor: '#0EA5E9',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0284c7' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0EA5E9' }}
              >
                {t.escribir}
              </button>
            </div>

            {resenas.length > 0 && (() => {
              const total = resenas.length
              const promedio = resenas.reduce((acc, r) => acc + (Number(r.estrellas) || 0), 0) / total
              const distribucion = [5, 4, 3, 2, 1].map(n => ({
                valor: n,
                cantidad: resenas.filter(r => Number(r.estrellas) === n).length
              }))
              const renderCorazones = (val) => [1, 2, 3, 4, 5].map(i => {
                const diff = val - (i - 1)
                const color = diff >= 1 ? '#0ea5e9' : '#ddd'
                return <span key={i} style={{ color, fontSize: '20px' }}>{diff >= 1 ? '♥' : '♡'}</span>
              })
              return (
                <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '12px', padding: '20px 24px', marginBottom: '20px', display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '90px' }}>
                    <span style={{ fontSize: '40px', fontWeight: 700, color: '#1a1a1a', lineHeight: 1 }}>{promedio.toFixed(1)}</span>
                    <div style={{ display: 'flex', gap: '2px', margin: '8px 0 4px' }}>{renderCorazones(promedio)}</div>
                    <span style={{ fontSize: '13px', color: '#888' }}>{total} reseña{total !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ width: '1px', height: '80px', background: '#e8e8e8', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {distribucion.map(({ valor, cantidad }) => {
                      const pct = total > 0 ? (cantidad / total) * 100 : 0
                      return (
                        <div key={valor} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13px', color: '#555', width: '14px', textAlign: 'right', flexShrink: 0 }}>{valor}</span>
                          <span style={{ fontSize: '13px', color: '#0ea5e9', flexShrink: 0 }}>♥</span>
                          <div style={{ flex: 1, height: '8px', background: '#ebebeb', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: valor >= 4 ? '#0ea5e9' : valor === 3 ? '#38bdf8' : '#bae6fd', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                          </div>
                          <span style={{ fontSize: '12px', color: '#aaa', width: '20px', flexShrink: 0 }}>{cantidad}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {resenas.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 24px',
                gap: '16px',
                background: '#fafafa',
                borderRadius: '12px',
                border: '1px solid #f0f0f0'
              }}>
                <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="56" height="56" rx="28" fill="#e0f2fe"/>
                  <path d="M14 20C14 17.8 15.8 16 18 16H38C40.2 16 42 17.8 42 20V32C42 34.2 40.2 36 38 36H30L24 41V36H18C15.8 36 14 34.2 14 32V20Z"
                    stroke="#0ea5e9" strokeWidth="2" strokeLinejoin="round" fill="none"/>
                  <circle cx="22" cy="26" r="1.5" fill="#0ea5e9"/>
                  <circle cx="28" cy="26" r="1.5" fill="#0ea5e9"/>
                  <circle cx="34" cy="26" r="1.5" fill="#0ea5e9"/>
                </svg>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '16px', color: '#1a1a1a' }}>
                    {idioma === 'en' ? 'No reviews yet' : 'Aún no hay reseñas'}
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#888', lineHeight: '1.5' }}>
                    {idioma === 'en' ? 'Be the first to share your experience' : 'Sé el primero en compartir tu experiencia'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (!session?.user) {
                      setLoginMensaje('Iniciá sesión para compartir tu experiencia en este lugar.')
                      redirectToLogin()
                      return
                    }
                    setModalOpen(true)
                  }}
                  style={{
                    marginTop: '4px',
                    padding: '10px 24px',
                    background: '#0ea5e9',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '24px',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                  {idioma === 'en' ? 'Write a review' : 'Escribir reseña'}
                </button>
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column' }}>
                {resenas.map((r) => {
                  const nombre = r.usuarios?.nombre?.trim()
                  const autor = nombre || t.anonimo
                  const rLikeCount = resenaLikeCounts[r.id] ?? 0
                  const rUserLiked = !!userResenaLikes[r.id]

                  return (
                    <li
                      key={r.id}
                      style={{
                        padding: '20px 0',
                        borderBottom: '1px solid #f3f4f6',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        {/* Avatar */}
                        <Link to={`/usuario/${r.usuario_id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                          <AvatarImg
                            src={r.usuarios?.foto_perfil}
                            fallbackSrc={r.usuarios?.avatar_url}
                            nombre={autor}
                            size={42}
                            fontSize="1rem"
                          />
                        </Link>

                        {/* Columna derecha: todo el contenido */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Nombre + fecha */}
                          <Link to={`/usuario/${r.usuario_id}`} style={{ textDecoration: 'none' }}>
                            <p style={{ fontSize: '0.92rem', fontWeight: 700, color: '#111827', margin: '0 0 1px', cursor: 'pointer' }}>
                              {autor}
                            </p>
                          </Link>
                          <time style={{ fontSize: '0.75rem', color: '#9ca3af' }} dateTime={r.created_at}>
                            {formatRelativeEs(r.created_at)}
                          </time>


                          {r.estrellas != null && (
                            <div style={{ display: 'flex', gap: '2px', margin: '5px 0 2px' }}>
                              {[1, 2, 3, 4, 5].map(i => (
                                <span key={i} style={{ color: i <= Number(r.estrellas) ? '#0ea5e9' : '#ddd', fontSize: '14px' }}>
                                  {i <= Number(r.estrellas) ? '♥' : '♡'}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Título en negrita */}
                          {r.titulo && (
                            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827', margin: '10px 0 4px' }}>
                              {r.titulo}
                            </p>
                          )}

                          {/* Contenido */}
                          <p style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: 1.65, margin: '0 0 10px' }}>
                            {r.contenido}
                          </p>

                          {/* Fotos */}
                          {r.fotos && r.fotos.length > 0 && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                              {r.fotos.map((url, i) => (
                                <img
                                  key={i}
                                  src={url}
                                  alt=""
                                  loading="lazy"
                                  decoding="async"
                                  style={{
                                    height: '120px',
                                    width: 'auto',
                                    maxWidth: '200px',
                                    objectFit: 'cover',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                  }}
                                  onClick={() => window.open(url, '_blank')}
                                />
                              ))}
                            </div>
                          )}

                          {/* Acciones: like + responder */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleResenaLike(r.id)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                color: rUserLiked ? '#ef4444' : '#9ca3af',
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                font: 'inherit',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                              }}
                            >
                              <HeartIcon filled={rUserLiked} size={14} />
                              {rLikeCount > 0 && <span>{rLikeCount}</span>}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!session?.user) {
                                  redirectToLogin()
                                  return
                                }
                                setRespuestaAbierta(respuestaAbierta === r.id ? null : r.id)
                                setRespuestaTexto('')
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '0.8rem',
                                color: '#9ca3af',
                                cursor: 'pointer',
                                padding: 0,
                                fontWeight: 600,
                              }}
                            >
                              Responder
                            </button>
                          </div>

                          {/* Input responder */}
                          {respuestaAbierta === r.id && (
                            <div style={{ marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                              <textarea
                                value={respuestaTexto}
                                onChange={(e) => setRespuestaTexto(e.target.value.slice(0, 300))}
                                placeholder="Escribí tu respuesta..."
                                rows={2}
                                className="respuesta-textarea"
                                style={{
                                  flex: 1,
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  border: '1.5px solid #e5e7eb',
                                  fontSize: '0.85rem',
                                  resize: 'none',
                                  fontFamily: 'inherit',
                                  outline: 'none',
                                  background: '#fafafa',
                                }}
                              />
                              <button
                                type="button"
                                disabled={respuestaLoading || respuestaTexto.trim().length < 5}
                                onClick={() => handleResponder(r.id, r.usuario_id)}
                                style={{
                                  backgroundColor: '#0EA5E9',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '8px 14px',
                                  fontSize: '0.82rem',
                                  fontWeight: 600,
                                  cursor: respuestaLoading || respuestaTexto.trim().length < 5 ? 'not-allowed' : 'pointer',
                                  opacity: respuestaLoading || respuestaTexto.trim().length < 5 ? 0.6 : 1,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {respuestaLoading ? '…' : 'Enviar'}
                              </button>
                            </div>
                          )}

                          {/* Respuestas */}
                          {(respuestas[r.id] ?? []).map((rep) => {
                            const repNombre = rep.usuarios?.nombre?.trim() || 'Anónimo'
                            return (
                              <div key={rep.id} style={{
                                marginTop: '12px',
                                padding: '10px 14px',
                                borderLeft: '2px solid #0EA5E9',
                                borderRadius: '0 8px 8px 0',
                                backgroundColor: '#f0f9ff',
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'flex-start',
                              }}>
                                <AvatarImg
                                  src={rep.usuarios?.foto_perfil}
                                  fallbackSrc={rep.usuarios?.avatar_url}
                                  nombre={repNombre}
                                  size={26}
                                  fontSize="0.65rem"
                                />
                                <div style={{ flex: 1 }}>
                                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0284c7', margin: '0 0 3px' }}>
                                    {repNombre}
                                    <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: '6px' }}>
                                      {formatRelativeEs(rep.created_at)}
                                    </span>
                                  </p>
                                  <p style={{ fontSize: '0.84rem', color: '#374151', margin: 0, lineHeight: 1.5 }}>
                                    {rep.contenido}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
