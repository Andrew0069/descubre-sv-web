import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SpotterLogo } from '../components/SpotterLogo'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getLugaresHome, getLugaresByIds } from '../services/lugaresService'
import { getGuiasByUser, createGuia, updateGuia, deleteGuia } from '../services/guiasService'
import { resolveImageUrl } from '../lib/imageUrl'
import Toast from '../components/Toast'

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

function getPreviewImgs(lugar) {
  const sorted = (lugar.imagenes_lugar ?? [])
    .slice()
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    .filter((f) => f?.ruta_imagen?.trim())
    .slice(0, 3)
  const urls = sorted.map((f) =>
    resolveImageUrl(f.ruta_imagen, 'lugares-fotos', {
      transform: { width: 200, height: 160, resize: 'cover' },
    })
  )
  if (urls.length === 0 && lugar.imagen_principal?.trim()) {
    const u = resolveImageUrl(lugar.imagen_principal, 'lugares-fotos', {
      transform: { width: 200, height: 160, resize: 'cover' },
    })
    if (u) return [u]
  }
  return urls.filter(Boolean)
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-SV', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function isGuiaCompletada(guia) {
  return guia?.paradas_config?._estado === 'completada'
}

function format12h(time) {
  if (!time) return '?'
  const [hh, mm] = time.split(':')
  const h = parseInt(hh, 10)
  return `${h % 12 || 12}:${mm} ${h >= 12 ? 'PM' : 'AM'}`
}

function getDiaFromDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T12:00:00')
  const keys = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
  return keys[d.getDay()]
}

const DIA_LABELS = {
  lunes: 'lunes',
  martes: 'martes',
  miercoles: 'miércoles',
  jueves: 'jueves',
  viernes: 'viernes',
  sabado: 'sábado',
  domingo: 'domingo',
}

const DIAS_SEMANA = [
  { key: 'lunes',     label: 'Lun' },
  { key: 'martes',    label: 'Mar' },
  { key: 'miercoles', label: 'Mié' },
  { key: 'jueves',    label: 'Jue' },
  { key: 'viernes',   label: 'Vie' },
  { key: 'sabado',    label: 'Sáb' },
  { key: 'domingo',   label: 'Dom' },
]

function checkHorario(lugar, dia, hora) {
  const h = lugar.horarios
  if (!h) return { status: 'sin_horario', message: '' }
  if (h.es24Horas) return { status: 'open', message: '' }

  const diaData = h[dia]
  if (!diaData || !diaData.abierto) {
    const DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
    const startIdx = DAYS.indexOf(dia)
    let nextOpen = null
    for (let i = 1; i <= 7; i++) {
      const c = DAYS[(startIdx + i) % 7]
      if (h[c]?.abierto) { nextOpen = c; break }
    }
    const hint = nextOpen
      ? ` Abre el ${DIA_LABELS[nextOpen]} a las ${format12h(h[nextOpen].abre)}.`
      : ' No tiene días con horario disponible.'
    return {
      status: 'cerrado_dia',
      message: `${lugar.nombre} está cerrado los ${DIA_LABELS[dia]}.${hint}`,
    }
  }

  const toMins = (t) => {
    const [hh, mm] = (t ?? '00:00').split(':').map(Number)
    return hh * 60 + mm
  }
  const abreMins   = toMins(diaData.abre)
  const cierraMins = toMins(diaData.cierra)
  const horaMins   = toMins(hora)

  if (horaMins < abreMins)
    return {
      status: 'antes_apertura',
      message: `${lugar.nombre} aún no abre a esa hora. Abre a las ${format12h(diaData.abre)}.`,
    }
  if (horaMins >= cierraMins)
    return {
      status: 'despues_cierre',
      message: `${lugar.nombre} ya está cerrado a esa hora. Cierra a las ${format12h(diaData.cierra)}.`,
    }

  return { status: 'open', message: '' }
}

