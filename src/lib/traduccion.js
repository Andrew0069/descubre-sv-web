export async function traducirTexto(texto, targetLang) {
  if (!texto || targetLang === 'es') return texto
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=es|${targetLang}`
    const res = await fetch(url)
    const data = await res.json()
    if (data?.responseStatus === 200) {
      return data.responseData.translatedText || texto
    }
    return texto
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