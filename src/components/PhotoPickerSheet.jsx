import { useRef, useEffect } from 'react'

function isMobile() {
  return 'ontouchstart' in window || window.innerWidth < 768
}

export default function PhotoPickerSheet({ open, onClose, onFileSelected, multiple = false }) {
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !isMobile()) return null

  const handleFile = (e) => {
    if (e.target.files?.length) onFileSelected(e)
    onClose()
    // reset so same file can be re-selected next time
    e.target.value = ''
  }

  const btnStyle = {
    display: 'block', width: '100%', padding: '16px',
    background: '#fff', border: 'none', borderRadius: '12px',
    fontSize: '1rem', fontWeight: 600, color: '#111827',
    cursor: 'pointer', textAlign: 'center',
  }
  const cancelStyle = { ...btnStyle, color: '#6b7280', fontWeight: 500 }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', background: '#f3f4f6',
          borderRadius: '20px 20px 0 0', padding: '12px 16px 32px',
          display: 'flex', flexDirection: 'column', gap: '8px',
        }}
      >
        {/* Cámara — NO usa multiple (iOS lo ignora si tiene capture+multiple) */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
        {/* Galería — sí puede ser multiple */}
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          style={{ display: 'none' }}
          onChange={handleFile}
        />

        <button style={btnStyle} onClick={() => cameraRef.current?.click()}>
          📷 Tomar foto
        </button>
        <button style={btnStyle} onClick={() => galleryRef.current?.click()}>
          🖼️ Elegir de galería
        </button>
        <button style={cancelStyle} onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
