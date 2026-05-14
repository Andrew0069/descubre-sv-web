import {
  createEmptyBusRoute,
  createEmptyNearbyZone,
  createEmptyTip,
  createEmptyTravelerInfo,
  createEmptyUberEstimate,
  normalizeTravelerInfo,
} from '../lib/travelerInfo'

const shellStyle = {
  border: '1px solid #eadfca',
  borderRadius: '14px',
  background: 'linear-gradient(180deg, #fffdf8 0%, #f7f1e4 100%)',
  overflow: 'hidden',
}

const cardStyle = {
  border: '1px solid rgba(202, 162, 68, 0.22)',
  borderRadius: '12px',
  backgroundColor: 'rgba(255, 251, 242, 0.96)',
  padding: '14px',
}

const fieldStyle = {
  width: '100%',
  minHeight: '40px',
  border: '1px solid #e5d4af',
  borderRadius: '10px',
  padding: '9px 11px',
  fontSize: '0.88rem',
  lineHeight: 1.45,
  color: '#111827',
  backgroundColor: '#fffdf8',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '0.76rem',
  fontWeight: 700,
  color: '#7c5d12',
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
}

const removeButtonStyle = {
  border: '1px solid #f1cfcf',
  borderRadius: '999px',
  backgroundColor: '#fff7f7',
  color: '#b91c1c',
  padding: '6px 10px',
  fontSize: '0.75rem',
  fontWeight: 700,
  cursor: 'pointer',
}

const addButtonStyle = {
  border: '1px dashed #d3b66a',
  borderRadius: '999px',
  backgroundColor: '#fff8db',
  color: '#7c5d12',
  padding: '8px 14px',
  fontSize: '0.8rem',
  fontWeight: 800,
  cursor: 'pointer',
}

function SectionHeader({ title, description }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <h4 style={{ margin: '0 0 4px', fontSize: '0.96rem', fontWeight: 800, color: '#3f2f08' }}>{title}</h4>
      <p style={{ margin: 0, fontSize: '0.82rem', color: '#8a6b20', lineHeight: 1.55 }}>{description}</p>
    </div>
  )
}

function ArraySection({ title, description, items, onAdd, renderItem, addLabel }) {
  return (
    <section style={cardStyle}>
      <SectionHeader title={title} description={description} />
      <div style={{ display: 'grid', gap: '12px' }}>
        {items.length === 0 && (
          <div style={{ border: '1px dashed #e4d7bc', borderRadius: '10px', padding: '12px', color: '#8b6f2c', fontSize: '0.83rem' }}>
            Sin datos todavía.
          </div>
        )}
        {items.map(renderItem)}
      </div>
      <button type="button" onClick={onAdd} style={{ ...addButtonStyle, marginTop: '14px' }}>
        {addLabel}
      </button>
    </section>
  )
}

function BudgetTierEditor({ label, value, onChange }) {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
        <h5 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#3f2f08' }}>{label}</h5>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
        <div>
          <label style={labelStyle}>Total mínimo</label>
          <input type="text" value={value.total_min} onChange={(e) => onChange('total_min', e.target.value)} style={fieldStyle} placeholder="$8" />
        </div>
        <div>
          <label style={labelStyle}>Total máximo</label>
          <input type="text" value={value.total_max} onChange={(e) => onChange('total_max', e.target.value)} style={fieldStyle} placeholder="$15" />
        </div>
        <div>
          <label style={labelStyle}>Transporte</label>
          <input type="text" value={value.transporte} onChange={(e) => onChange('transporte', e.target.value)} style={fieldStyle} placeholder="$2" />
        </div>
        <div>
          <label style={labelStyle}>Entrada</label>
          <input type="text" value={value.entrada} onChange={(e) => onChange('entrada', e.target.value)} style={fieldStyle} placeholder="$5" />
        </div>
        <div>
          <label style={labelStyle}>Comida</label>
          <input type="text" value={value.comida} onChange={(e) => onChange('comida', e.target.value)} style={fieldStyle} placeholder="$4" />
        </div>
        <div>
          <label style={labelStyle}>Extras</label>
          <input type="text" value={value.extras} onChange={(e) => onChange('extras', e.target.value)} style={fieldStyle} placeholder="$3" />
        </div>
      </div>
      <div style={{ marginTop: '12px' }}>
        <label style={labelStyle}>Nota</label>
        <textarea value={value.nota} onChange={(e) => onChange('nota', e.target.value)} rows={2} style={{ ...fieldStyle, minHeight: '70px', resize: 'vertical' }} placeholder="Qué incluye o cómo aprovechar este nivel." />
      </div>
    </div>
  )
}

