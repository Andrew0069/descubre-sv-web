const BUDGET_TIERS = ['mochilero', 'medio', 'comodo']

function trimText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function keepText(value) {
  return typeof value === 'string' ? value : ''
}

function toList(value) {
  return Array.isArray(value) ? value : []
}

function emptyBudgetTier() {
  return {
    total_min: '',
    total_max: '',
    transporte: '',
    entrada: '',
    comida: '',
    extras: '',
    nota: '',
  }
}

export function createEmptyTravelerInfo() {
  return {
    rutas_buses: [],
    uber_estimados: [],
    presupuestos: {
      mochilero: emptyBudgetTier(),
      medio: emptyBudgetTier(),
      comodo: emptyBudgetTier(),
    },
    tips_locales: [],
    zonas_cercanas: [],
  }
}

export function createEmptyBusRoute() {
  return {
    ruta: '',
    punto_abordaje: '',
    destino: '',
    nota: '',
    dificultad: 'facil',
  }
}

export function createEmptyUberEstimate() {
  return {
    origen: '',
    destino: '',
    tarifa_min: '',
    tarifa_max: '',
    duracion: '',
    franja: '',
  }
}

export function createEmptyTip() {
  return {
    titulo: '',
    descripcion: '',
  }
}

export function createEmptyNearbyZone() {
  return {
    nombre: '',
    nota: '',
  }
}

export function normalizeTravelerInfo(value, options = {}) {
  const textResolver = options.trimStrings ? trimText : keepText
  const source = value && typeof value === 'object' ? value : {}
  const base = createEmptyTravelerInfo()

  return {
    rutas_buses: toList(source.rutas_buses).map((item) => ({
      ...createEmptyBusRoute(),
      ...item,
      ruta: textResolver(item?.ruta),
      punto_abordaje: textResolver(item?.punto_abordaje),
      destino: textResolver(item?.destino),
      nota: textResolver(item?.nota),
      dificultad: ['facil', 'media', 'transbordo'].includes(item?.dificultad) ? item.dificultad : 'facil',
    })),
    uber_estimados: toList(source.uber_estimados).map((item) => ({
      ...createEmptyUberEstimate(),
      ...item,
      origen: textResolver(item?.origen),
      destino: textResolver(item?.destino),
      tarifa_min: textResolver(item?.tarifa_min),
      tarifa_max: textResolver(item?.tarifa_max),
      duracion: textResolver(item?.duracion),
      franja: textResolver(item?.franja),
    })),
    presupuestos: BUDGET_TIERS.reduce((acc, tier) => {
      const item = source.presupuestos?.[tier] ?? base.presupuestos[tier]
      acc[tier] = {
        ...emptyBudgetTier(),
        ...item,
        total_min: textResolver(item?.total_min),
        total_max: textResolver(item?.total_max),
        transporte: textResolver(item?.transporte),
        entrada: textResolver(item?.entrada),
        comida: textResolver(item?.comida),
        extras: textResolver(item?.extras),
        nota: textResolver(item?.nota),
      }
      return acc
    }, {}),
    tips_locales: toList(source.tips_locales).map((item) => ({
      ...createEmptyTip(),
      ...item,
      titulo: textResolver(item?.titulo),
      descripcion: textResolver(item?.descripcion),
    })),
    zonas_cercanas: toList(source.zonas_cercanas).map((item) => ({
      ...createEmptyNearbyZone(),
      ...(typeof item === 'string' ? { nombre: item } : item),
      nombre: textResolver(typeof item === 'string' ? item : item?.nombre),
      nota: textResolver(typeof item === 'string' ? '' : item?.nota),
    })),
  }
}

export function sanitizeTravelerInfo(value) {
  const info = normalizeTravelerInfo(value, { trimStrings: true })

  const rutas_buses = info.rutas_buses.filter((item) => (
    item.ruta || item.punto_abordaje || item.destino || item.nota
  ))

  const uber_estimados = info.uber_estimados.filter((item) => (
    item.origen || item.destino || item.tarifa_min || item.tarifa_max || item.duracion || item.franja
  ))

  const tips_locales = info.tips_locales.filter((item) => item.titulo || item.descripcion)
  const zonas_cercanas = info.zonas_cercanas.filter((item) => item.nombre || item.nota)

  const presupuestos = BUDGET_TIERS.reduce((acc, tier) => {
    const item = info.presupuestos[tier]
    if (
      item.total_min || item.total_max || item.transporte ||
      item.entrada || item.comida || item.extras || item.nota
    ) {
      acc[tier] = item
    }
    return acc
  }, {})

  if (
    rutas_buses.length === 0 &&
    uber_estimados.length === 0 &&
    tips_locales.length === 0 &&
    zonas_cercanas.length === 0 &&
    Object.keys(presupuestos).length === 0
  ) {
    return null
  }

  return {
    rutas_buses,
    uber_estimados,
    presupuestos,
    tips_locales,
    zonas_cercanas,
  }
}

export function getTravelerInfoSections(value) {
  const info = normalizeTravelerInfo(value, { trimStrings: true })
  return {
    buses: info.rutas_buses.length > 0 || info.zonas_cercanas.length > 0,
    uber: info.uber_estimados.length > 0,
    presupuesto: BUDGET_TIERS.some((tier) => {
      const item = info.presupuestos[tier]
      return item.total_min || item.total_max || item.transporte || item.entrada || item.comida || item.extras || item.nota
    }),
    tips: info.tips_locales.length > 0,
  }
}

export function parseMoney(value) {
  if (value == null || value === '') return null
  const numeric = Number(String(value).replace(/[^0-9.]/g, ''))
  return Number.isFinite(numeric) ? numeric : null
}
