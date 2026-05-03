import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { resolveImageUrl } from '../lib/imageUrl'
import Loader from '../components/Loader'
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

function SpotterLogo() {
  return (
    <svg viewBox="0 0 200 48" height="36" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 2 C13 2,5 10,5 20 C5 33,22 48,22 48 C22 48,39 33,39 20 C39 10 31 2,22 2 Z" fill="#F5A623" />
      <circle cx="22" cy="19" r="10" fill="#1a1a2e" />
      <path d="M10 19 C13 14,18 14,22 19 C26 24,31 24,34 19" fill="none" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
      <path d="M11 24 C14 20,18 20,22 24 C26 28,30 28,33 24" fill="none" stroke="#F5A623" strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
      <circle cx="33" cy="8" r="2.5" fill="#F5A623" opacity="0.4" />
      <text x="46" y="30" fontFamily="Georgia, serif" fontSize="26" fontWeight="700" letterSpacing="-1" fill="#1a1a2e">
        <tspan fill="#F5A623">S</tspan><tspan fill="#1a1a2e">potter</tspan>
      </text>
    </svg>
  )
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

  // ui
  const [tab, setTab] = useState('favoritos')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [modalType, setModalType] = useState(null) // 'editBio' | 'editPhoto'

  // edit bio
  const [editNombre, setEditNombre] = useState('')
  const [editBio, setEditBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null) // {type,text}

  // edit photo
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')

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

    const { data: u } = await supabase
      .from('usuarios').select('*')
      .eq('auth_id', sess.user.id).maybeSingle()
    if (!u) { setLoading(false); return }
    setPerfil(u)
    setEditNombre(u.nombre || '')
    setEditBio(u.bio || '')

    const uid = u.id

    // favoritos
    const { data: favs } = await supabase
      .from('favoritos')
      .select('lugar_id, lugares(id,nombre,imagen_principal,departamentos(nombre))')
      .eq('usuario_id', uid)
      .order('created_at', { ascending: false })
    setFavoritos(favs ?? [])

    // historial (last 3)
    const { data: hist } = await supabase
      .from('historial_visitas')
      .select('lugar_id, visited_at, lugares(id,nombre,departamentos(nombre))')
      .eq('usuario_id', uid)
      .order('visited_at', { ascending: false })
      .limit(3)
    setHistorial(hist ?? [])

    // solicitudes
    const { data: sols } = await supabase
      .from('sugerencias')
      .select('id,nombre,ubicacion,estado,created_at')
      .eq('usuario_id', uid)
      .order('created_at', { ascending: false })
    setSolicitudes(sols ?? [])

    setLoading(false)
  }, [])

  useEffect(() => { if (session) loadData(session) }, [session, loadData])

  useEffect(() => {
    return () => { if (photoPreview) URL.revokeObjectURL(photoPreview) }
  }, [photoPreview])

  /* ── save bio ── */
  const handleSaveBio = async () => {
    setMsg(null)
    if (!editNombre.trim() || editNombre.trim().length < 3) {
      setMsg({ type: 'error', text: 'El nombre debe tener al menos 3 caracteres.' }); return
    }
    if (editBio.length > 200) {
      setMsg({ type: 'error', text: 'La descripción no puede superar 200 caracteres.' }); return
    }
    setSaving(true)
    const { error } = await supabase
      .from('usuarios')
      .update({ nombre: editNombre.trim(), bio: editBio.trim() })
      .eq('auth_id', session.user.id)
    setSaving(false)
    if (error) { setMsg({ type: 'error', text: 'Error al guardar.' }); return }
    setPerfil(p => ({ ...p, nombre: editNombre.trim(), bio: editBio.trim() }))
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
    await supabase.from('usuarios').update({ foto_perfil: url }).eq('auth_id', session.user.id)
    setPerfil(p => ({ ...p, foto_perfil: url }))
    setPhotoFile(null); setPhotoPreview('')
    setSaving(false)
    setMsg({ type: 'success', text: '¡Foto actualizada!' })
    setTimeout(() => setModalType(null), 800)
  }

  const handleRemovePhoto = async () => {
    setSaving(true); setMsg(null)
    await supabase.from('usuarios').update({ foto_perfil: '' }).eq('auth_id', session.user.id)
    setPerfil(p => ({ ...p, foto_perfil: '' }))
    setSaving(false)
    setMsg({ type: 'success', text: 'Foto eliminada.' })
    setTimeout(() => setModalType(null), 800)
  }

  /* ── render ── */
  if (loading) {
    return <div className="perfil-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader text="Cargando perfil…" /></div>
  }

  const foto = perfil?.foto_perfil
  const inicial = (perfil?.nombre || 'U').charAt(0).toUpperCase()
  const joinDate = perfil?.created_at ? new Date(perfil.created_at).toLocaleDateString('es', { month: 'long', year: 'numeric' }) : ''

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
              ? <img src={foto} alt="avatar" className="perfil-avatar" />
              : <div className="perfil-avatar-placeholder">{inicial}</div>}
          </div>
          <div className="perfil-info">
            <h1>{perfil?.nombre || 'Usuario'}</h1>
            {perfil?.bio && <p className="bio">{perfil.bio}</p>}
            {joinDate && <p className="joined">📅 Se unió en {joinDate}</p>}
          </div>
        </div>

        <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
          <button className="perfil-settings-btn" onClick={() => setSettingsOpen(!settingsOpen)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Configuración
          </button>
          {settingsOpen && (
            <div className="perfil-settings-dd">
              <button onClick={() => { setSettingsOpen(false); setMsg(null); setModalType('editBio') }}>✏️ Editar perfil</button>
              <button onClick={() => { setSettingsOpen(false); setMsg(null); setPhotoFile(null); setPhotoPreview(''); setModalType('editPhoto') }}>📷 Editar foto de perfil</button>
            </div>
          )}
        </div>
      </div>

      {/* tabs */}
      <div className="perfil-tabs">
        {['favoritos', 'historial', 'solicitudes'].map(t => (
          <button key={t} className={`perfil-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t === 'favoritos' ? '❤️ Favoritos' : t === 'historial' ? '🕒 Historial' : '📩 Solicitudes'}
          </button>
        ))}
      </div>

      {/* content */}
      <div className="perfil-content">
        {tab === 'favoritos' && <TabFavoritos favoritos={favoritos} />}
        {tab === 'historial' && <TabHistorial historial={historial} />}
        {tab === 'solicitudes' && <TabSolicitudes solicitudes={solicitudes} />}
      </div>

      {/* modals */}
      {modalType === 'editBio' && (
        <div className="perfil-modal-overlay" onClick={() => setModalType(null)}>
          <div className="perfil-modal" onClick={e => e.stopPropagation()}>
            <h2>Editar perfil</h2>
            {msg && <div className={`perfil-msg ${msg.type}`}>{msg.text}</div>}
            <label>Nombre de usuario</label>
            <input type="text" value={editNombre} onChange={e => setEditNombre(e.target.value.slice(0, 30))} placeholder="Tu nombre público" />
            <div className="counter">{editNombre.length}/30</div>
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
                <img src={photoPreview} alt="preview" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid #e5e7eb' }} />
              </div>
            )}

            <div className="perfil-photo-options">
              <label className="perfil-photo-upload">
                <input type="file" accept="image/*" onChange={handlePhotoSelect} />
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span style={{ fontSize: '0.88rem', color: '#374151' }}>{photoFile ? photoFile.name : 'Subir nueva foto'}</span>
              </label>
              {perfil?.foto_perfil && (
                <button className="perfil-remove-btn" onClick={handleRemovePhoto} disabled={saving}>🗑️ Quitar foto actual</button>
              )}
            </div>

            <div className="actions">
              <button className="btn-secondary" onClick={() => setModalType(null)}>Cancelar</button>
              {photoFile && <button className="btn-primary" disabled={saving} onClick={handleSavePhoto}>{saving ? 'Guardando...' : 'Guardar foto'}</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Tab: Favoritos ── */
function TabFavoritos({ favoritos }) {
  if (!favoritos.length) return (
    <div className="perfil-empty">
      <div className="icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="#0EA5E9" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>
      <p>Aún no tenés favoritos.<br/>Explorá y guardá lugares tocando el ❤️</p>
    </div>
  )
  return (
    <div className="perfil-fav-grid">
      {favoritos.map(fav => {
        const l = fav.lugares
        if (!l) return null
        const img = resolveImageUrl(l.imagen_principal, 'lugares-fotos')
        return (
          <Link to={`/lugar/${l.id}`} key={fav.lugar_id} className="perfil-fav-card" style={{ textDecoration: 'none' }}>
            {img
              ? <img src={img} alt={l.nombre} loading="lazy" />
              : <div style={{ width: '100%', aspectRatio: '4/3', background: 'linear-gradient(135deg,#0EA5E9,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '2rem' }}>🏝️</span></div>}
            <div className="info">
              <h3>{l.nombre}</h3>
              {l.departamentos?.nombre && <p>📍 {l.departamentos.nombre}</p>}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

/* ── Tab: Historial ── */
function TabHistorial({ historial }) {
  if (!historial.length) return (
    <div className="perfil-empty">
      <div className="icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
      <p>No hay visitas recientes.<br/>Explorá lugares para generar tu historial.</p>
    </div>
  )
  return (
    <div className="perfil-hist-list">
      {historial.map((h, i) => {
        const l = h.lugares
        if (!l) return null
        return (
          <Link to={`/lugar/${l.id}`} key={h.lugar_id} className="perfil-hist-item">
            <div className="num">{i + 1}</div>
            <div className="details">
              <h3>{l.nombre}</h3>
              <p>{l.departamentos?.nombre ? `📍 ${l.departamentos.nombre} · ` : ''}{timeAgo(h.visited_at)}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

/* ── Tab: Solicitudes ── */
function TabSolicitudes({ solicitudes }) {
  if (!solicitudes.length) return (
    <div className="perfil-empty">
      <div className="icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg></div>
      <p>No has enviado solicitudes.<br/>Sugerí un lugar nuevo desde el menú.</p>
    </div>
  )
  return (
    <div className="perfil-sol-list">
      {solicitudes.map(s => (
        <div key={s.id} className="perfil-sol-item">
          <div className="sol-info">
            <h3>{s.nombre}</h3>
            <p>{s.ubicacion ? `📍 ${s.ubicacion} · ` : ''}{timeAgo(s.created_at)}</p>
          </div>
          <span className={`perfil-sol-badge ${s.estado || 'pendiente'}`}>
            {s.estado === 'aprobada' ? '✓ Aprobada' : s.estado === 'denegada' ? '✗ Denegada' : '⏳ Pendiente'}
          </span>
        </div>
      ))}
    </div>
  )
}