export default function TravelerInfoEditor({ value, onChange }) {
  const info = normalizeTravelerInfo(value || createEmptyTravelerInfo())

  const updateSection = (key, nextValue) => {
    onChange({ ...info, [key]: nextValue })
  }

  const updateBudget = (tier, field, nextValue) => {
    onChange({
      ...info,
      presupuestos: {
        ...info.presupuestos,
        [tier]: {
          ...info.presupuestos[tier],
          [field]: nextValue,
        },
      },
    })
  }

  return (
    <div style={shellStyle}>
      <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(202, 162, 68, 0.2)', background: 'rgba(255, 248, 219, 0.85)' }}>
        <p style={{ margin: '0 0 4px', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9a7a2e' }}>
          Info viajero
        </p>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#3f2f08' }}>
          Movilidad y presupuesto por lugar
        </h3>
        <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: '#8a6b20', lineHeight: 1.55 }}>
          Completa buses, Uber, presupuestos y tips. Solo se mostrará lo que tenga contenido.
        </p>
      </div>

      <div style={{ padding: '18px', display: 'grid', gap: '16px' }}>
        <ArraySection
          title="Rutas de buses"
          description="Qué rutas pasan por la zona, dónde tomarlas y qué tan fácil es usarlas."
          items={info.rutas_buses}
          onAdd={() => updateSection('rutas_buses', [...info.rutas_buses, createEmptyBusRoute()])}
          addLabel="+ Agregar ruta"
          renderItem={(item, index) => (
            <div key={`bus-${index}`} style={cardStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Ruta</label>
                  <input type="text" value={item.ruta} onChange={(e) => {
                    const next = [...info.rutas_buses]
                    next[index] = { ...item, ruta: e.target.value }
                    updateSection('rutas_buses', next)
                  }} style={fieldStyle} placeholder="102-A" />
                </div>
                <div>
                  <label style={labelStyle}>Punto de abordaje</label>
                  <input type="text" value={item.punto_abordaje} onChange={(e) => {
                    const next = [...info.rutas_buses]
                    next[index] = { ...item, punto_abordaje: e.target.value }
                    updateSection('rutas_buses', next)
                  }} style={fieldStyle} placeholder="Parada frente al mercado" />
                </div>
                <div>
                  <label style={labelStyle}>Te deja cerca de</label>
                  <input type="text" value={item.destino} onChange={(e) => {
                    const next = [...info.rutas_buses]
                    next[index] = { ...item, destino: e.target.value }
                    updateSection('rutas_buses', next)
                  }} style={fieldStyle} placeholder="Centro histórico" />
                </div>
                <div>
                  <label style={labelStyle}>Dificultad</label>
                  <select value={item.dificultad} onChange={(e) => {
                    const next = [...info.rutas_buses]
                    next[index] = { ...item, dificultad: e.target.value }
                    updateSection('rutas_buses', next)
                  }} style={fieldStyle}>
                    <option value="facil">Fácil</option>
                    <option value="media">Media</option>
                    <option value="transbordo">Requiere transbordo</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: '12px' }}>
                <label style={labelStyle}>Nota breve</label>
                <textarea value={item.nota} onChange={(e) => {
                  const next = [...info.rutas_buses]
                  next[index] = { ...item, nota: e.target.value }
                  updateSection('rutas_buses', next)
                }} rows={2} style={{ ...fieldStyle, minHeight: '66px', resize: 'vertical' }} placeholder="Ideal si quieres gastar poco y no vas con prisa." />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => {
                  updateSection('rutas_buses', info.rutas_buses.filter((_, itemIndex) => itemIndex !== index))
                }} style={removeButtonStyle}>
                  Eliminar ruta
                </button>
              </div>
            </div>
          )}
        />

        <ArraySection
          title="Uber estimado"
          description="Trayectos comunes desde o hacia hubs relevantes para ese lugar."
          items={info.uber_estimados}
          onAdd={() => updateSection('uber_estimados', [...info.uber_estimados, createEmptyUberEstimate()])}
          addLabel="+ Agregar trayecto"
          renderItem={(item, index) => (
            <div key={`uber-${index}`} style={cardStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Origen</label>
                  <input type="text" value={item.origen} onChange={(e) => {
                    const next = [...info.uber_estimados]
                    next[index] = { ...item, origen: e.target.value }
                    updateSection('uber_estimados', next)
                  }} style={fieldStyle} placeholder="Zona Rosa" />
                </div>
                <div>
                  <label style={labelStyle}>Destino</label>
                  <input type="text" value={item.destino} onChange={(e) => {
                    const next = [...info.uber_estimados]
                    next[index] = { ...item, destino: e.target.value }
                    updateSection('uber_estimados', next)
                  }} style={fieldStyle} placeholder="Lugar o retorno" />
                </div>
                <div>
                  <label style={labelStyle}>Tarifa mínima</label>
                  <input type="text" value={item.tarifa_min} onChange={(e) => {
                    const next = [...info.uber_estimados]
                    next[index] = { ...item, tarifa_min: e.target.value }
                    updateSection('uber_estimados', next)
                  }} style={fieldStyle} placeholder="$4" />
                </div>
                <div>
                  <label style={labelStyle}>Tarifa máxima</label>
                  <input type="text" value={item.tarifa_max} onChange={(e) => {
                    const next = [...info.uber_estimados]
                    next[index] = { ...item, tarifa_max: e.target.value }
                    updateSection('uber_estimados', next)
                  }} style={fieldStyle} placeholder="$7" />
                </div>
                <div>
                  <label style={labelStyle}>Duración</label>
                  <input type="text" value={item.duracion} onChange={(e) => {
                    const next = [...info.uber_estimados]
                    next[index] = { ...item, duracion: e.target.value }
                    updateSection('uber_estimados', next)
                  }} style={fieldStyle} placeholder="18 min" />
                </div>
                <div>
                  <label style={labelStyle}>Mejor franja</label>
                  <input type="text" value={item.franja} onChange={(e) => {
                    const next = [...info.uber_estimados]
                    next[index] = { ...item, franja: e.target.value }
                    updateSection('uber_estimados', next)
                  }} style={fieldStyle} placeholder="Antes de las 6 p. m." />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => {
                  updateSection('uber_estimados', info.uber_estimados.filter((_, itemIndex) => itemIndex !== index))
                }} style={removeButtonStyle}>
                  Eliminar trayecto
                </button>
              </div>
            </div>
          )}
        />

        <section style={cardStyle}>
          <SectionHeader title="Presupuestos" description="Rangos y desglose rápido para tres tipos de viajero." />
          <div style={{ display: 'grid', gap: '12px' }}>
            <BudgetTierEditor label="Mochilero" value={info.presupuestos.mochilero} onChange={(field, nextValue) => updateBudget('mochilero', field, nextValue)} />
            <BudgetTierEditor label="Medio" value={info.presupuestos.medio} onChange={(field, nextValue) => updateBudget('medio', field, nextValue)} />
            <BudgetTierEditor label="Cómodo" value={info.presupuestos.comodo} onChange={(field, nextValue) => updateBudget('comodo', field, nextValue)} />
          </div>
        </section>

        <ArraySection
          title="Tips locales"
          description="Consejos breves para salirse de la ruta típica o moverse mejor."
          items={info.tips_locales}
          onAdd={() => updateSection('tips_locales', [...info.tips_locales, createEmptyTip()])}
          addLabel="+ Agregar tip"
          renderItem={(item, index) => (
            <div key={`tip-${index}`} style={cardStyle}>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Título</label>
                  <input type="text" value={item.titulo} onChange={(e) => {
                    const next = [...info.tips_locales]
                    next[index] = { ...item, titulo: e.target.value }
                    updateSection('tips_locales', next)
                  }} style={fieldStyle} placeholder="Si no quieres la ruta típica..." />
                </div>
                <div>
                  <label style={labelStyle}>Descripción</label>
                  <textarea value={item.descripcion} onChange={(e) => {
                    const next = [...info.tips_locales]
                    next[index] = { ...item, descripcion: e.target.value }
                    updateSection('tips_locales', next)
                  }} rows={3} style={{ ...fieldStyle, minHeight: '82px', resize: 'vertical' }} placeholder="Mejor llega temprano y combina este lugar con..." />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => {
                  updateSection('tips_locales', info.tips_locales.filter((_, itemIndex) => itemIndex !== index))
                }} style={removeButtonStyle}>
                  Eliminar tip
                </button>
              </div>
            </div>
          )}
        />

        <ArraySection
          title="Zonas cercanas"
          description="Barrios, terminales o referencias útiles para orientarse."
          items={info.zonas_cercanas}
          onAdd={() => updateSection('zonas_cercanas', [...info.zonas_cercanas, createEmptyNearbyZone()])}
          addLabel="+ Agregar zona"
          renderItem={(item, index) => (
            <div key={`zona-${index}`} style={cardStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Zona o referencia</label>
                  <input type="text" value={item.nombre} onChange={(e) => {
                    const next = [...info.zonas_cercanas]
                    next[index] = { ...item, nombre: e.target.value }
                    updateSection('zonas_cercanas', next)
                  }} style={fieldStyle} placeholder="Terminal de Sonsonate" />
                </div>
                <div>
                  <label style={labelStyle}>Nota</label>
                  <input type="text" value={item.nota} onChange={(e) => {
                    const next = [...info.zonas_cercanas]
                    next[index] = { ...item, nota: e.target.value }
                    updateSection('zonas_cercanas', next)
                  }} style={fieldStyle} placeholder="A 8 min en carro" />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => {
                  updateSection('zonas_cercanas', info.zonas_cercanas.filter((_, itemIndex) => itemIndex !== index))
                }} style={removeButtonStyle}>
                  Eliminar zona
                </button>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  )
}
