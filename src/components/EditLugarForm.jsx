const SUBTIPOS = ['Hotel', 'Hostal', 'Airbnb', 'Restaurante', 'Bar', 'Atracción']

export default function EditLugarForm({ formData, onChange, onToggleDestacado, onSave, onCancel }) {
  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="grid gap-4">
        <div>
          <label className="mb-1.5 block text-[0.85rem] font-semibold text-gray-700">
            Nombre
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={onChange}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none transition-colors focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[0.85rem] font-semibold text-gray-700">
            Descripción
          </label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={onChange}
            rows={4}
            className="w-full resize-y rounded-lg border border-gray-300 p-2.5 text-sm outline-none transition-colors focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[0.85rem] font-semibold text-gray-700">
              Precio entrada
            </label>
            <input
              type="text"
              name="precio_entrada"
              value={formData.precio_entrada}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none transition-colors focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[0.85rem] font-semibold text-gray-700">
              Subtipo
            </label>
            <select
              name="subtipo"
              value={formData.subtipo}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm outline-none transition-colors focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            >
              {SUBTIPOS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-3 pt-1">
          <div className="relative">
            <input
              type="checkbox"
              checked={formData.destacado}
              onChange={onToggleDestacado}
              className="sr-only"
            />
            <div className={`h-6 w-11 rounded-full transition-colors ${formData.destacado ? 'bg-sky-500' : 'bg-gray-300'}`} />
            <div className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${formData.destacado ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
          <span className="text-[0.85rem] font-semibold text-gray-700">
            Destacado
            <span className={`ml-2 text-xs font-medium ${formData.destacado ? 'text-sky-500' : 'text-gray-400'}`}>
              {formData.destacado ? 'Activo' : 'Inactivo'}
            </span>
          </span>
        </label>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onSave}
            className="rounded-lg bg-sky-500 px-4 py-2 text-[0.85rem] font-semibold text-white transition-colors hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            Guardar cambios
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-[0.85rem] font-semibold text-gray-600 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
