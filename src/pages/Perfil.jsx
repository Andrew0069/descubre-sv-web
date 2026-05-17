import { useState, useEffect, useCallback, useMemo } from 'react'
import { SpotterLogo } from '../components/SpotterLogo'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getUsuarioCompleto, updateUsuarioPerfil, updateUsuarioFoto } from '../services/usuariosService'
import { completarGuia, getGuiasByUser } from '../services/guiasService'
import { resolveImageUrl } from '../lib/imageUrl'
import { normalizeUsername, validateProfileName, validateUsername } from '../lib/authValidation'
import Loader from '../components/Loader'
import PhotoPickerSheet from '../components/PhotoPickerSheet'
import './Perfil.css'

/* ── tiny helpers ─────────────────────────────────── */
function timeAgo(d) {
  if (!d) return ''
  const s = Math.round((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'hace un momento'
  const m = Math.round(s / 60)
  if (m < 60) return `hace ${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `hace ${h}h`
  const dy = Math.round(h / 24)
  return `hace ${dy}d`
}

function normalizeSuggestionState(state) {
  const normalized = String(state || '').trim().toLowerCase()
  if (normalized === 'aprobada' || normalized === 'aprobado') return 'aprobada'
  if (normalized === 'denegada' || normalized === 'rechazada' || normalized === 'rechazado') return 'denegada'
  return 'pendiente'
}

const MES_LARGO = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

function startOfDay(d) {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x
}

function diffDays(a, b) {
  return Math.floor((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86400000)
}

const CATEGORY_STYLES = {
  'Cafetería':    { bg: '#FFF0D6', icon: '☕' },
  'Cafeteria':    { bg: '#FFF0D6', icon: '☕' },
  'Café':         { bg: '#FFF0D6', icon: '☕' },
  'Restaurante':  { bg: '#FFE8D6', icon: '🍽️' },
  'Restaurantes': { bg: '#FFE8D6', icon: '🍽️' },
  'Hotel':        { bg: '#E8F4FF', icon: '🏨' },
  'Hoteles':      { bg: '#E8F4FF', icon: '🏨' },
  'Alojamiento':  { bg: '#E8F4FF', icon: '🏨' },
  'Naturaleza':   { bg: '#E8F5E9', icon: '🌿' },
  'Volcán':       { bg: '#E8F5E9', icon: '🌋' },
  'Playa':        { bg: '#E0F7FA', icon: '🏖️' },
  'Playas':       { bg: '#E0F7FA', icon: '🏖️' },
  'Biblioteca':   { bg: '#F3E5F5', icon: '📚' },
  'Museo':        { bg: '#FFF3E0', icon: '🏛️' },
  'Iglesia':      { bg: '#FCE4EC', icon: '⛪' },
  'Parque':       { bg: '#E8F5E9', icon: '🌳' },
  'default':      { bg: '#FFF8EC', icon: '📍' },
}

function categoryStyle(nombre) {
  return CATEGORY_STYLES[nombre] || CATEGORY_STYLES.default
}

/* ── main component ───────────────────────────────── */
export default function Perfil() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)

  // data
  const [favoritos, setFavoritos] = useState([])
  const [historial, setHistorial] = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [guias, setGuias] = useState([])

  // ui
  const [tab, setTab] = useState('favoritos')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [modalType, setModalType] = useState(null)
  const [fotoOpen, setFotoOpen] = useState(false)

  // edit bio
  const [editNombre, setEditNombre] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [editBio, setEditBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  // edit photo
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false)

  /* ── session ── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { navigate('/login'); return }
      setSession(data.session)
    })
  }, [navigate])

  /* ── load all data ── */
  const loadData = useCallback(async (sess) => {
    if (!sess) return
    setLoading(true)

    const u = await getUsuarioCompleto(sess.user.id)
    if (!u) { setLoading(false); return }
    setPerfil(u)
    setEditNombre(u.nombre || '')
    setEditUsername(u.username || '')
    setEditBio(u.bio || '')

    const uid = u.id

    // favoritos (+ categoria for badge & filter)
    const { data: favs } = await supabase
      .from('favoritos')
      .select('lugar_id, lugares(id,nombre,imagen_principal,departamentos(nombre),categorias(nombre,color))')
      .eq('usuario_id', uid)
      .order('created_at', { ascending: false })
    setFavoritos(favs ?? [])

    // historial (extended to 30 for the timeline view)
    const { data: hist } = await supabase
      .from('historial_visitas')
      .select('lugar_id, visited_at, lugares(id,nombre,imagen_principal,departamentos(nombre),categorias(nombre,color))')
      .eq('usuario_id', uid)
      .order('visited_at', { ascending: false })
      .limit(30)
    setHistorial(hist ?? [])

    // solicitudes
    try {
      const nowIso = new Date().toISOString()
      const { data: sols, error: solsError } = await supabase
        .from('sugerencias')
        .select('id,nombre,ubicacion,estado,created_at')
        .eq('usuario_id', uid)
        .lte('created_at', nowIso)
        .order('created_at', { ascending: false })

      if (solsError) throw solsError
      setSolicitudes((sols ?? []).map((item) => ({
        ...item,
        estado: normalizeSuggestionState(item.estado),
      })))
    } catch (error) {
      console.error('[Perfil] sugerencias fetch error:', error)
      setSolicitudes([])
    }

    // guias
    const { data: guiasData } = await getGuiasByUser(sess.user.id)
    if (guiasData && guiasData.length > 0) {
      const allLugarIds = new Set()
      guiasData.forEach(g => g.lugares_ids?.forEach(id => allLugarIds.add(id)))
      if (allLugarIds.size > 0) {
        const { data: lugaresGuias } = await supabase
          .from('lugares')
          .select('id, nombre')
          .in('id', Array.from(allLugarIds))
        if (lugaresGuias) {
          const lugaresMap = Object.fromEntries(lugaresGuias.map(l => [l.id, l.nombre]))
          guiasData.forEach(g => {
            g.nombres_lugares = g.lugares_ids?.map(id => lugaresMap[id]).filter(Boolean) || []
          })
        }
      }
    }
    setGuias(guiasData ?? [])

    setLoading(false)
  }, [])

  useEffect(() => { if (session) loadData(session) }, [session, loadData])

  useEffect(() => {
    return () => { if (photoPreview) URL.revokeObjectURL(photoPreview) }
  }, [photoPreview])

  /* ── save bio ── */
  const handleSaveBio = async () => {
    setMsg(null)
    const nombreError = validateProfileName(editNombre)
    if (nombreError) { setMsg({ type: 'error', text: nombreError }); return }
    const wantsUsername = Boolean(editUsername.trim())
    if (wantsUsername) {
      const usernameError = validateUsername(editUsername)
      if (usernameError) { setMsg({ type: 'error', text: usernameError }); return }
    }
    if (editBio.length > 200) {
      setMsg({ type: 'error', text: 'La descripción no puede superar 200 caracteres.' }); return
    }
    setSaving(true)
    const normalizedUsername = wantsUsername ? normalizeUsername(editUsername) : null
    if (normalizedUsername) {
      const { data: existingUsername, error: usernameCheckErr } = await supabase
        .from('usuarios')
        .select('id')
        .eq('username', normalizedUsername)
        .neq('auth_id', session.user.id)
        .maybeSingle()
      if (usernameCheckErr) {
        setSaving(false)
        setMsg({ type: 'error', text: 'No pudimos validar el nombre de usuario.' }); return
      }
      if (existingUsername) {
        setSaving(false)
        setMsg({ type: 'error', text: 'Ese nombre de usuario ya está en uso.' }); return
      }
    }
    const { error } = await updateUsuarioPerfil(session.user.id, editNombre.trim(), normalizedUsername, editBio.trim())
    setSaving(false)
    if (error) { setMsg({ type: 'error', text: 'Error al guardar.' }); return }
    setPerfil(p => ({ ...p, nombre: editNombre.trim(), ...(normalizedUsername ? { username: normalizedUsername } : {}), bio: editBio.trim() }))
    setMsg({ type: 'success', text: '¡Perfil actualizado!' })
    setTimeout(() => setModalType(null), 800)
  }

  /* ── save photo ── */
  const handlePhotoSelect = (e) => {
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const file = e.target.files[0]
    if (!file) return
    if (!ALLOWED.includes(file.type)) { setMsg({ type: 'error', text: 'Solo JPG, PNG, WEBP o GIF.' }); return }
    if (file.size > 5 * 1024 * 1024) { setMsg({ type: 'error', text: 'Max 5MB.' }); return }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSavePhoto = async () => {
    if (!photoFile) return
    setSaving(true); setMsg(null)
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[photoFile.type] ?? 'jpg'
    const path = `${session.user.id}/avatar.${ext}`
    const { error: upErr } = await supabase.storage.from('avatares').upload(path, photoFile, { upsert: true })
    if (upErr) { setMsg({ type: 'error', text: 'Error subiendo foto.' }); setSaving(false); return }
    const { data: urlD } = supabase.storage.from('avatares').getPublicUrl(path)
    const url = urlD.publicUrl
    await updateUsuarioFoto(session.user.id, url)
    setPerfil(p => ({ ...p, foto_perfil: url }))
    setPhotoFile(null); setPhotoPreview('')
    setSaving(false)
    setMsg({ type: 'success', text: '¡Foto actualizada!' })
    setTimeout(() => setModalType(null), 800)
  }

  const handleRemovePhoto = async () => {
    setSaving(true); setMsg(null)
    await updateUsuarioFoto(session.user.id, '')
    setPerfil(p => ({ ...p, foto_perfil: '' }))
    setSaving(false)
    setMsg({ type: 'success', text: 'Foto eliminada.' })
    setTimeout(() => setModalType(null), 800)
  }

  /* ── derived stats ── */
  const stats = useMemo(() => {
    const visitas = historial.length
    const favs = favoritos.length
    const pubGuias = guias.length
    // Spotter level: simple gamification (1 every 10 lugares visitados, min 1)
    const lvl = Math.max(1, Math.floor(visitas / 10) + 1)
    // Días viajando: días desde signup
    const dias = perfil?.created_at
      ? Math.max(0, Math.floor((Date.now() - new Date(perfil.created_at).getTime()) / 86400000))
      : 0
    // Países: si no hay campo, mostramos 0
    const paises = 0
    return { visitas, favs, pubGuias, paises, dias, lvl }
  }, [historial, favoritos, guias, perfil])

  /* ── render ── */
  if (loading) {
    return <div className="perfil-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader text="Cargando perfil…" /></div>
  }

  const foto = perfil?.foto_perfil || perfil?.avatar_url
  const inicial = (perfil?.nombre || 'U').charAt(0).toUpperCase()
  const joinDate = perfil?.created_at
    ? `${MES_LARGO[new Date(perfil.created_at).getMonth()]} ${new Date(perfil.created_at).getFullYear()}`
    : ''

  const tabs = [
    { id: 'favoritos', label: 'Favoritos', count: favoritos.length },
    { id: 'historial', label: 'Historial', count: historial.length },
    { id: 'solicitudes', label: 'Solicitudes', count: solicitudes.length },
    { id: 'guias', label: 'Mis Guías', count: guias.length },
  ]

  return (
    <div className="perfil-page">
      {/* top bar */}
      <header className="perfil-header-bar">
        <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Spotter"><SpotterLogo /></Link>
        <span className="sep">|</span>
        <span className="title">Mi Perfil</span>
      </header>

      {/* banner */}
      <div className="perfil-banner">
        <div className="perfil-banner-inner">
          <div className="perfil-avatar-wrap">
            {foto
              ? <img src={foto} alt="avatar" className="perfil-avatar" onClick={() => setFotoOpen(true)} style={{ cursor: 'pointer' }} />
              : <div className="perfil-avatar-placeholder">{inicial}</div>}
            <span className="perfil-level-badge">Lvl {stats.lvl}</span>
          </div>
          <div className="perfil-info">
            <div className="perfil-name-row">
              <h1>{perfil?.nombre || 'Usuario'}</h1>
              <span className="you-tag">(vos)</span>
            </div>
            <p className="meta-line">
              {perfil?.nombre || 'Spotter'}
              {perfil?.username && <span className="at"> · @{perfil.username}</span>}
            </p>
            {perfil?.bio && <p className="bio">{perfil.bio}</p>}
            <p className="joined">
              {joinDate && <span>📅 Se unió en {joinDate}</span>}
              {perfil?.ciudad && <span style={{ marginLeft: joinDate ? 10 : 0 }}>📍 {perfil.ciudad}</span>}
            </p>
          </div>
        </div>

        <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
          <button className="perfil-settings-btn" onClick={() => setSettingsOpen(!settingsOpen)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Configuración →
          </button>
          {settingsOpen && (
            <div className="perfil-settings-dd">
              <button onClick={() => { setSettingsOpen(false); setMsg(null); setModalType('editBio') }}>✏️ Editar perfil</button>
              <button onClick={() => { setSettingsOpen(false); setMsg(null); setPhotoFile(null); setPhotoPreview(''); setModalType('editPhoto') }}>📷 Editar foto de perfil</button>
            </div>
          )}
        </div>
      </div>

      {/* stats row */}
      <div className="perfil-stats">
        <div className="perfil-stat">
          <div className="num">{stats.visitas}</div>
          <div className="label">Lugares<br/>visitados</div>
        </div>
        <div className="perfil-stat">
          <div className="num"><span className="em">❤️</span>{stats.favs}</div>
          <div className="label">Favoritos</div>
        </div>
        <div className="perfil-stat">
          <div className="num">{stats.pubGuias}</div>
          <div className="label">Guías<br/>publicadas</div>
        </div>
        <div className="perfil-stat">
          <div className="num">{stats.paises}</div>
          <div className="label">Países</div>
        </div>
        <div className="perfil-stat">
          <div className="num">{stats.dias}</div>
          <div className="label">Días<br/>viajando</div>
        </div>
      </div>

      {/* tabs */}
      <div className="perfil-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`perfil-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.count > 0 && <span className="perfil-tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* content */}
      <div className="perfil-content">
        {tab === 'favoritos' && <TabFavoritos favoritos={favoritos} />}
        {tab === 'historial' && <TabHistorial historial={historial} />}
        {tab === 'solicitudes' && <TabSolicitudes solicitudes={solicitudes} />}
        {tab === 'guias' && <TabGuias guias={guias} favoritosCount={favoritos.length} />}
      </div>

      {/* modals */}
      {modalType === 'editBio' && (
        <div className="perfil-modal-overlay" onClick={() => setModalType(null)}>
          <div className="perfil-modal" onClick={e => e.stopPropagation()}>
            <h2>Editar perfil</h2>
            {msg && <div className={`perfil-msg ${msg.type}`}>{msg.text}</div>}
            <label>Nombre</label>
            <input type="text" value={editNombre} onChange={e => setEditNombre(e.target.value.slice(0, 60))} placeholder="Tu nombre privado" />
            <div className="counter">{editNombre.length}/60</div>
            <label style={{ marginTop: '1rem' }}>Nombre de usuario</label>
            <input type="text" value={editUsername} onChange={e => setEditUsername(normalizeUsername(e.target.value).slice(0, 30))} placeholder="Tu usuario público" />
            <div className="counter">{editUsername.length}/30</div>
            <label style={{ marginTop: '1rem' }}>Descripción <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span></label>
            <textarea value={editBio} onChange={e => setEditBio(e.target.value.slice(0, 200))} placeholder="Contá algo sobre vos..." rows={3} />
            <div className="counter">{editBio.length}/200</div>
            <div className="actions">
              <button className="btn-secondary" onClick={() => setModalType(null)}>Cancelar</button>
              <button className="btn-primary" disabled={saving} onClick={handleSaveBio}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {modalType === 'editPhoto' && (
        <div className="perfil-modal-overlay" onClick={() => setModalType(null)}>
          <div className="perfil-modal" onClick={e => e.stopPropagation()}>
            <h2>Editar foto de perfil</h2>
            {msg && <div className={`perfil-msg ${msg.type}`}>{msg.text}</div>}

            {photoPreview && (
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <img src={photoPreview} alt="preview" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid #EFE3CC' }} />
              </div>
            )}

            <div className="perfil-photo-options">
              {'ontouchstart' in window || window.innerWidth < 768 ? (
                <button
                  type="button"
                  className="perfil-photo-upload"
                  style={{ cursor: 'pointer', background: 'none', width: '100%' }}
                  onClick={() => setPhotoPickerOpen(true)}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E0512A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#3B2E22' }}>{photoFile ? photoFile.name : 'Subir nueva foto'}</span>
                </button>
              ) : (
                <label className="perfil-photo-upload">
                  <input type="file" accept="image/*" onChange={handlePhotoSelect} />
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E0512A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#3B2E22' }}>{photoFile ? photoFile.name : 'Subir nueva foto'}</span>
                </label>
              )}
              {perfil?.foto_perfil && (
                <button className="perfil-remove-btn" onClick={handleRemovePhoto} disabled={saving}>🗑️ Quitar foto actual</button>
              )}
            </div>
            <PhotoPickerSheet
              open={photoPickerOpen}
              onClose={() => setPhotoPickerOpen(false)}
              onFileSelected={handlePhotoSelect}
            />

            <div className="actions">
              <button className="btn-secondary" onClick={() => setModalType(null)}>Cancelar</button>
              {photoFile && <button className="btn-primary" disabled={saving} onClick={handleSavePhoto}>{saving ? 'Guardando...' : 'Guardar foto'}</button>}
            </div>
          </div>
        </div>
      )}

      {fotoOpen && foto && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setFotoOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(31,22,17,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
        >
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setFotoOpen(false)}
            style={{ position: 'absolute', top: '16px', right: '16px', width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: '#FFF8EC', color: '#1F1611', fontSize: '1.5rem', lineHeight: 1, cursor: 'pointer' }}
          >×</button>
          <img
            src={foto}
            alt="Foto de perfil"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 'min(92vw, 520px)', maxHeight: '82vh', width: 'auto', height: 'auto', objectFit: 'contain', borderRadius: '12px', backgroundColor: '#fff' }}
          />
        </div>
      )}
    </div>
  )
}

