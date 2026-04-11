const API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_KEY

export async function traducirTexto(texto, targetLang) {
  if (!texto || targetLang === 'es') return texto
  try {
    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: texto,
          source: 'es',
          target: targetLang,
          format: 'text',
        }),
      }
    )
    const data = await res.json()
    return data?.data?.translations?.[0]?.translatedText || texto
  } catch {
    return texto
  }
}

export async function traducirObjeto(obj, campos, targetLang) {
  if (targetLang === 'es') return obj
  const resultado = { ...obj }
  for (const campo of campos) {
    if (obj[campo]) {
      resultado[campo] = await traducirTexto(obj[campo], targetLang)
    }
  }
  return resultado
}

export async function traducirArray(arr, campos, targetLang) {
  if (targetLang === 'es') return arr
  return Promise.all(arr.map(item => traducirObjeto(item, campos, targetLang)))
}
