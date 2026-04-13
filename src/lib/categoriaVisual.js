/** Gradientes para placeholders sin imagen (por categoría). */
export const gradientes = {
  Playas: 'linear-gradient(160deg, #38BDF8, #0369A1)',
  'Montañas y Volcanes': 'linear-gradient(160deg, #4ADE80, #166534)',
  'Lagos y Ríos': 'linear-gradient(160deg, #67E8F9, #0E7490)',
  'Pueblos con Encanto': 'linear-gradient(160deg, #C4B5FD, #6D28D9)',
  'Sitios Arqueológicos': 'linear-gradient(160deg, #FCD34D, #92400E)',
  'Parques Naturales': 'linear-gradient(160deg, #86EFAC, #166534)',
  Restaurantes: 'linear-gradient(160deg, #FCA5A5, #991B1B)',
  Miradores: 'linear-gradient(160deg, #FDE68A, #D97706)',
  'Mercados y Artesanías': 'linear-gradient(160deg, #F9A8D4, #9D174D)',
  'Vida Nocturna': 'linear-gradient(160deg, #A78BFA, #4C1D95)',
}

export const gradienteDefault = 'linear-gradient(160deg, #60A5FA, #1E3A8A)'

const EN_TO_ES = {
  'Beaches': 'Playas',
  'Mountains and volcanoes': 'Montañas y Volcanes',
  'Charming Villages': 'Pueblos con Encanto',
  'Archaeological Sites': 'Sitios Arqueológicos',
  'Lakes and Rivers': 'Lagos y Ríos',
  'Natural Parks': 'Parques Naturales',
  'Viewpoints': 'Miradores',
  'Markets and Crafts': 'Mercados y Artesanías',
  'Night Life': 'Vida Nocturna',
  'Restaurants': 'Restaurantes',
}

export function getGradiente(categoriaNombre) {
  if (!categoriaNombre) return gradienteDefault
  const nombre = EN_TO_ES[categoriaNombre] ?? categoriaNombre
  return gradientes[nombre] ?? gradienteDefault
}

/** Orden visual de chips (coincide con el diseño). */
export const ORDEN_CATEGORIAS = [
  'Playas',
  'Montañas y Volcanes',
  'Pueblos con Encanto',
  'Sitios Arqueológicos',
  'Lagos y Ríos',
  'Parques Naturales',
  'Miradores',
  'Mercados y Artesanías',
  'Vida Nocturna',
  'Restaurantes',
]

export function ordenarCategorias(list) {
  const idx = (n) => {
    const i = ORDEN_CATEGORIAS.indexOf(n)
    return i === -1 ? 999 : i
  }
  return [...list].sort((a, b) => idx(a.nombre) - idx(b.nombre))
}
