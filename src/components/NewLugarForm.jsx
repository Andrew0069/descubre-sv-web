import CategoryColorPicker from './CategoryColorPicker'
import { DEFAULT_CATEGORY_COLOR } from '../pages/AdminPage'
import TravelerInfoEditor from './TravelerInfoEditor'

export const DEPARTAMENTOS = [
  { label: 'Ahuachapán', value: 'b0000000-0000-0000-0000-000000000011' },
  { label: 'Cabañas', value: 'b0000000-0000-0000-0000-000000000014' },
  { label: 'Chalatenango', value: 'b0000000-0000-0000-0000-000000000009' },
  { label: 'Cuscatlán', value: 'b0000000-0000-0000-0000-000000000010' },
  { label: 'La Libertad', value: 'b0000000-0000-0000-0000-000000000002' },
  { label: 'La Paz', value: 'b0000000-0000-0000-0000-000000000008' },
  { label: 'La Unión', value: 'b0000000-0000-0000-0000-000000000007' },
  { label: 'Morazán', value: 'b0000000-0000-0000-0000-000000000012' },
  { label: 'San Miguel', value: 'b0000000-0000-0000-0000-000000000004' },
  { label: 'San Salvador', value: 'b0000000-0000-0000-0000-000000000001' },
  { label: 'San Vicente', value: 'b0000000-0000-0000-0000-000000000013' },
  { label: 'Santa Ana', value: 'b0000000-0000-0000-0000-000000000003' },
  { label: 'Sonsonate', value: 'b0000000-0000-0000-0000-000000000006' },
  { label: 'Usulután', value: 'b0000000-0000-0000-0000-000000000005' },
]

const createFieldStyle = {
  width: '100%',
  minHeight: '42px',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  padding: '10px 12px',
  fontSize: '0.9rem',
  lineHeight: 1.45,
  color: '#111827',
  backgroundColor: '#ffffff',
  outline: 'none',
  boxSizing: 'border-box',
}

const createLabelStyle = {
  display: 'block',
  marginBottom: '7px',
  fontSize: '0.82rem',
  fontWeight: 700,
  color: '#374151',
}