// ─── sub-components ─────────────────────────────────────────────────────────

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
function TimelineCard({ lugar, dia, hora, onRemove, onUpdateParada, onToast }) {
  const [hov, setHov] = useState(false)
  const thumb = getThumb(lugar)

  const horarioStatus = useMemo(() => {
    if (!dia || !hora) return null
    return checkHorario(lugar, dia, hora)
  }, [lugar, dia, hora])

  const handleDiaChange = (e) => {
    const newDia = e.target.value || null
    onUpdateParada(lugar.id, 'dia', newDia)
    if (newDia && hora) {
      const result = checkHorario(lugar, newDia, hora)
      if (result.status !== 'open' && result.message) onToast(result.message, 4500)
    }
  }

  const handleHoraChange = (e) => {
    const newHora = e.target.value || null
    onUpdateParada(lugar.id, 'hora', newHora)
    if (dia && newHora) {
      const result = checkHorario(lugar, dia, newHora)
      if (result.status !== 'open' && result.message) onToast(result.message, 4500)
    }
  }

  const statusIndicator = horarioStatus && horarioStatus.status !== 'sin_horario' ? (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '3px 7px',
      borderRadius: '20px',
      fontSize: '0.65rem',
      fontWeight: 700,
      backgroundColor: horarioStatus.status === 'open' ? '#ecfdf5' : '#fff7ed',
      color: horarioStatus.status === 'open' ? '#065f46' : '#92400e',
      border: `1px solid ${horarioStatus.status === 'open' ? '#a7f3d0' : '#fcd34d'}`,
      marginTop: '5px',
      lineHeight: 1,
    }}>
      {horarioStatus.status === 'open' ? '✓ Abierto' : '⚠ Cerrado'}
    </div>
  ) : null

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
      <div style={{ padding: '8px 10px 4px' }}>
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

      {/* schedule controls */}
      <div style={{ padding: '4px 10px 10px', borderTop: '1px solid #f3f4f6', marginTop: '4px' }}>
        <select
          value={dia ?? ''}
          onChange={handleDiaChange}
          title="Día de visita"
          style={{
            width: '100%',
            padding: '4px 6px',
            borderRadius: '6px',
            border: '1.5px solid #e5e7eb',
            fontSize: '0.72rem',
            color: dia ? '#111827' : '#9ca3af',
            backgroundColor: '#fafafa',
            outline: 'none',
            cursor: 'pointer',
            marginBottom: '5px',
            boxSizing: 'border-box',
          }}
        >
          <option value="">Día de visita…</option>
          {DIAS_SEMANA.map((d) => (
            <option key={d.key} value={d.key}>{d.label}</option>
          ))}
        </select>

        {dia && (
          <TimePicker12h
            compact
            value={hora ?? ''}
            onChange={(newHora) => {
              onUpdateParada(lugar.id, 'hora', newHora)
              if (dia && newHora) {
                const result = checkHorario(lugar, dia, newHora)
                if (result.status !== 'open' && result.message) onToast(result.message, 4500)
              }
            }}
          />
        )}

        {statusIndicator}
      </div>
    </div>
  )
}

