const BAD_WORDS = [
  // Español
  'puta', 'putas', 'puto', 'putos', 'putear', 'putada',
  'mierda', 'mierdas', 'mierdero',
  'culo', 'culos', 'culero', 'culera', 'culeros', 'culeras',
  'cojones', 'cojon', 'cojón',
  'joder', 'jodido', 'jodida', 'jodidos', 'jodidas',
  'coño', 'coños',
  'cabron', 'cabrón', 'cabrones', 'cabronazo',
  'hijo de puta', 'hijos de puta', 'hijueputa', 'hijuepucha', 'hijueputas',
  'pendejo', 'pendeja', 'pendejos', 'pendejas',
  'verga', 'vergas',
  'chinga', 'chingo', 'chingada', 'chingado', 'chingadera', 'chingaderas',
  'pinche', 'pinches',
  'mamada', 'mamadas',
  'imbecil', 'imbécil', 'imbéciles', 'imbesil',
  'estupido', 'estúpido', 'estupida', 'estúpida', 'estupidos', 'estúpidos',
  'maldito', 'maldita', 'malditos', 'malditas',
  'carajo', 'carajos',
  'perra', 'perras',
  'zorra', 'zorras',
  'marica', 'maricas',
  'maricon', 'maricón', 'maricones',
  'idiota', 'idiotas',
  'hdp', 'h.d.p',
  'bicho', 'bichos',
  'conchasumadre', 'conchatumare',
  'gonorrea',
  'malparido', 'malparida', 'malparidos',
  'hp', 'h.p',
  // Inglés
  'fuck', 'fucking', 'fucker', 'fucked', 'fucks',
  'shit', 'shits', 'bullshit',
  'asshole', 'assholes',
  'bitch', 'bitches',
  'bastard', 'bastards',
  'cunt', 'cunts',
  'dick', 'dicks',
  'cock', 'cocks',
  'pussy',
  'motherfucker', 'motherfucking',
  'whore', 'whores',
  'nigger', 'niggers',
]

// Ordena de mayor a menor longitud para que frases completas se reemplacen primero
const SORTED_BAD_WORDS = [...BAD_WORDS].sort((a, b) => b.length - a.length)

const SPANISH_CHARS = 'a-záéíóúüñA-ZÁÉÍÓÚÜÑ'
const NOT_LETTER = `(?<![${SPANISH_CHARS}0-9])`
const NOT_LETTER_AFTER = `(?![${SPANISH_CHARS}0-9])`

/**
 * Reemplaza malas palabras con asteriscos del mismo largo.
 * @param {string} text
 * @returns {string}
 */
export function filterProfanity(text) {
  if (!text) return text

  let result = text

  for (const word of SORTED_BAD_WORDS) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(
      `${NOT_LETTER}${escaped}${NOT_LETTER_AFTER}`,
      'gi'
    )
    result = result.replace(regex, (match) => '*'.repeat(match.length))
  }

  return result
}
