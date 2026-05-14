import { useEffect, useMemo, useState } from 'react'
import { getTravelerInfoSections, normalizeTravelerInfo, parseMoney } from '../lib/travelerInfo'

const TAB_META = {
  moverme: { label: 'Moverme', icon: 'Rutas' },
  uber: { label: 'Uber', icon: 'Viajes' },
  presupuesto: { label: 'Presupuesto', icon: 'Budget' },
  tips: { label: 'Tip local', icon: 'Extra' },
}

const BUDGET_META = {
  mochilero: { label: 'Mochilero', accent: '#f4b400' },
  medio: { label: 'Medio', accent: '#d4a017' },
  comodo: { label: 'Cómodo', accent: '#a87908' },
}

function difficultyMeta(level) {
  if (level === 'transbordo') return { label: 'Requiere transbordo', className: 'traveler-chip traveler-chip--deep' }
  if (level === 'media') return { label: 'Dificultad media', className: 'traveler-chip traveler-chip--mid' }
  return { label: 'Ruta fácil', className: 'traveler-chip traveler-chip--light' }
}

function getProfileCopy(lugar) {
  const subtipo = String(lugar?.subtipo || '').toLowerCase()
  const categoria = String(lugar?.categorias?.nombre || '').toLowerCase()

  if (['hotel', 'hostal', 'airbnb'].includes(subtipo)) {
    return {
      eyebrow: 'Cómo salir de aquí',
      title: 'Muévete desde tu base sin caer en la ruta típica',
      description: 'Este bloque te ayuda a salir del hospedaje, comparar transporte y armar un día realista.',
    }
  }
  if (subtipo === 'restaurante') {
    return {
      eyebrow: 'Llegar, comer y seguir',
      title: 'Planea el trayecto sin que la visita se sienta pesada',
      description: 'Útil para comer bien, calcular el traslado y enlazar con otra parada cercana.',
    }
  }
  if (subtipo === 'bar') {
    return {
      eyebrow: 'Ida y regreso',
      title: 'Piensa el trayecto completo antes de la salida',
      description: 'Aquí ves opciones para llegar, volver y decidir cuánto gastar sin improvisar demasiado.',
    }
  }
  if (subtipo === 'atracción' || categoria.includes('atracc')) {
    return {
      eyebrow: 'Visita completa',
      title: 'Convierte la parada en un plan bien armado',
      description: 'Compara buses, Uber y presupuesto para aprovechar mejor la visita y las zonas cercanas.',
    }
  }
  return {
    eyebrow: 'Ruta distinta',
    title: 'Una guía corta para moverte mejor por la zona',
    description: 'Pensado para viajeros que quieren estimar tiempos, costos y una alternativa menos obvia.',
  }
}

function formatMoneyRange(min, max) {
  if (min && max) return `${min} - ${max}`
  return min || max || 'Sin rango'
}

function BudgetBreakdown({ label, value }) {
  const min = parseMoney(value.total_min)
  const max = parseMoney(value.total_max)
  const midpoint = min != null && max != null ? (min + max) / 2 : min ?? max ?? 0
  const width = Math.max(18, Math.min(100, midpoint * 8))

  return (
    <article className="traveler-budget-card">
      <div className="traveler-budget-card__top">
        <div>
          <p className="traveler-budget-card__eyebrow">{label}</p>
          <h4 className="traveler-budget-card__title">{formatMoneyRange(value.total_min, value.total_max)}</h4>
        </div>
        <span className="traveler-chip traveler-chip--light">Estimado</span>
      </div>

      <div className="traveler-bar-shell">
        <div className="traveler-bar-fill" style={{ width: `${width}%` }} />
      </div>

      <div className="traveler-budget-grid">
        {value.transporte && <span>Transporte: {value.transporte}</span>}
        {value.entrada && <span>Entrada: {value.entrada}</span>}
        {value.comida && <span>Comida: {value.comida}</span>}
        {value.extras && <span>Extras: {value.extras}</span>}
      </div>

      {value.nota && <p className="traveler-budget-card__note">{value.nota}</p>}
    </article>
  )
}