// 12-hour time picker with AM/PM toggle
function TimePicker12h({ value, onChange, compact = false }) {
  const toDisplay = (val) => {
    if (!val) return { h: 12, m: 0, period: 'AM' }
    const [hh, mm] = val.split(':').map(Number)
    return { h: hh % 12 || 12, m: mm, period: hh >= 12 ? 'PM' : 'AM' }
  }
  const { h, m, period } = toDisplay(value)

  const emit = (h12, min, per) => {
    let h24 = h12 % 12
    if (per === 'PM') h24 += 12
    onChange(`${String(h24).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
  }

  const sel = {
    borderRadius: 7,
    border: '1.5px solid #fcd34d',
    background: '#fff',
    color: value ? '#111827' : '#9ca3af',
    outline: 'none',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    appearance: 'none',
    WebkitAppearance: 'none',
    textAlign: 'center',
    ...(compact
      ? { padding: '3px 2px', fontSize: '0.7rem', minWidth: 34, width: 34 }
      : { padding: '7px 6px', fontSize: '0.83rem', minWidth: 50, width: 50 }),
  }

  const btn = {
    borderRadius: 7,
    border: '1.5px solid #fcd34d',
    background: value && period === 'PM' ? '#F5C842' : '#fff',
    color: '#92400e',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    ...(compact
      ? { padding: '3px 5px', fontSize: '0.66rem', minWidth: 30 }
      : { padding: '7px 10px', fontSize: '0.78rem', minWidth: 46 }),
  }

  return (
    <div style={{ display: 'flex', gap: compact ? 3 : 5, alignItems: 'center' }}>
      <select style={sel} value={h} onChange={e => emit(+e.target.value, m, period)}
        onFocus={e => { e.target.style.borderColor = '#F5C842'; e.target.style.boxShadow = '0 0 0 3px rgba(245,200,66,0.18)' }}
        onBlur={e => { e.target.style.borderColor = '#fcd34d'; e.target.style.boxShadow = 'none' }}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
      </select>
      <span style={{ fontWeight: 800, color: '#b45309', fontSize: compact ? '0.75rem' : '0.9rem', lineHeight: 1, flexShrink: 0 }}>:</span>
      <select style={sel} value={m} onChange={e => emit(h, +e.target.value, period)}
        onFocus={e => { e.target.style.borderColor = '#F5C842'; e.target.style.boxShadow = '0 0 0 3px rgba(245,200,66,0.18)' }}
        onBlur={e => { e.target.style.borderColor = '#fcd34d'; e.target.style.boxShadow = 'none' }}>
        {Array.from({ length: 12 }, (_, i) => i * 5).map(n => <option key={n} value={n}>{String(n).padStart(2, '0')}</option>)}
      </select>
      <button type="button" style={btn} onClick={() => emit(h, m, period === 'AM' ? 'PM' : 'AM')}>
        {period}
      </button>
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
  const previewImgs = getPreviewImgs(lugar)
  const hasFan = previewImgs.length >= 2

  return (
    <div
      className={`lugar-chip-wrap${hasFan ? '' : ' is-single'}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Fan card overlay — appears above the chip on hover */}
      {previewImgs.length >= 1 && (
        <div className="lugar-chip-fan" aria-hidden="true">
          {previewImgs.map((url, idx) => (
            <div key={idx} className="lugar-chip-fan__card">
              <img src={url} alt="" />
            </div>
          ))}
        </div>
      )}

      {/* Chip body */}
      <div
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
              border: '1.5px solid #F5C842',
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
    </div>
  )
}

