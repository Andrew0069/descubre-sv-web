import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getLugaresHome, getLugaresByIds } from '../services/lugaresService'
import { getGuiasByUser, createGuia, updateGuia, deleteGuia } from '../services/guiasService'
import { resolveImageUrl } from '../lib/imageUrl'

// ─── helpers ────────────────────────────────────────────────────────────────

function getThumb(lugar) {
  const src =
    lugar.imagen_principal?.trim() ||
    lugar.imagenes_lugar
      ?.slice()
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      .find((f) => f?.ruta_imagen?.trim())?.ruta_imagen ||
    null
  return resolveImageUrl(src, 'lugares-fotos', {
    transform: { width: 400, height: 300, resize: 'cover' },
  })
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-SV', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ─── sub-components ─────────────────────────────────────────────────────────

function Toast({ msg }) {
  if (!msg) return null
  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        bottom: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#111827',
        color: '#fff',
        padding: '0.75rem 1.5rem',
        borderRadius: '50px',
        fontSize: '0.85rem',
        fontWeight: 500,
        zIndex: 9999,
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        animation: 'fadeInUpToast 0.25s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {msg}
    </div>
  )
}

// Dot stepper below the timeline
function StepperDots({ count, max = 8 }) {
  const dots = Math.min(count + 1, max)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginTop: '12px' }}>
      {Array.from({ length: dots }).map((_, i) => {
        const filled = i < count
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: filled ? '12px' : '10px',
              height: filled ? '12px' : '10px',
              borderRadius: '50%',
              backgroundColor: filled ? '#F5C842' : '#e5e7eb',
              border: filled ? '2px solid #e6b800' : '2px solid #d1d5db',
              transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              flexShrink: 0,
            }} />
            {i < dots - 1 && (
              <div style={{
                width: '28px',
                height: '2px',
                borderTop: filled ? '2px dashed #F5C842' : '2px dashed #e5e7eb',
                transition: 'border-color 0.3s ease',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Single card in the route timeline
function TimelineCard({ lugar, onRemove }) {
  const [hov, setHov] = useState(false)
  const thumb = getThumb(lugar)

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative',
        width: '160px',
        flexShrink: 0,
        borderRadius: '14px',
        overflow: 'hidden',
        backgroundColor: '#fff',
        border: '2px solid #F5C842',
        boxShadow: hov
          ? '0 8px 28px rgba(245,200,66,0.35)'
          : '0 3px 12px rgba(0,0,0,0.08)',
        transform: hov ? 'scale(1.04)' : 'scale(1)',
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease',
        cursor: 'default',
      }}
    >
      {/* remove button */}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar ${lugar.nombre}`}
        style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
          zIndex: 10,
          backgroundColor: 'rgba(239,68,68,0.85)',
          border: 'none',
          borderRadius: '50%',
          width: '22px',
          height: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#fff',
          fontSize: '0.7rem',
          fontWeight: 700,
          lineHeight: 1,
          backdropFilter: 'blur(4px)',
        }}
      >
        ✕
      </button>

      {/* image */}
      <div style={{ width: '100%', height: '100px', overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
        {thumb ? (
          <img
            src={thumb}
            alt={lugar.nombre}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: `linear-gradient(135deg, ${lugar.categorias?.color || '#0EA5E9'} 0%, #38bdf8 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem',
          }}>
            📍
          </div>
        )}
      </div>

      {/* info */}
      <div style={{ padding: '8px 10px 10px' }}>
        <p style={{
          fontSize: '0.8rem',
          fontWeight: 700,
          color: '#111827',
          margin: 0,
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {lugar.nombre}
        </p>
        {lugar.departamentos?.nombre && (
          <p style={{ fontSize: '0.7rem', color: '#9ca3af', margin: '3px 0 0', lineHeight: 1.2 }}>
            📍 {lugar.departamentos.nombre}
          </p>
        )}
      </div>
    </div>
  )
}

// Arrow connector between timeline cards
function Arrow() {
  return (
    <div style={{
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      paddingBottom: '20px', // align with image center roughly
    }}>
      <svg width="28" height="16" viewBox="0 0 28 16" fill="none">
        <path d="M0 8 H22 M18 2 L26 8 L18 14" stroke="#F5C842" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

// Mini card in the search grid
function LugarChip({ lugar, enRuta, onAdd }) {
  const [hov, setHov] = useState(false)
  const thumb = getThumb(lugar)

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: '#fff',
        border: enRuta ? '2px solid #F5C842' : '1px solid #e5e7eb',
        boxShadow: hov ? '0 6px 20px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.05)',
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ width: '100%', aspectRatio: '4/3', overflow: 'hidden', backgroundColor: '#f3f4f6', flexShrink: 0 }}>
        {thumb ? (
          <img
            src={thumb}
            alt={lugar.nombre}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: `linear-gradient(135deg, ${lugar.categorias?.color || '#0EA5E9'} 0%, #38bdf8 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem',
          }}>
            📍
          </div>
        )}
      </div>

      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111827', margin: '0 0 2px', lineHeight: 1.3 }}>
          {lugar.nombre}
        </p>
        {lugar.departamentos?.nombre && (
          <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: '0 0 8px', lineHeight: 1.2 }}>
            {lugar.departamentos.nombre}
          </p>
        )}
        {lugar.categorias?.nombre && (
          <span style={{
            alignSelf: 'flex-start',
            fontSize: '0.68rem',
            fontWeight: 600,
            backgroundColor: `${lugar.categorias?.color || '#0EA5E9'}18`,
            color: lugar.categorias?.color || '#0EA5E9',
            borderRadius: '20px',
            padding: '2px 8px',
            marginBottom: '8px',
          }}>
            {lugar.categorias.nombre}
          </span>
        )}
        <button
          type="button"
          onClick={() => !enRuta && onAdd(lugar)}
          style={{
            marginTop: 'auto',
            padding: '6px 0',
            borderRadius: '8px',
            border: enRuta ? '1.5px solid #F5C842' : '1.5px solid #F5C842',
            backgroundColor: enRuta ? '#FEF9E7' : '#F5C842',
            color: enRuta ? '#92400e' : '#111827',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: enRuta ? 'default' : 'pointer',
            transition: 'background-color 0.2s ease',
            width: '100%',
          }}
        >
          {enRuta ? '✓ En tu ruta' : '+ Añadir a ruta'}
        </button>
      </div>
    </div>
  )
}

// Saved guide row
function GuiaItem({ guia, lugares, onCargar, onEliminar }) {
  const [confirmando, setConfirmando] = useState(false)
  const paradas = guia.lugares_ids?.length ?? 0
  const thumbLugar = lugares.find((l) => l.id === guia.lugares_ids?.[0])
  const thumb = thumbLugar ? getThumb(thumbLugar) : null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      padding: '14px 18px',
      backgroundColor: '#fffbeb',
      borderRadius: '12px',
      borderLeft: '4px solid #F5C842',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    }}>
      {/* thumb */}
      <div style={{
        width: '56px', height: '56px', borderRadius: '10px',
        overflow: 'hidden', flexShrink: 0, backgroundColor: '#f3f4f6',
      }}>
        {thumb ? (
          <img src={thumb} alt={guia.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#F5C842,#e6b800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🗺️</div>
        )}
      </div>

      {/* info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827', margin: '0 0 2px', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {guia.nombre}
        </p>
        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
          {paradas} parada{paradas !== 1 ? 's' : ''} · {formatDate(guia.created_at)}
        </p>
      </div>

      {/* actions */}
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => onCargar(guia)}
          style={{
            padding: '6px 14px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#F5C842',
            color: '#111827',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Editar
        </button>
        {confirmando ? (
          <button
            type="button"
            onClick={() => { onEliminar(guia.id); setConfirmando(false) }}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#ef4444',
              color: '#fff',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ¿Seguro?
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1.5px solid #e5e7eb',
              backgroundColor: '#fff',
              color: '#6b7280',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Eliminar
          </button>
        )}
      </div>
    </div>
  )
}

// ─── guia viewer helpers ─────────────────────────────────────────────────────

function buildRouteMapUrl(lugaresList) {
  if (!lugaresList || lugaresList.length === 0) return null
  const wps = lugaresList.map((l) =>
    l.latitud && l.longitud
      ? `${l.latitud},${l.longitud}`
      : encodeURIComponent(`${l.nombre}, El Salvador`)
  )
  if (wps.length === 1) return `https://www.google.com/maps?q=${wps[0]}&output=embed`
  return `https://www.google.com/maps/dir/${wps.join('/')}/?output=embed`
}

function ViewerStop({ lugar, index, isLast }) {
  return (
    <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: '#F5C842', color: '#111827',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.78rem', fontWeight: 800, flexShrink: 0,
        }}>{index + 1}</div>
        {!isLast && (
          <div style={{ width: 2, flex: 1, minHeight: 20, background: 'rgba(245,200,66,0.25)', margin: '4px 0' }} />
        )}
      </div>
      <div style={{ paddingTop: 4, minWidth: 0 }}>
        <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', margin: '0 0 2px', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lugar.nombre}
        </p>
        {lugar.departamentos?.nombre && (
          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            📍 {lugar.departamentos.nombre}
          </p>
        )}
        {lugar.categorias?.nombre && (
          <span style={{
            display: 'inline-block', marginTop: 4,
            fontSize: '0.65rem', fontWeight: 600,
            background: `${lugar.categorias.color || '#0EA5E9'}25`,
            color: lugar.categorias.color || '#93c5fd',
            borderRadius: 20, padding: '2px 7px',
          }}>
            {lugar.categorias.nombre}
          </span>
        )}
      </div>
    </li>
  )
}

function GuiaViewer({ guia, lugares, loading, navigate }) {
  const mapSrc = buildRouteMapUrl(lugares)
  return (
    <div style={{ minHeight: '100vh', background: '#0d0d1a' }}>
      <style>{`
        .gv-layout { display:flex; flex-direction:column; }
        .gv-panel  { min-height:240px; overflow-y:auto; }
        .gv-map    { min-height:280px; height:280px; }
        @media (min-width:768px) {
          .gv-layout { flex-direction:row; height:calc(100vh - 56px); }
          .gv-panel  { width:320px; height:100%; overflow-y:auto; }
          .gv-map    { flex:1; height:100% !important; }
        }
      `}</style>

      {/* Barra superior */}
      <div style={{
        background: '#1a1a2e', padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button
          onClick={() => navigate('/guias')}
          style={{ background: 'none', border: 'none', color: '#F5C842', cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1, padding: 0 }}
        >←</button>
        <h2 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {guia.nombre}
        </h2>
        <button
          onClick={() => navigate(`/guias?editar=${guia.id}`)}
          style={{ background: '#F5C842', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700, color: '#111827', cursor: 'pointer', flexShrink: 0 }}
        >
          Editar ruta
        </button>
      </div>

      {/* Cuerpo dos paneles */}
      <div className="gv-layout">
        {/* Panel lista oscuro */}
        <div className="gv-panel" style={{ background: '#1a1a2e', padding: '20px 16px' }}>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
            Puntos de la ruta
          </p>
          {loading ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 40 }}>Cargando paradas…</p>
          ) : lugares.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 40 }}>Esta guía no tiene lugares.</p>
          ) : (
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {lugares.map((l, i) => (
                <ViewerStop key={l.id} lugar={l} index={i} isLast={i === lugares.length - 1} />
              ))}
            </ol>
          )}
          {guia.descripcion && (
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', marginTop: 24, lineHeight: 1.5 }}>
              {guia.descripcion}
            </p>
          )}
        </div>

        {/* Panel mapa */}
        <div className="gv-map" style={{ position: 'relative', background: '#0d0d1a' }}>
          {!mapSrc || loading ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem', padding: '0 1.5rem', textAlign: 'center' }}>
              {loading ? 'Cargando mapa…' : 'Agregá al menos 2 lugares para ver la ruta'}
            </div>
          ) : (
            <iframe
              title={`Ruta: ${guia.nombre}`}
              src={mapSrc}
              width="100%"
              height="100%"
              style={{ border: 0, display: 'block', minHeight: 280 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function Guias() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const verIdParam    = searchParams.get('ver')
  const editarParam   = searchParams.get('editar')

  const [lugares, setLugares] = useState([])
  const [categorias, setCategorias] = useState([])
  const [rutaActual, setRutaActual] = useState([])
  const [rutaNombre, setRutaNombre] = useState('')
  const [search, setSearch] = useState('')
  const [catFiltro, setCatFiltro] = useState(null)
  const [misGuias, setMisGuias] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [user, setUser] = useState(null)
  const [toast, setToast] = useState(null)
  const [guiaEditandoId, setGuiaEditandoId] = useState(null)
  const [loadingLugares, setLoadingLugares] = useState(true)
  const timelineRef = useRef(null)

  // viewer state
  const [guiaViewer, setGuiaViewer]       = useState(null)
  const [viewerLugares, setViewerLugares] = useState([])
  const [viewerLoading, setViewerLoading] = useState(false)

  const showToast = useCallback((msg, ms = 3000) => {
    setToast(msg)
    setTimeout(() => setToast(null), ms)
  }, [])

  // auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // load lugares
  useEffect(() => {
    let cancelled = false
    setLoadingLugares(true)
      ; (async () => {
        const { data } = await getLugaresHome()
        if (!cancelled) {
          setLugares(data ?? [])
          const cats = []
          const seen = new Set()
          for (const l of data ?? []) {
            if (l.categorias && !seen.has(l.categorias.id)) {
              cats.push(l.categorias)
              seen.add(l.categorias.id)
            }
          }
          setCategorias(cats)
          setLoadingLugares(false)
        }
      })()
    return () => { cancelled = true }
  }, [])

  // load saved guides when user available
  useEffect(() => {
    if (!user) { setMisGuias([]); return }
    let cancelled = false
      ; (async () => {
        const { data } = await getGuiasByUser(user.id)
        if (!cancelled) setMisGuias(data ?? [])
      })()
    return () => { cancelled = true }
  }, [user])

  // ?ver= param → open viewer
  useEffect(() => {
    if (!verIdParam) { setGuiaViewer(null); return }
    const guia = misGuias.find((g) => g.id === verIdParam)
    if (!guia) return
    let cancelled = false
    setViewerLoading(true)
    setGuiaViewer(guia)
    ;(async () => {
      const { data } = await getLugaresByIds(guia.lugares_ids || [])
      if (cancelled) return
      const map = Object.fromEntries((data ?? []).map((l) => [l.id, l]))
      setViewerLugares((guia.lugares_ids || []).map((id) => map[id]).filter(Boolean))
      setViewerLoading(false)
    })()
    return () => { cancelled = true }
  }, [verIdParam, misGuias])

  // ?editar= param → pre-load guide into editor
  useEffect(() => {
    if (!editarParam || misGuias.length === 0 || lugares.length === 0) return
    const guia = misGuias.find((g) => g.id === editarParam)
    if (guia) handleCargar(guia)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editarParam, misGuias, lugares])

  // filtered search results
  const lugaresVisibles = useMemo(() => {
    let list = lugares
    if (catFiltro) list = list.filter((l) => l.categoria_id === catFiltro)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((l) => l.nombre?.toLowerCase().includes(q))
    }
    return list
  }, [lugares, catFiltro, search])

  const rutaIds = useMemo(() => new Set(rutaActual.map((l) => l.id)), [rutaActual])

  const handleAdd = useCallback((lugar) => {
    setRutaActual((prev) => {
      if (prev.some((l) => l.id === lugar.id)) return prev
      return [...prev, lugar]
    })
    // scroll timeline to end after state update
    setTimeout(() => {
      if (timelineRef.current) {
        timelineRef.current.scrollTo({ left: timelineRef.current.scrollWidth, behavior: 'smooth' })
      }
    }, 80)
  }, [])

  const handleRemove = useCallback((id) => {
    setRutaActual((prev) => prev.filter((l) => l.id !== id))
  }, [])

  const handleLimpiar = () => {
    setRutaActual([])
    setRutaNombre('')
    setGuiaEditandoId(null)
  }

  const handleGuardar = async () => {
    if (!user) {
      navigate('/login', { state: { from: '/guias' } })
      return
    }
    if (!rutaNombre.trim()) { showToast('Escribe un nombre para tu ruta primero.'); return }
    if (rutaActual.length < 2) { showToast('Agrega al menos 2 lugares a tu ruta.'); return }

    setGuardando(true)
    const payload = {
      user_id: user.id,
      nombre: rutaNombre.trim(),
      descripcion: null,
      lugares_ids: rutaActual.map((l) => l.id),
    }

    let result
    if (guiaEditandoId) {
      result = await updateGuia(guiaEditandoId, payload)
    } else {
      result = await createGuia(payload)
    }
    setGuardando(false)

    if (result.error) {
      showToast('Ocurrió un error al guardar. Intenta de nuevo.')
      return
    }

    const { data: updated } = await getGuiasByUser(user.id)
    setMisGuias(updated ?? [])
    showToast(guiaEditandoId ? '¡Ruta actualizada!' : '¡Ruta guardada!')
    handleLimpiar()
  }

  const handleCargar = (guia) => {
    const lugaresDeGuia = guia.lugares_ids
      .map((id) => lugares.find((l) => l.id === id))
      .filter(Boolean)
    setRutaActual(lugaresDeGuia)
    setRutaNombre(guia.nombre)
    setGuiaEditandoId(guia.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEliminar = async (id) => {
    await deleteGuia(id)
    setMisGuias((prev) => prev.filter((g) => g.id !== id))
    if (guiaEditandoId === id) handleLimpiar()
    showToast('Ruta eliminada.')
  }

  if (guiaViewer) {
    return (
      <GuiaViewer
        guia={guiaViewer}
        lugares={viewerLugares}
        loading={viewerLoading}
        navigate={navigate}
      />
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      <style>{`
        @keyframes fadeInUpToast {
          from { opacity:0; transform:translateX(-50%) translateY(10px); }
          to { opacity:1; transform:translateX(-50%) translateY(0); }
        }
        @keyframes guiaFadeUp {
          from { opacity:0; transform:translateY(16px); }
          to { opacity:1; transform:translateY(0); }
        }
        .guia-fade-up { animation: guiaFadeUp 0.4s ease forwards; }
        .guia-chip-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }
        @media(min-width:640px) { .guia-chip-grid { grid-template-columns: repeat(3, 1fr); } }
        @media(min-width:1024px) { .guia-chip-grid { grid-template-columns: repeat(4, 1fr); } }
        .timeline-scroll::-webkit-scrollbar { height: 4px; }
        .timeline-scroll::-webkit-scrollbar-track { background: #f3f4f6; border-radius: 4px; }
        .timeline-scroll::-webkit-scrollbar-thumb { background: #F5C842; border-radius: 4px; }
      `}</style>

      {/* ── NAV ── */}
      <header style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 2rem',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
          <Link
            to="/"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}
            aria-label="Volver a inicio"
          >
            <svg viewBox="0 0 200 48" height="34" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2 C13 2, 5 10, 5 20 C5 33, 22 48, 22 48 C22 48, 39 33, 39 20 C39 10 31 2, 22 2 Z" fill="#F5A623" />
              <circle cx="22" cy="19" r="10" fill="#1a1a2e" />
              <path d="M10 19 C13 14, 18 14, 22 19 C26 24, 31 24, 34 19" fill="none" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
              <path d="M11 24 C14 20, 18 20, 22 24 C26 28, 30 28, 33 24" fill="none" stroke="#F5A623" strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
              <circle cx="33" cy="8" r="2.5" fill="#F5A623" opacity="0.4" />
              <text x="46" y="30" fontFamily="Georgia, serif" fontSize="26" fontWeight="700" letterSpacing="-1" fill="#1a1a2e">
                <tspan fill="#F5A623">S</tspan><tspan fill="#1a1a2e">potter</tspan>
              </text>
            </svg>
          </Link>
          <span style={{ fontSize: '0.8rem', color: '#9ca3af', marginLeft: '4px' }}>/ Guías</span>
          <Link
            to="/"
            style={{
              marginLeft: 'auto',
              fontSize: '0.82rem',
              color: '#6b7280',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 500,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Inicio
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #f3f4f6',
        padding: 'clamp(48px, 8vw, 80px) 1.5rem clamp(40px, 6vw, 64px)',
        textAlign: 'center',
        backgroundImage: 'radial-gradient(circle at 20% 50%, #fffbeb 0%, transparent 60%), radial-gradient(circle at 80% 20%, #fef9ef 0%, transparent 50%)',
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <span style={{
            display: 'inline-block',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#92400e',
            backgroundColor: '#fef3c7',
            padding: '4px 14px',
            borderRadius: '20px',
            marginBottom: '20px',
          }}>
            🗺️ Guías de viaje
          </span>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 5vw, 3rem)',
            fontWeight: 800,
            color: '#111827',
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '16px',
          }}>
            Armá tu ruta perfecta<br />
            <span style={{ color: '#F5A623' }}>por El Salvador</span>
          </h1>
          <p style={{
            fontSize: 'clamp(0.9rem, 2vw, 1.05rem)',
            color: '#6b7280',
            lineHeight: 1.65,
            marginBottom: '32px',
          }}>
            Elegí los lugares que querés visitar, ordenálos a tu gusto y guardá tu itinerario personalizado.
          </p>
          {rutaActual.length === 0 && (
            <button
              type="button"
              className="btn-spring"
              onClick={() => document.getElementById('buscador')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                backgroundColor: '#F5C842',
                color: '#111827',
                border: 'none',
                borderRadius: '50px',
                padding: '0.75rem 2rem',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(245,200,66,0.4)',
                letterSpacing: '0.01em',
              }}
            >
              + Crear mi ruta
            </button>
          )}
        </div>
      </section>

      {/* ── TIMELINE (visible when route has items) ── */}
      {rutaActual.length > 0 && (
        <section className="guia-fade-up" style={{
          backgroundColor: '#fff',
          borderBottom: '1px solid #f3f4f6',
          padding: '28px 0 24px',
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
            {/* header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <input
                  type="text"
                  value={rutaNombre}
                  onChange={(e) => setRutaNombre(e.target.value)}
                  placeholder="Nombre de tu ruta…"
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #e5e7eb',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#111827',
                    outline: 'none',
                    backgroundColor: '#fafafa',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#F5C842' }}
                  onBlur={(e) => { e.target.style.borderColor = '#e5e7eb' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  type="button"
                  className="btn-spring"
                  onClick={handleGuardar}
                  disabled={guardando}
                  style={{
                    backgroundColor: '#F5C842',
                    color: '#111827',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 20px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: guardando ? 'wait' : 'pointer',
                    opacity: guardando ? 0.7 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {guardando ? 'Guardando…' : guiaEditandoId ? '💾 Actualizar' : '💾 Guardar ruta'}
                </button>
                <button
                  type="button"
                  onClick={handleLimpiar}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#9ca3af',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: '10px',
                    padding: '10px 16px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Limpiar
                </button>
              </div>
            </div>

            {/* stepper label */}
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '10px', fontWeight: 500 }}>
              {rutaActual.length} parada{rutaActual.length !== 1 ? 's' : ''} en tu ruta
            </p>

            {/* horizontal scroll timeline */}
            <div
              ref={timelineRef}
              className="timeline-scroll"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '8px',
              }}
            >
              {rutaActual.map((lugar, i) => (
                <div key={lugar.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {i > 0 && <Arrow />}
                  <TimelineCard lugar={lugar} onRemove={() => handleRemove(lugar.id)} />
                </div>
              ))}
              {/* ghost add button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Arrow />
                <button
                  type="button"
                  onClick={() => document.getElementById('buscador')?.scrollIntoView({ behavior: 'smooth' })}
                  style={{
                    width: '160px',
                    height: '150px',
                    flexShrink: 0,
                    borderRadius: '14px',
                    border: '2px dashed #F5C842',
                    backgroundColor: '#fffbeb',
                    color: '#92400e',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef3c7' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fffbeb' }}
                >
                  <span style={{ fontSize: '1.6rem' }}>+</span>
                  <span>Agregar parada</span>
                </button>
              </div>
            </div>

            <StepperDots count={rutaActual.length} />
          </div>
        </section>
      )}

      {/* ── BUSCADOR + GRID ── */}
      <section id="buscador" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 1.5rem' }}>
        <h2 style={{
          fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
          fontWeight: 800,
          color: '#111827',
          marginBottom: '6px',
          letterSpacing: '-0.02em',
        }}>
          Elegí tus paradas
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '20px' }}>
          Buscá entre todos los lugares disponibles y añadílos a tu ruta.
        </p>

        {/* search + filter bar */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#fff',
            border: '1.5px solid #e5e7eb',
            borderRadius: '10px',
            padding: '0 14px',
            flex: '1',
            minWidth: '180px',
            gap: '8px',
            transition: 'border-color 0.2s ease',
          }}
            onFocusCapture={(e) => { e.currentTarget.style.borderColor = '#F5C842' }}
            onBlurCapture={(e) => { e.currentTarget.style.borderColor = '#e5e7eb' }}
          >
            <span style={{ color: '#9ca3af', fontSize: '1rem' }}>🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar lugar…"
              style={{
                flex: 1,
                padding: '10px 0',
                border: 'none',
                outline: 'none',
                fontSize: '0.9rem',
                color: '#111827',
                backgroundColor: 'transparent',
              }}
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '1rem', lineHeight: 1 }}>✕</button>
            )}
          </div>

          <select
            value={catFiltro ?? ''}
            onChange={(e) => setCatFiltro(e.target.value || null)}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1.5px solid #e5e7eb',
              fontSize: '0.87rem',
              color: '#374151',
              backgroundColor: '#fff',
              cursor: 'pointer',
              outline: 'none',
              minWidth: '150px',
            }}
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        {/* grid */}
        {loadingLugares ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton-block" style={{ borderRadius: '12px', aspectRatio: '3/4' }} />
            ))}
          </div>
        ) : lugaresVisibles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9ca3af' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🔍</span>
            <p style={{ fontWeight: 600, color: '#6b7280', marginBottom: '4px' }}>Sin resultados</p>
            <p style={{ fontSize: '0.85rem' }}>Probá con otra búsqueda o categoría.</p>
          </div>
        ) : (
          <div className="guia-chip-grid">
            {lugaresVisibles.map((lugar) => (
              <LugarChip
                key={lugar.id}
                lugar={lugar}
                enRuta={rutaIds.has(lugar.id)}
                onAdd={handleAdd}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── MIS RUTAS GUARDADAS ── */}
      {user && (
        <section style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1.5rem 60px',
        }}>
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '40px' }}>
            <h2 style={{
              fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
              fontWeight: 800,
              color: '#111827',
              marginBottom: '6px',
              letterSpacing: '-0.02em',
            }}>
              Mis rutas guardadas
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '20px' }}>
              {misGuias.length === 0 ? 'Aún no tenés rutas guardadas. ¡Creá tu primera!' : `${misGuias.length} ruta${misGuias.length !== 1 ? 's' : ''} guardada${misGuias.length !== 1 ? 's' : ''}`}
            </p>

            {misGuias.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {misGuias.map((g) => (
                  <GuiaItem
                    key={g.id}
                    guia={g}
                    lugares={lugares}
                    onCargar={handleCargar}
                    onEliminar={handleEliminar}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {!user && (
        <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem 60px' }}>
          <div style={{
            borderTop: '1px solid #f3f4f6',
            paddingTop: '40px',
            textAlign: 'center',
          }}>
            <div style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: '#fffbeb',
              border: '1.5px solid #fde68a',
              borderRadius: '16px',
              padding: '28px 36px',
            }}>
              <span style={{ fontSize: '2rem' }}>🔐</span>
              <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                Iniciá sesión para guardar tus rutas
              </p>
              <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: 0 }}>
                Creá una cuenta gratis y guardá todos tus itinerarios.
              </p>
              <button
                type="button"
                className="btn-spring"
                onClick={() => navigate('/login', { state: { from: '/guias' } })}
                style={{
                  backgroundColor: '#F5C842',
                  color: '#111827',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '10px 24px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginTop: '4px',
                }}
              >
                Acceder →
              </button>
            </div>
          </div>
        </section>
      )}

      <Toast msg={toast} />
    </div>
  )
}