export default function LugarTravelerPanel({ lugar }) {
  const info = useMemo(() => normalizeTravelerInfo(lugar?.info_viajero), [lugar?.info_viajero])
  const sections = useMemo(() => getTravelerInfoSections(info), [info])
  const availableTabs = useMemo(() => {
    const tabs = []
    if (sections.buses) tabs.push('moverme')
    if (sections.uber) tabs.push('uber')
    if (sections.presupuesto) tabs.push('presupuesto')
    if (sections.tips) tabs.push('tips')
    return tabs
  }, [sections])
  const [activeTab, setActiveTab] = useState(availableTabs[0] ?? null)
  const copy = getProfileCopy(lugar)

  useEffect(() => {
    if (!availableTabs.length) {
      setActiveTab(null)
      return
    }
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0])
    }
  }, [activeTab, availableTabs])

  if (!availableTabs.length) return null

  return (
    <section className="traveler-panel">
      <div className="traveler-panel__hero">
        <div>
          <p className="traveler-panel__eyebrow">{copy.eyebrow}</p>
          <h3 className="traveler-panel__title">{copy.title}</h3>
          <p className="traveler-panel__description">{copy.description}</p>
        </div>
        <div className="traveler-panel__tags">
          {lugar?.departamentos?.nombre && <span className="traveler-chip traveler-chip--light">{lugar.departamentos.nombre}</span>}
          {lugar?.subtipo && <span className="traveler-chip traveler-chip--mid">{lugar.subtipo}</span>}
          {lugar?.precio_entrada && <span className="traveler-chip traveler-chip--deep">Entrada {lugar.precio_entrada}</span>}
        </div>
      </div>

      <div className="traveler-tabs" role="tablist" aria-label="Información para viajeros">
        {availableTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={`traveler-tab ${activeTab === tab ? 'is-active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            <span>{TAB_META[tab].label}</span>
            <small>{TAB_META[tab].icon}</small>
          </button>
        ))}
      </div>

      <div key={activeTab} className="traveler-panel__body traveler-panel__body--animated">
        {activeTab === 'moverme' && (
          <div className="traveler-stack">
            {info.zonas_cercanas.length > 0 && (
              <div className="traveler-card">
                <div className="traveler-card__header">
                  <h4>Zonas cercanas</h4>
                  <p>Referencias rápidas para ubicarte o enlazar el recorrido.</p>
                </div>
                <div className="traveler-chip-row">
                  {info.zonas_cercanas.map((zona, index) => (
                    <span key={`zona-${index}`} className="traveler-chip traveler-chip--light">
                      {zona.nombre}
                      {zona.nota ? ` · ${zona.nota}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {info.rutas_buses.length > 0 && (
              <div className="traveler-grid traveler-grid--two">
                {info.rutas_buses.map((ruta, index) => {
                  const difficulty = difficultyMeta(ruta.dificultad)
                  return (
                    <article key={`ruta-${index}`} className="traveler-card traveler-card--route">
                      <div className="traveler-card__topline">
                        <span className="traveler-route-badge">{ruta.ruta || 'Ruta local'}</span>
                        <span className={difficulty.className}>{difficulty.label}</span>
                      </div>
                      <h4>{ruta.punto_abordaje || 'Punto de abordaje por confirmar'}</h4>
                      {ruta.destino && <p className="traveler-muted">Te deja cerca de {ruta.destino}</p>}
                      {ruta.nota && <p className="traveler-copy">{ruta.nota}</p>}
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'uber' && (
          <div className="traveler-grid traveler-grid--two">
            {info.uber_estimados.map((item, index) => {
              const min = parseMoney(item.tarifa_min)
              const max = parseMoney(item.tarifa_max)
              const avg = min != null && max != null ? (min + max) / 2 : min ?? max ?? 0
              const width = Math.max(18, Math.min(100, avg * 10))
              return (
                <article key={`uber-${index}`} className="traveler-card">
                  <div className="traveler-card__topline">
                    <span className="traveler-chip traveler-chip--mid">{item.origen || 'Origen sugerido'}</span>
                    {item.franja && <span className="traveler-chip traveler-chip--light">{item.franja}</span>}
                  </div>
                  <h4>{item.destino || lugar?.nombre || 'Trayecto estimado'}</h4>
                  <p className="traveler-range">{formatMoneyRange(item.tarifa_min, item.tarifa_max)}</p>
                  <div className="traveler-bar-shell">
                    <div className="traveler-bar-fill" style={{ width: `${width}%` }} />
                  </div>
                  {item.duracion && <p className="traveler-muted">Tiempo estimado: {item.duracion}</p>}
                </article>
              )
            })}
          </div>
        )}

        {activeTab === 'presupuesto' && (
          <div className="traveler-grid traveler-grid--three">
            {Object.entries(BUDGET_META).map(([key, meta]) => {
              const item = info.presupuestos[key]
              const hasData = item && (item.total_min || item.total_max || item.transporte || item.entrada || item.comida || item.extras || item.nota)
              if (!hasData) return null
              return <BudgetBreakdown key={key} label={meta.label} value={item} />
            })}
          </div>
        )}

        {activeTab === 'tips' && (
          <div className="traveler-stack">
            {info.tips_locales.map((tip, index) => (
              <article key={`tip-${index}`} className="traveler-card traveler-card--tip">
                <div className="traveler-card__header">
                  <h4>{tip.titulo || 'Tip local'}</h4>
                  <p>Ruta distinta</p>
                </div>
                <p className="traveler-copy">{tip.descripcion}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