// Saved guide row
function GuiaItem({ guia, lugares, onCargar, onEliminar, onVer }) {
  const [confirmando, setConfirmando] = useState(false)
  const paradas = guia.lugares_ids?.length ?? 0
  const completada = isGuiaCompletada(guia)
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
      <button
        type="button"
        onClick={() => onVer(guia)}
        aria-label={`Ver guia ${guia.nombre}`}
        style={{
        width: '56px', height: '56px', borderRadius: '10px',
        overflow: 'hidden', flexShrink: 0, backgroundColor: '#f3f4f6',
        border: 'none', padding: 0, cursor: 'pointer',
      }}>
        {thumb ? (
          <img src={thumb} alt={guia.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#F5C842,#e6b800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🗺️</div>
        )}
      </button>

      {/* info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <button
          type="button"
          onClick={() => onVer(guia)}
          style={{ display: 'block', width: '100%', padding: 0, border: 'none', background: 'none', textAlign: 'left', fontSize: '0.9rem', fontWeight: 700, color: '#111827', margin: '0 0 2px', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
        >
          {guia.nombre}
        </button>
        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
          {paradas} parada{paradas !== 1 ? 's' : ''} · {formatDate(guia.created_at)}
        </p>
      </div>

      {/* actions */}
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        {completada ? (
          <span style={{ padding: '6px 12px', borderRadius: '999px', backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.76rem', fontWeight: 800 }}>
            Completada
          </span>
        ) : (
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
        )}
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

function buildRouteOpenUrl(lugaresList) {
  if (!lugaresList || lugaresList.length === 0) return null
  const wps = lugaresList.map((l) =>
    l.latitud && l.longitud
      ? `${l.latitud},${l.longitud}`
      : encodeURIComponent(`${l.nombre}, El Salvador`)
  )
  if (wps.length === 1) return `https://www.google.com/maps/search/?api=1&query=${wps[0]}`
  return `https://www.google.com/maps/dir/${wps.join('/')}/`
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
          <div style={{ width: 2, flex: 1, minHeight: 20, background: '#fde68a', margin: '4px 0' }} />
        )}
      </div>
      <div style={{ paddingTop: 4, minWidth: 0 }}>
        <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#111827', margin: '0 0 2px', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lugar.nombre}
        </p>
        {lugar.departamentos?.nombre && (
          <p style={{ fontSize: '0.72rem', color: '#6b7280', margin: 0 }}>
            📍 {lugar.departamentos.nombre}
          </p>
        )}
        {lugar.categorias?.nombre && (
          <span style={{
            display: 'inline-block', marginTop: 4,
            fontSize: '0.65rem', fontWeight: 600,
            background: `${lugar.categorias.color || '#0EA5E9'}20`,
            color: lugar.categorias.color || '#0EA5E9',
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
  const mapUrl = buildRouteOpenUrl(lugares)
  const completada = isGuiaCompletada(guia)
  return (
    <div style={{ minHeight: '100vh', background: '#fffbeb' }}>
      <style>{`
        .gv-layout { display:flex; flex-direction:column; }
        .gv-panel  { min-height:240px; overflow-y:auto; }
        .gv-map    { min-height:320px; height:320px; }
        @media (min-width:768px) {
          .gv-layout { flex-direction:row; height:calc(100vh - 60px); }
          .gv-panel  { width:300px; height:100%; overflow-y:auto; }
          .gv-map    { flex:1; height:100% !important; }
        }
      `}</style>

      {/* Barra superior */}
      <div style={{
        background: '#fff',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid #f3f4f6',
        position: 'sticky', top: 0, zIndex: 10,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <button
          onClick={() => navigate('/guias')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#f3f4f6', border: 'none', borderRadius: 8,
            padding: '6px 14px', fontSize: '0.85rem', fontWeight: 500,
            color: '#374151', cursor: 'pointer', flexShrink: 0,
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e5e7eb'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
        >← Volver</button>
        <h2 style={{ color: '#111827', fontSize: '1rem', fontWeight: 700, margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {guia.nombre}
        </h2>
        {completada ? (
          <span style={{ background: '#dcfce7', borderRadius: 999, padding: '6px 12px', fontSize: '0.78rem', fontWeight: 800, color: '#166534', flexShrink: 0 }}>
            Completada
          </span>
        ) : (
          <button
            onClick={() => navigate(`/guias?editar=${guia.id}`)}
            style={{ background: '#F5C842', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700, color: '#111827', cursor: 'pointer', flexShrink: 0 }}
          >
            Editar ruta
          </button>
        )}
      </div>

      {/* Cuerpo dos paneles */}
      <div className="gv-layout">
        {/* Panel lista */}
        <div className="gv-panel" style={{ background: '#fff', padding: '20px 16px', borderRight: '1px solid #f3f4f6' }}>
          <p style={{ color: '#9ca3af', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
            Puntos de la ruta
          </p>
          {loading ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: 40, fontSize: '0.85rem' }}>Cargando paradas…</p>
          ) : lugares.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: 40, fontSize: '0.85rem' }}>Esta guía no tiene lugares.</p>
          ) : (
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {lugares.map((l, i) => (
                <ViewerStop key={l.id} lugar={l} index={i} isLast={i === lugares.length - 1} />
              ))}
            </ol>
          )}
          {guia.descripcion && (
            <p style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: 24, lineHeight: 1.5 }}>
              {guia.descripcion}
            </p>
          )}
        </div>

        {/* Panel mapa / CTA */}
        <div className="gv-map" style={{
          background: 'radial-gradient(circle at 30% 40%, #fffbeb 0%, #fef3c7 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 20, padding: '2.5rem',
        }}>
          {loading ? (
            <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Cargando paradas…</p>
          ) : !mapUrl ? (
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', textAlign: 'center' }}>
              Agregá al menos un lugar para ver la ruta
            </p>
          ) : (
            <>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: 10 }}>🗺️</div>
                <p style={{ color: '#374151', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                  Ruta con {lugares.length} {lugares.length === 1 ? 'parada' : 'paradas'}
                </p>
                {guia.descripcion && (
                  <p style={{ color: '#6b7280', fontSize: '0.82rem', marginTop: 6, maxWidth: 320, lineHeight: 1.5 }}>
                    {guia.descripcion}
                  </p>
                )}
              </div>
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#F5C842', color: '#111827',
                  padding: '12px 28px', borderRadius: 10,
                  fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(245,200,66,0.4)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(245,200,66,0.5)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(245,200,66,0.4)' }}
              >
                <span>📍</span> Abrir ruta en Google Maps
              </a>
              <p style={{ color: '#9ca3af', fontSize: '0.72rem', textAlign: 'center', margin: 0 }}>
                Se abrirá en una nueva pestaña
              </p>
            </>
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
  const [rutaActual, setRutaActual] = useState([]) // ParadaItem[]
  const [rutaNombre, setRutaNombre] = useState('')
  const [search, setSearch] = useState('')
  const [catFiltro, setCatFiltro] = useState(null)
  const [misGuias, setMisGuias] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [user, setUser] = useState(null)
  const [toast, setToast] = useState(null)
  const [guiaEditandoId, setGuiaEditandoId] = useState(null)
  const [guiaFecha, setGuiaFecha] = useState('')
  const [guiaHora, setGuiaHora] = useState('')
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
        const [{ data }, { data: categoriasData }] = await Promise.all([
          getLugaresHome(),
          supabase
            .from('categorias')
            .select('id, nombre, color')
            .order('nombre', { ascending: true }),
        ])
        if (!cancelled) {
          setLugares(data ?? [])
          setCategorias(categoriasData ?? [])
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
    if (guia) {
      if (isGuiaCompletada(guia)) {
        showToast('Esta ruta ya fue completada y no se puede editar.')
        navigate(`/guias?ver=${guia.id}`, { replace: true })
        return
      }
      handleCargar(guia)
    }
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

  const rutaIds = useMemo(() => new Set(rutaActual.map((p) => p.lugar.id)), [rutaActual])

  const guiaDia = useMemo(() => getDiaFromDate(guiaFecha), [guiaFecha])

  const horarioSummary = useMemo(() => {
    if (!guiaDia || !guiaHora || rutaActual.length === 0) return null
    let open = 0, closed = 0
    rutaActual.forEach((p) => {
      const r = checkHorario(p.lugar, guiaDia, guiaHora)
      if (r.status === 'open' || r.status === 'sin_horario') open++
      else closed++
    })
    return { open, closed }
  }, [rutaActual, guiaDia, guiaHora])

  const handleAdd = useCallback((lugar) => {
    setRutaActual((prev) => {
      if (prev.some((p) => p.lugar.id === lugar.id)) return prev
      return [...prev, { lugar, dia: null, hora: null }]
    })
    setTimeout(() => {
      if (timelineRef.current) {
        timelineRef.current.scrollTo({ left: timelineRef.current.scrollWidth, behavior: 'smooth' })
      }
    }, 80)
  }, [])

  const handleRemove = useCallback((id) => {
    setRutaActual((prev) => prev.filter((p) => p.lugar.id !== id))
  }, [])

  const handleUpdateParada = useCallback((lugarId, field, value) => {
    setRutaActual((prev) =>
      prev.map((p) => p.lugar.id === lugarId ? { ...p, [field]: value || null } : p)
    )
  }, [])

  const handleGuiaFechaChange = (e) => {
    const fecha = e.target.value
    setGuiaFecha(fecha)
    const dia = fecha ? getDiaFromDate(fecha) : null
    setRutaActual((prev) => prev.map((p) => ({ ...p, dia })))
    if (fecha && guiaHora) {
      const conflictos = rutaActual.filter((p) => {
        const r = checkHorario(p.lugar, dia, guiaHora)
        return r.status !== 'open' && r.status !== 'sin_horario'
      })
      if (conflictos.length > 0)
        showToast(`${conflictos.length} lugar${conflictos.length !== 1 ? 'es cerrados' : ' cerrado'} a esa hora. Revisá los detalles.`, 4500)
    }
  }

  const handleGuiaHoraChange = (hora) => {
    setGuiaHora(hora)
    setRutaActual((prev) => prev.map((p) => ({ ...p, hora: hora || null })))
    if (guiaFecha && hora) {
      const dia = getDiaFromDate(guiaFecha)
      const conflictos = rutaActual.filter((p) => {
        const r = checkHorario(p.lugar, dia, hora)
        return r.status !== 'open' && r.status !== 'sin_horario'
      })
      if (conflictos.length > 0)
        showToast(`${conflictos.length} lugar${conflictos.length !== 1 ? 'es cerrados' : ' cerrado'} a esa hora. Revisá los detalles.`, 4500)
    }
  }

  const handleLimpiar = () => {
    setRutaActual([])
    setRutaNombre('')
    setGuiaEditandoId(null)
    setGuiaFecha('')
    setGuiaHora('')
  }

  const handleGuardar = async () => {
    if (!user) {
      navigate('/login', { state: { from: '/guias' } })
      return
    }
    if (!rutaNombre.trim()) { showToast('Escribe un nombre para tu ruta primero.'); return }
    if (rutaActual.length < 2) { showToast('Agrega al menos 2 lugares a tu ruta.'); return }

    setGuardando(true)

    const paradaConfig = {
      _guia_fecha: guiaFecha || null,
      _guia_hora: guiaHora || null,
    }
    rutaActual.forEach((p) => {
      if (p.dia || p.hora) paradaConfig[p.lugar.id] = { dia: p.dia, hora: p.hora }
    })

    const payload = {
      user_id: user.id,
      nombre: rutaNombre.trim(),
      descripcion: null,
      lugares_ids: rutaActual.map((p) => p.lugar.id),
      paradas_config: paradaConfig,
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
    if (isGuiaCompletada(guia)) {
      showToast('Esta ruta ya fue completada y no se puede editar.')
      navigate(`/guias?ver=${guia.id}`)
      return
    }
    const cfg = guia.paradas_config ?? {}
    const paradaItems = (guia.lugares_ids ?? [])
      .map((id) => {
        const lugar = lugares.find((l) => l.id === id)
        if (!lugar) return null
        return { lugar, dia: cfg[id]?.dia ?? null, hora: cfg[id]?.hora ?? null }
      })
      .filter(Boolean)
    setRutaActual(paradaItems)
    setRutaNombre(guia.nombre)
    setGuiaEditandoId(guia.id)
    setGuiaFecha(cfg._guia_fecha || '')
    setGuiaHora(cfg._guia_hora || '')
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
        @keyframes guiaFadeUp {
          from { opacity:0; transform:translateY(16px); }
          to { opacity:1; transform:translateY(0); }
        }
        .guia-fade-up { animation: guiaFadeUp 0.4s ease forwards; }
        @keyframes guiaDateIn {
          from { opacity:0; transform:translateY(-10px) scale(0.98); }
          to   { opacity:1; transform:translateY(0)    scale(1); }
        }
        .guia-date-picker { animation: guiaDateIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both; }
        .guia-date-input {
          width: 100%; padding: 8px 11px; border-radius: 8px;
          border: 1.5px solid #fcd34d; font-size: 0.83rem;
          color: #111827; background: #fff; outline: none;
          box-sizing: border-box; cursor: pointer;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .guia-date-input:focus {
          border-color: #F5C842;
          box-shadow: 0 0 0 3px rgba(245,200,66,0.18);
        }
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

        /* ── Fan de imágenes (sobre imagen principal) ── */
        .lugar-chip-wrap {
          position: relative;
        }
        .lugar-chip-fan {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          aspect-ratio: 4 / 3;
          pointer-events: none;
          z-index: 20;
          border-radius: 12px 12px 0 0;
        }
        .lugar-chip-fan__card {
          position: absolute;
          inset: 0;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 6px 20px rgba(0,0,0,0.22);
          transform-origin: bottom center;
          transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease;
        }
        .lugar-chip-fan__card img {
          width: 100%; height: 100%; object-fit: cover; display: block;
        }
        .lugar-chip-fan__card:nth-child(1),
        .lugar-chip-fan__card:nth-child(2),
        .lugar-chip-fan__card:nth-child(3) {
          transform: rotate(0deg);
          opacity: 0;
        }
        .lugar-chip-wrap:hover .lugar-chip-fan__card:nth-child(1) {
          transform: rotate(-22deg);
          opacity: 1;
        }
        .lugar-chip-wrap:hover .lugar-chip-fan__card:nth-child(2) {
          transform: rotate(0deg) translateY(-8px);
          opacity: 1;
        }
        .lugar-chip-wrap:hover .lugar-chip-fan__card:nth-child(3) {
          transform: rotate(22deg);
          opacity: 1;
        }
        .lugar-chip-wrap.is-single:hover .lugar-chip-fan__card:nth-child(1) {
          transform: scale(1.05) translateY(-6px);
          opacity: 1;
        }
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
            <SpotterLogo height={38} />
          </Link>
          <span style={{ color: '#d1d5db', margin: '0 4px 0 6px' }}>|</span>
          <span style={{ fontSize: '0.9rem', color: '#1a1a2e', fontWeight: 700 }}>Guías</span>
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

            {/* ── FECHA Y HORA DE LA GUÍA ── */}
            <div className="guia-date-picker" style={{
              backgroundColor: '#fffbeb',
              border: '1.5px solid #fde68a',
              borderRadius: '14px',
              padding: '14px 18px',
              marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1rem' }}>📅</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400e' }}>
                  Fecha y hora de tu recorrido
                </span>
                {horarioSummary && (
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {horarioSummary.open > 0 && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: '20px', padding: '2px 8px' }}>
                        ✓ {horarioSummary.open} abierto{horarioSummary.open !== 1 ? 's' : ''}
                      </span>
                    )}
                    {horarioSummary.closed > 0 && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, backgroundColor: '#fff7ed', color: '#92400e', border: '1px solid #fcd34d', borderRadius: '20px', padding: '2px 8px' }}>
                        ⚠ {horarioSummary.closed} cerrado{horarioSummary.closed !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: '1', minWidth: '140px' }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#b45309', display: 'block', marginBottom: '4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={guiaFecha}
                    onChange={handleGuiaFechaChange}
                    className="guia-date-input"
                  />
                </div>
                <div style={{ flex: '1 1 auto' }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#b45309', display: 'block', marginBottom: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Hora
                  </label>
                  <TimePicker12h value={guiaHora} onChange={handleGuiaHoraChange} />
                </div>
                {(guiaFecha || guiaHora) && (
                  <button
                    type="button"
                    onClick={() => { setGuiaFecha(''); setGuiaHora(''); setRutaActual((prev) => prev.map((p) => ({ ...p, dia: null, hora: null }))) }}
                    style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff', color: '#9ca3af', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', alignSelf: 'flex-end' }}
                  >
                    Quitar
                  </button>
                )}
              </div>
              {guiaFecha && (
                <p style={{ fontSize: '0.7rem', color: '#b45309', margin: '8px 0 0', lineHeight: 1.4 }}>
                  {new Date(guiaFecha + 'T12:00:00').toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  {guiaHora && ` · ${format12h(guiaHora)}`}
                </p>
              )}
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
                alignItems: 'flex-start',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '8px',
              }}
            >
              {rutaActual.map((parada, i) => (
                <div key={parada.lugar.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  {i > 0 && (
                    <div style={{ paddingTop: '56px' }}>
                      <Arrow />
                    </div>
                  )}
                  <TimelineCard
                    lugar={parada.lugar}
                    dia={parada.dia}
                    hora={parada.hora}
                    onRemove={() => handleRemove(parada.lugar.id)}
                    onUpdateParada={handleUpdateParada}
                    onToast={showToast}
                  />
                </div>
              ))}
              {/* ghost add button */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ paddingTop: '56px' }}>
                  <Arrow />
                </div>
                <button
                  type="button"
                  onClick={() => document.getElementById('buscador')?.scrollIntoView({ behavior: 'smooth' })}
                  style={{
                    width: '160px',
                    height: '190px',
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
                    onVer={(guia) => navigate(`/guias?ver=${guia.id}`)}
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