/* ── Tab: Favoritos ── */
function TabFavoritos({ favoritos }) {
  const [filtro, setFiltro] = useState('todos')

  const catBuckets = useMemo(() => {
    const map = new Map()
    favoritos.forEach(f => {
      const cat = f.lugares?.categorias?.nombre || 'Otros'
      map.set(cat, (map.get(cat) || 0) + 1)
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [favoritos])

  const filtrados = useMemo(() => {
    if (filtro === 'todos') return favoritos
    return favoritos.filter(f => (f.lugares?.categorias?.nombre || 'Otros') === filtro)
  }, [favoritos, filtro])

  if (!favoritos.length) return (
    <>
      <SectionHead title="Mis lugares favoritos" accent="los imperdibles" lede="Aún no guardaste nada. Tocá el ❤️ en cualquier lugar para verlo acá." />
      <div className="perfil-empty">
        <div className="icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="#1F1611" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>
        <p>Explorá la app y guardá lugares tocando el corazón.</p>
      </div>
    </>
  )

  return (
    <>
      <SectionHead
        title="Mis lugares favoritos"
        accent="los imperdibles"
        lede={`${favoritos.length} ${favoritos.length === 1 ? 'lugar guardado' : 'lugares guardados'} — tocá cualquiera para revivirlo.`}
      />
      <div className="sp-chips">
        <button className={`sp-chip${filtro === 'todos' ? ' active' : ''}`} onClick={() => setFiltro('todos')}>Todos · {favoritos.length}</button>
        {catBuckets.map(([cat, n]) => (
          <button key={cat} className={`sp-chip${filtro === cat ? ' active' : ''}`} onClick={() => setFiltro(cat)}>{cat} · {n}</button>
        ))}
      </div>
      <div className="perfil-fav-grid">
        {filtrados.map(fav => {
          const l = fav.lugares
          if (!l) return null
          const img = resolveImageUrl(l.imagen_principal, 'lugares-fotos')
          const cat = l.categorias?.nombre
          return (
            <Link to={`/lugar/${l.id}`} key={fav.lugar_id} className="perfil-fav-card">
              <div className="img-wrap">
                {img
                  ? <img src={img} alt={l.nombre} loading="lazy" />
                  : <span style={{ fontSize: '2rem' }}>🏝️</span>}
                {cat && <span className="cat-badge">{cat}</span>}
              </div>
              <div className="info">
                <h3>{l.nombre}</h3>
                {l.departamentos?.nombre && <p>📍 {l.departamentos.nombre}</p>}
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}

/* ── Tab: Historial ── */
function TabHistorial({ historial }) {
  const [rango, setRango] = useState('30')

  const filtrado = useMemo(() => {
    const now = new Date()
    return historial.filter(h => {
      if (!h.visited_at) return false
      const d = new Date(h.visited_at)
      if (rango === 'todo') return true
      if (rango === '30') return diffDays(now, d) <= 30
      if (rango === 'mes') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      if (rango === 'ano') return d.getFullYear() === now.getFullYear()
      return true
    })
  }, [historial, rango])

  const grupos = useMemo(() => {
    const now = new Date()
    const buckets = { hoy: [], ayer: [], semana: [], antes: [] }
    filtrado.forEach(h => {
      if (!h.visited_at) return
      const dd = diffDays(now, new Date(h.visited_at))
      if (dd <= 0) buckets.hoy.push(h)
      else if (dd === 1) buckets.ayer.push(h)
      else if (dd <= 7) buckets.semana.push(h)
      else buckets.antes.push(h)
    })
    return buckets
  }, [filtrado])

  const visitasEstaSemana = useMemo(() => {
    const now = new Date()
    return historial.filter(h => h.visited_at && diffDays(now, new Date(h.visited_at)) <= 7).length
  }, [historial])

  if (!historial.length) return (
    <>
      <SectionHead title="Por dónde anduviste" accent="tu bitácora" lede="Cuando visites un lugar va a aparecer acá, ordenado por día." />
      <div className="perfil-empty">
        <div className="icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1F1611" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
        <p>Explorá lugares para generar tu historial.</p>
      </div>
    </>
  )

  const fmtFechaCabecera = (d) => {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    return `${dias[d.getDay()]} ${d.getDate()} de ${MES_LARGO[d.getMonth()]}`
  }

  const renderGroup = (key, pill, fecha, items) => {
    if (!items.length) return null
    return (
      <div className="perfil-hist-group" key={key}>
        <div className="perfil-hist-group-head">
          {pill && <span className="perfil-hist-group-pill">{pill}</span>}
          {fecha && <span className="perfil-hist-group-date">{fecha}</span>}
        </div>
        {items.map(h => {
          const l = h.lugares
          if (!l) return null
          const img = resolveImageUrl(l.imagen_principal, 'lugares-fotos')
          const catStyle = categoryStyle(l.categorias?.nombre)
          return (
            <Link to={`/lugar/${l.id}`} key={`${h.lugar_id}-${h.visited_at}`} className="perfil-hist-item">
              <div className="perfil-hist-thumb" style={img ? undefined : { background: catStyle.bg }}>
                {img ? <img src={img} alt="" loading="lazy" /> : <span>{catStyle.icon}</span>}
              </div>
              <div className="details">
                <h3>{l.nombre}</h3>
                <p>
                  <span style={{ fontWeight: 600, color: '#1F1611', fontSize: 13 }}>
                    Visitado {timeAgo(h.visited_at)}
                  </span>
                  {l.departamentos?.nombre && (
                    <span style={{ fontWeight: 400, color: '#7A6A5C', fontSize: 11 }}>
                      {' · '}{l.departamentos.nombre}
                    </span>
                  )}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <>
      <SectionHead
        title="Por dónde anduviste"
        accent="tu bitácora"
        lede={`${filtrado.length} ${filtrado.length === 1 ? 'visita' : 'visitas'} en este rango.`}
      />
      <div className="sp-chips">
        {[
          ['30', 'Últimos 30 días'],
          ['mes', 'Mes'],
          ['ano', 'Año'],
          ['todo', 'Todo'],
        ].map(([id, lbl]) => (
          <button key={id} className={`sp-chip${rango === id ? ' active' : ''}`} onClick={() => setRango(id)}>{lbl}</button>
        ))}
      </div>
      {visitasEstaSemana > 0 && (
        <div className="perfil-week-banner">
          Esta semana · {visitasEstaSemana} {visitasEstaSemana === 1 ? 'lugar' : 'lugares'} · ¡buen ritmo, viajero!
        </div>
      )}
      {filtrado.length === 0 ? (
        <div className="perfil-empty">
          <p>No hay visitas en este rango.</p>
        </div>
      ) : (
        <>
          {renderGroup('hoy', 'Hoy', fmtFechaCabecera(new Date()), grupos.hoy)}
          {renderGroup('ayer', 'Ayer', fmtFechaCabecera(new Date(Date.now() - 86400000)), grupos.ayer)}
          {renderGroup('semana', 'Esta semana', null, grupos.semana)}
          {renderGroup('antes', null, 'Anteriores', grupos.antes)}
        </>
      )}
    </>
  )
}

/* ── Tab: Solicitudes ── */
function TabSolicitudes({ solicitudes }) {
  const [filtro, setFiltro] = useState('todas')
  const navigate = useNavigate()

  const counts = useMemo(() => {
    const c = { total: solicitudes.length, pendiente: 0, aprobada: 0, denegada: 0 }
    solicitudes.forEach(s => { c[s.estado] = (c[s.estado] || 0) + 1 })
    return c
  }, [solicitudes])

  const filtradas = useMemo(() => {
    if (filtro === 'todas') return solicitudes
    return solicitudes.filter(s => s.estado === filtro)
  }, [solicitudes, filtro])

  if (!solicitudes.length) return (
    <>
      <SectionHead
        title="Lugares que enviaste"
        accent="tus aportes"
        lede="Cada lugar que mandás pasa por revisión humana antes de aparecer en Spotter."
      />
      <button className="perfil-sol-cta" onClick={() => navigate('/sugerir-lugar')}>+ Enviar nuevo lugar</button>
      <div className="perfil-empty">
        <div className="icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1F1611" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg></div>
        <p>No has enviado solicitudes.<br/>Sugerí un lugar nuevo y aparecerá acá.</p>
      </div>
    </>
  )

  return (
    <>
      <SectionHead
        title="Lugares que enviaste"
        accent="tus aportes"
        lede="Cada lugar que mandás pasa por revisión humana antes de aparecer en Spotter."
      />
      <button className="perfil-sol-cta" onClick={() => navigate('/sugerir-lugar')}>+ Enviar nuevo lugar</button>

      <div className="perfil-sol-stats">
        <div className="perfil-sol-stat">
          <div className="n">{counts.total}</div>
          <div className="l">solicitudes<br/>totales</div>
        </div>
        <div className="perfil-sol-stat">
          <div className="n">{counts.pendiente}</div>
          <div className="l">en revisión<br/>esperando</div>
        </div>
        <div className="perfil-sol-stat">
          <div className="n">{counts.aprobada}</div>
          <div className="l">aprobadas<br/>ya en el mapa</div>
        </div>
        <div className="perfil-sol-stat">
          <div className="n">{counts.denegada}</div>
          <div className="l">denegadas<br/>con motivo</div>
        </div>
      </div>

      <div className="sp-chips">
        {[
          ['todas', `Todas · ${counts.total}`],
          ['pendiente', `En revisión · ${counts.pendiente}`],
          ['aprobada', `Aprobadas · ${counts.aprobada}`],
          ['denegada', `Denegadas · ${counts.denegada}`],
        ].map(([id, lbl]) => (
          <button key={id} className={`sp-chip${filtro === id ? ' active' : ''}`} onClick={() => setFiltro(id)}>{lbl}</button>
        ))}
      </div>

      <div className="perfil-sol-list">
        {filtradas.map(s => {
          const estadoLabel = s.estado === 'aprobada' ? '✓ Aprobado' : s.estado === 'denegada' ? '✗ Denegado' : '⏳ En revisión'
          return (
            <div key={s.id} className="perfil-sol-card">
              <div className="perfil-sol-thumb">📍</div>
              <div className="perfil-sol-body">
                <h3>{s.nombre}</h3>
                <div className="perfil-sol-badges">
                  <span className={`perfil-sol-badge ${s.estado}`}>{estadoLabel}</span>
                  {s.ubicacion && <span className="perfil-sol-badge cat">{s.ubicacion}</span>}
                </div>
                <div className="perfil-sol-meta">{timeAgo(s.created_at)}</div>
                {s.estado === 'denegada' && s.motivo && (
                  <p className="perfil-sol-motivo"><strong>Motivo:</strong> {s.motivo}</p>
                )}
                {s.estado === 'denegada' && (
                  <button className="perfil-sol-resend" onClick={() => navigate('/sugerir-lugar')}>Editar y reenviar →</button>
                )}
              </div>
            </div>
          )
        })}
        {filtradas.length === 0 && (
          <div className="perfil-empty">
            <p>No hay solicitudes con este estado.</p>
          </div>
        )}
      </div>
    </>
  )
}

/* ── Tab: Guías ── */
function isGuiaCompletada(guia) {
  return guia?.paradas_config?._estado === 'completada'
}

function getGuiaFechaProgramada(guia) {
  return guia?.paradas_config?._guia_fecha || null
}

function puedeCompletarGuia(guia) {
  const fecha = getGuiaFechaProgramada(guia)
  if (!fecha) return true
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const programada = new Date(`${fecha}T00:00:00`)
  return programada <= hoy
}

function TabGuias({ guias, favoritosCount }) {
  const navigate = useNavigate()
  const [listaGuias, setListaGuias] = useState(guias)
  const [completandoId, setCompletandoId] = useState(null)

  useEffect(() => { setListaGuias(guias) }, [guias])

  const handleCompletar = async (guia) => {
    setCompletandoId(guia.id)
    const { data, error } = await completarGuia(guia)
    setCompletandoId(null)
    if (error) return
    setListaGuias((prev) => prev.map((item) => item.id === guia.id ? { ...item, ...data } : item))
  }

  if (!listaGuias.length) return (
    <>
      <SectionHead title="Mis guías de viaje" accent="tu propio mapa" lede="Armá rutas con tus lugares favoritos y compartilas con otros viajeros." />

      <div className="perfil-guias-hero">
        <span className="badge">Tu primera guía</span>
        <h3>Convertí tus favoritos en una ruta que otros puedan recorrer.</h3>
        <p>Una guía es una colección curada de lugares — con orden, notas y duración estimada. {favoritosCount > 0 ? `Llevás ${favoritosCount} favorito${favoritosCount === 1 ? '' : 's'}: ya tenés material para tu primera.` : 'Empezá guardando lugares con el ❤️ y armá tu primer recorrido.'}</p>
        <div className="cta-row">
          <button className="cta-primary" onClick={() => navigate('/guias')}>Crear mi primera ruta →</button>
          <button className="cta-secondary" onClick={() => navigate('/guias')}>Ver guías de inspiración</button>
        </div>
      </div>

      <div className="perfil-guias-tip">
        <span className="lbl">💡 tip</span>
        <span className="txt">Las guías con 5 a 8 paradas son las más exploradas por otros viajeros.</span>
      </div>

      <div className="perfil-guias-faq">
        <h4>¿Cómo funciona?<span className="accent">3 pasos, en serio</span></h4>
      </div>
    </>
  )

  return (
    <>
      <SectionHead
        title="Mis guías de viaje"
        accent="tu propio mapa"
        lede={`${listaGuias.length} ${listaGuias.length === 1 ? 'ruta guardada' : 'rutas guardadas'}.`}
      />

      <div className="perfil-guias-grid">
        {listaGuias.map((g, i) => {
          const paradas = g.lugares_ids?.length ?? 0
          const completada = isGuiaCompletada(g)
          const puedeCompletar = puedeCompletarGuia(g)
          const fechaProgramada = getGuiaFechaProgramada(g)
          const fecha = fechaProgramada
            ? new Date(fechaProgramada + 'T12:00:00').toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' })
            : ''
          return (
            <div key={g.id} className="perfil-guia-card" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="thumb">
                🗺️
                <span className="status-badge">{completada ? 'Completada' : 'Vista previa'}</span>
              </div>
              <div className="body">
                <h3>{g.nombre}</h3>
                <div className="meta">{paradas} parada{paradas !== 1 ? 's' : ''}{fecha ? ` · ${fecha}` : ''}</div>
                <span className={`perfil-guia-status-pill ${completada ? 'completada' : 'pendiente'}`}>{completada ? 'Completada' : 'Pendiente'}</span>
                <div className="actions">
                  <button className="btn" onClick={() => navigate(`/guias?ver=${g.id}`)}>Ver ruta</button>
                  {!completada && (
                    <>
                      <button className="btn primary" onClick={() => navigate(`/guias?editar=${g.id}`)}>Editar</button>
                      <button
                        className="btn complete"
                        disabled={completandoId === g.id || !puedeCompletar}
                        title={puedeCompletar ? 'Marcar como completada' : 'Disponible desde la fecha programada'}
                        onClick={() => handleCompletar(g)}
                      >
                        {completandoId === g.id ? '...' : 'Completar'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="perfil-guias-footer">
        <button className="perfil-guias-cta" onClick={() => navigate('/guias')}>+ Nueva guía</button>
      </div>
    </>
  )
}

/* ── Section header ── */
function SectionHead({ title, accent, lede }) {
  return (
    <div className="sp-section-head">
      <div className="row">
        <h2>{title}</h2>
        {accent && <span className="accent">{accent}</span>}
      </div>
      {lede && <p className="lede">{lede}</p>}
    </div>
  )
}
