import { createContext, useContext, useState, useEffect } from 'react'

const IdiomaContext = createContext()

export function IdiomaProvider({ children }) {
  const [idioma, setIdioma] = useState(() => localStorage.getItem('idioma') || 'es')

  useEffect(() => {
    localStorage.setItem('idioma', idioma)
  }, [idioma])

  return (
    <IdiomaContext.Provider value={{ idioma, setIdioma }}>
      {children}
    </IdiomaContext.Provider>
  )
}

export function useIdioma() {
  const ctx = useContext(IdiomaContext)
  if (!ctx) {
    throw new Error('useIdioma must be used within an IdiomaProvider')
  }
  return ctx
}
