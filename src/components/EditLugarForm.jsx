import CategoryColorPicker from './CategoryColorPicker'
import TravelerInfoEditor from './TravelerInfoEditor'

const SUBTIPOS = ['Hotel', 'Hostal', 'Airbnb', 'Restaurante', 'Bar', 'Atracción']
const DEFAULT_CATEGORY_COLOR = '#2196F3'

export default function EditLugarForm({
  formData,
  categorias = [],
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
        <h3 className="admin-title-sm">Datos editables</h3>
      </div>

      <div className="admin-form-card__body">
        <div>
          <label className="admin-form-label">
            Nombre
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={onChange}
            className="admin-form-field"
          />
        </div>

        <div>
          <label className="admin-form-label">
            Dirección
          </label>
          <input
            type="text"
            name="direccion"
            value={formData.direccion ?? ''}
            onChange={onChange}
            className="admin-form-field"
            placeholder="ej. Km 12 Carretera a Santa Ana"
          />
        </div>

        <div>
          <label className="admin-form-label">
            Descripción
          </label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={onChange}
            rows={5}
            className="admin-form-field admin-form-field--textarea"
          />
        </div>

        <div>
          <label className="admin-form-label">
            Categoría
          </label>
          <select
            name="categoria_id"
            value={formData.categoria_id ?? ''}
            onChange={onChange}
            className="admin-form-field"
          >
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
            ))}
            <option value="__nueva__">+ Crear nueva categoría...</option>
          </select>
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
              value={formData.nueva_categoria_nombre ?? ''}
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
              className="admin-form-field"
            />
          </div>

          <div className="admin-form-min0">
            <label className="admin-form-label">
              Subtipo
            </label>
            <select
              name="subtipo"
              value={formData.subtipo}
              onChange={onChange}
              className="admin-form-field"
            >
              <option value="">-- Sin subtipo --</option>
              {SUBTIPOS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
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

        <TravelerInfoEditor
          value={formData.info_viajero}
          onChange={onTravelerInfoChange}
        />

        <div className="admin-form-card__header" style={{ marginTop: 4 }}>
          <p className="admin-eyebrow">Spotter · datos extra</p>
          <h3 className="admin-title-sm">Detalles para viajeros</h3>
        </div>

        <div>
          <label className="admin-form-label">Dato para viajeros</label>
          <textarea
            name="dato_viajero"
            value={formData.dato_viajero ?? ''}
            onChange={onChange}
            rows={2}
            placeholder="Ej. Abierto 24/7, ideal para un recorrido nocturno seguro."
            className="admin-form-field admin-form-field--textarea"
          />
        </div>

        <div className="admin-form-grid-2">
          <div className="admin-form-min0">
            <label className="admin-form-label">Tiempo recomendado</label>
            <input
              type="text"
              name="tiempo_recomendado"
              value={formData.tiempo_recomendado ?? ''}
              onChange={onChange}
              placeholder="Ej. 1–2h"
              className="admin-form-field"
            />
          </div>

          <label className="admin-form-toggle">
            <span className="admin-form-toggle__text">
              Wi-Fi disponible
              <span className={`admin-form-toggle__hint${formData.tiene_wifi ? ' is-on' : ''}`}>
                {formData.tiene_wifi ? 'Sí' : 'No'}
              </span>
            </span>
            <span className="admin-form-toggle__switch">
              <input
                type="checkbox"
                name="tiene_wifi"
                checked={!!formData.tiene_wifi}
                onChange={onChange}
                className="admin-form-toggle__input"
              />
              <span className={`admin-form-toggle__track${formData.tiene_wifi ? ' is-on' : ''}`} />
              <span className={`admin-form-toggle__thumb${formData.tiene_wifi ? ' is-on' : ''}`} />
            </span>
          </label>

          <label className="admin-form-toggle">
            <span className="admin-form-toggle__text">
              Apto para familias
              <span className={`admin-form-toggle__hint${formData.apto_familias ? ' is-on' : ''}`}>
                {formData.apto_familias ? 'Sí' : 'No'}
              </span>
            </span>
            <span className="admin-form-toggle__switch">
              <input
                type="checkbox"
                name="apto_familias"
                checked={!!formData.apto_familias}
                onChange={onChange}
                className="admin-form-toggle__input"
              />
              <span className={`admin-form-toggle__track${formData.apto_familias ? ' is-on' : ''}`} />
              <span className={`admin-form-toggle__thumb${formData.apto_familias ? ' is-on' : ''}`} />
            </span>
          </label>

          <label className="admin-form-toggle">
            <span className="admin-form-toggle__text">
              Joya local
              <span className={`admin-form-toggle__hint${formData.es_joya_local ? ' is-on' : ''}`}>
                {formData.es_joya_local ? 'Sí' : 'No'}
              </span>
            </span>
            <span className="admin-form-toggle__switch">
              <input
                type="checkbox"
                name="es_joya_local"
                checked={!!formData.es_joya_local}
                onChange={onChange}
                className="admin-form-toggle__input"
              />
              <span className={`admin-form-toggle__track${formData.es_joya_local ? ' is-on' : ''}`} />
              <span className={`admin-form-toggle__thumb${formData.es_joya_local ? ' is-on' : ''}`} />
            </span>
          </label>
        </div>
      </div>

      <div className="admin-form-card__extra">
        <div className="admin-form-coords">
          <div>
            <label className="admin-form-label">Latitud (opcional)</label>
            <input
              type="number"
              step="any"
              name="latitud"
              value={formData.latitud ?? ''}
              onChange={onChange}
              placeholder="ej. 13.692940"
              className="admin-form-field"
            />
          </div>
          <div>
            <label className="admin-form-label">Longitud (opcional)</label>
            <input
              type="number"
              step="any"
              name="longitud"
              value={formData.longitud ?? ''}
              onChange={onChange}
              placeholder="ej. -89.218191"
              className="admin-form-field"
            />
          </div>
        </div>
        <p className="admin-form-coords__hint">
          💡 Obtén las coordenadas desde Google Maps → clic derecho sobre el punto → copiar lat/lng
        </p>
      </div>

      <div className="admin-form-card__footer">
        <button
          type="button"
          onClick={onCancel}
          className="admin-pill-secondary"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSave}
          className="admin-cta-primary admin-cta-primary--inline"
        >
          Guardar cambios
        </button>
      </div>
    </div>
  )
}