export default function NewLugarForm({
  formData,
  categorias = [],
  isSaving,
  onChange,
  onTravelerInfoChange,
  onToggleDestacado,
  onSave,
  onCancel,
}) {
  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '10px',
      backgroundColor: '#ffffff',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '18px 20px', borderBottom: '1px solid #f3f4f6' }}>
        <p style={{
          margin: '0 0 4px',
          fontSize: '0.74rem',
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#9ca3af',
        }}>
          Información del lugar
        </p>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#111827' }}>
          Datos del nuevo lugar
        </h3>
      </div>

      <div style={{ padding: '20px', display: 'grid', gap: '18px' }}>
        <div>
          <label style={createLabelStyle}>
            Nombre*
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={onChange}
            required
            style={createFieldStyle}
          />
        </div>

        <div>
          <label style={createLabelStyle}>
            Descripción*
          </label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={onChange}
            required
            rows={5}
            style={{
              ...createFieldStyle,
              minHeight: '120px',
              resize: 'vertical',
            }}
          />
        </div>

        <div>
          <label style={createLabelStyle}>
            Dirección
          </label>
          <input
            type="text"
            name="direccion"
            value={formData.direccion}
            onChange={onChange}
            style={createFieldStyle}
          />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '16px',
          alignItems: 'end',
        }}>
          <div style={{ minWidth: 0 }}>
            <label style={createLabelStyle}>
              Departamento
            </label>
            <select
              name="departamento_id"
              value={formData.departamento_id}
              onChange={onChange}
              style={createFieldStyle}
            >
              {DEPARTAMENTOS.map((departamento) => (
                <option key={departamento.value} value={departamento.value}>{departamento.label}</option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: 0 }}>
            <label style={createLabelStyle}>
              Categoría
            </label>
            <select
              name="categoria_id"
              value={formData.categoria_id}
              onChange={onChange}
              style={createFieldStyle}
            >
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
              ))}
              <option value="__nueva__">+ Crear nueva categoría...</option>
            </select>
          </div>
        </div>

        {formData.categoria_id === '__nueva__' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
            alignItems: 'start',
          }}>
            <div>
            <label style={createLabelStyle}>
              Nombre de la nueva categoría
            </label>
            <input
              type="text"
              name="nueva_categoria_nombre"
              value={formData.nueva_categoria_nombre}
              onChange={onChange}
              style={createFieldStyle}
            />
            </div>
            <div>
              <CategoryColorPicker
                label="Color"
                name="nueva_categoria_color"
                value={formData.nueva_categoria_color || DEFAULT_CATEGORY_COLOR}
                categorias={categorias}
                defaultColor={DEFAULT_CATEGORY_COLOR}
                onChange={onChange}
              />
            </div>
          </div>
        )}

        {formData.categoria_id !== '__nueva__' && (
          <div style={{ maxWidth: '420px' }}>
            <CategoryColorPicker
              label="Color de la categoria"
              name="categoria_color"
              value={formData.categoria_color || DEFAULT_CATEGORY_COLOR}
              categorias={categorias}
              defaultColor={DEFAULT_CATEGORY_COLOR}
              onChange={onChange}
            />
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '16px',
          alignItems: 'end',
        }}>
          <div style={{ minWidth: 0 }}>
            <label style={createLabelStyle}>
              Precio entrada
            </label>
            <input
              type="text"
              name="precio_entrada"
              value={formData.precio_entrada}
              onChange={onChange}
              placeholder='Gratis, $5'
              style={createFieldStyle}
            />
          </div>

          <div style={{ minWidth: 0 }}>
            <label style={createLabelStyle}>
              Subtipo
            </label>
            <input
              type="text"
              name="subtipo"
              value={formData.subtipo}
              onChange={onChange}
              placeholder="Hotel, Playa, Volcán"
              style={createFieldStyle}
            />
          </div>

          <label style={{
            minHeight: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '10px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: '#f9fafb',
            cursor: 'pointer',
            boxSizing: 'border-box',
            minWidth: 0,
          }}>
            <span style={{
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              color: '#374151',
              fontSize: '0.84rem',
              fontWeight: 800,
              lineHeight: 1.2,
            }}>
              Destacado
              <span style={{
                color: formData.destacado ? '#0EA5E9' : '#9ca3af',
                fontSize: '0.74rem',
                fontWeight: 700,
              }}>
                {formData.destacado ? 'Activo' : 'Inactivo'}
              </span>
            </span>
            <span style={{ position: 'relative', width: '44px', height: '24px', flexShrink: 0 }}>
              <input
                type="checkbox"
                checked={formData.destacado}
                onChange={onToggleDestacado}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
              />
              <span style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '999px',
                backgroundColor: formData.destacado ? '#0EA5E9' : '#d1d5db',
                transition: 'background-color 0.15s ease',
              }} />
              <span style={{
                position: 'absolute',
                top: '2px',
                left: formData.destacado ? '22px' : '2px',
                width: '20px',
                height: '20px',
                borderRadius: '999px',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.22)',
                transition: 'left 0.15s ease',
              }} />
            </span>
          </label>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '16px',
          alignItems: 'end',
        }}>
          <div style={{ minWidth: 0 }}>
            <label style={createLabelStyle}>
              Latitud
            </label>
            <input
              type="number"
              name="latitud"
              value={formData.latitud}
              onChange={onChange}
              step="any"
              style={createFieldStyle}
            />
          </div>

          <div style={{ minWidth: 0 }}>
            <label style={createLabelStyle}>
              Longitud
            </label>
            <input
              type="number"
              name="longitud"
              value={formData.longitud}
              onChange={onChange}
              step="any"
              style={createFieldStyle}
            />
          </div>
        </div>

        <TravelerInfoEditor
          value={formData.info_viajero}
          onChange={onTravelerInfoChange}
        />
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        padding: '14px 20px',
        borderTop: '1px solid #f3f4f6',
        backgroundColor: '#f9fafb',
        flexWrap: 'wrap',
      }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          style={{
            minWidth: '104px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            color: '#4b5563',
            padding: '9px 14px',
            fontSize: '0.84rem',
            fontWeight: 800,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            opacity: isSaving ? 0.7 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          style={{
            minWidth: '148px',
            border: '1px solid #0EA5E9',
            borderRadius: '8px',
            backgroundColor: '#0EA5E9',
            color: '#ffffff',
            padding: '9px 16px',
            fontSize: '0.84rem',
            fontWeight: 800,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            opacity: isSaving ? 0.7 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {isSaving ? 'Creando...' : 'Crear lugar'}
        </button>
      </div>
    </div>
  )
}
