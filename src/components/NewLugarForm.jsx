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
    <div className="admin-form-card">
      <div className="admin-form-card__header">
        <p className="admin-eyebrow">Información del lugar</p>
        <h3 className="admin-title-sm">Datos del nuevo lugar</h3>
      </div>

      <div className="admin-form-card__body">
        <div>
          <label className="admin-form-label">
            Nombre*
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={onChange}
            required
            className="admin-form-field"
          />
        </div>

        <div>
          <label className="admin-form-label">
            Descripción*
          </label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={onChange}
            required
            rows={5}
            className="admin-form-field admin-form-field--textarea"
          />
        </div>

        <div>
          <label className="admin-form-label">
            Dirección
          </label>
          <input
            type="text"
            name="direccion"
            value={formData.direccion}
            onChange={onChange}
            className="admin-form-field"
          />
        </div>

        <div className="admin-form-grid-2">
          <div className="admin-form-min0">
            <label className="admin-form-label">
              Departamento
            </label>
            <select
              name="departamento_id"
              value={formData.departamento_id}
              onChange={onChange}
              className="admin-form-field"
            >
              {DEPARTAMENTOS.map((departamento) => (
                <option key={departamento.value} value={departamento.value}>{departamento.label}</option>
              ))}
            </select>
          </div>

          <div className="admin-form-min0">
            <label className="admin-form-label">
              Categoría
            </label>
            <select
              name="categoria_id"
              value={formData.categoria_id}
              onChange={onChange}
              className="admin-form-field"
            >
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
              ))}
              <option value="__nueva__">+ Crear nueva categoría...</option>
            </select>
          </div>
        </div>

        {formData.categoria_id === '__nueva__' && (
          <div className="admin-form-grid-cat">
            <div>
            <label className="admin-form-label">
              Nombre de la nueva categoría
            </label>
            <input
              type="text"
              name="nueva_categoria_nombre"
              value={formData.nueva_categoria_nombre}
              onChange={onChange}
              className="admin-form-field"
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

        <div className="admin-form-grid-2">
          <div className="admin-form-min0">
            <label className="admin-form-label">
              Precio entrada
            </label>
            <input
              type="text"
              name="precio_entrada"
              value={formData.precio_entrada}
              onChange={onChange}
              placeholder='Gratis, $5'
              className="admin-form-field"
            />
          </div>

          <div className="admin-form-min0">
            <label className="admin-form-label">
              Subtipo
            </label>
            <input
              type="text"
              name="subtipo"
              value={formData.subtipo}
              onChange={onChange}
              placeholder="Hotel, Playa, Volcán"
              className="admin-form-field"
            />
          </div>

          <label className="admin-form-toggle">
            <span className="admin-form-toggle__text">
              Destacado
              <span className={`admin-form-toggle__hint${formData.destacado ? ' is-on' : ''}`}>
                {formData.destacado ? 'Activo' : 'Inactivo'}
              </span>
            </span>
            <span className="admin-form-toggle__switch">
              <input
                type="checkbox"
                checked={formData.destacado}
                onChange={onToggleDestacado}
                className="admin-form-toggle__input"
              />
              <span className={`admin-form-toggle__track${formData.destacado ? ' is-on' : ''}`} />
              <span className={`admin-form-toggle__thumb${formData.destacado ? ' is-on' : ''}`} />
            </span>
          </label>
        </div>

        <div className="admin-form-grid-2">
          <div className="admin-form-min0">
            <label className="admin-form-label">
              Latitud
            </label>
            <input
              type="number"
              name="latitud"
              value={formData.latitud}
              onChange={onChange}
              step="any"
              className="admin-form-field"
            />
          </div>

          <div className="admin-form-min0">
            <label className="admin-form-label">
              Longitud
            </label>
            <input
              type="number"
              name="longitud"
              value={formData.longitud}
              onChange={onChange}
              step="any"
              className="admin-form-field"
            />
          </div>
        </div>

        <TravelerInfoEditor
          value={formData.info_viajero}
          onChange={onTravelerInfoChange}
        />
      </div>

      <div className="admin-form-card__footer">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="admin-pill-secondary"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className={`admin-cta-primary admin-cta-primary--inline${isSaving ? ' is-loading' : ''}`}
        >
          {isSaving ? 'Creando...' : 'Crear lugar'}
        </button>
      </div>
    </div>
  )
}
