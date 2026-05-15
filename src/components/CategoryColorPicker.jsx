import { useState } from 'react'

const SYSTEM_COLORS = [
  '#f87171', '#fb923c', '#facc15', '#a3e635', '#34d399', '#2dd4bf',
  '#38bdf8', '#60a5fa', '#818cf8', '#a78bfa', '#c084fc', '#e879f9',
  '#fb7185', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
  '#14b8a6', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef',
  '#ec4899', '#be123c', '#b45309', '#ca8a04', '#4d7c0f', '#15803d',
  '#0f766e', '#0369a1', '#1d4ed8', '#4338ca', '#7e22ce', '#a21caf',
  '#9f1239', '#111827', '#374151', '#6b7280', '#9ca3af', '#d1d5db',
]

function isHexColor(value) {
  return /^#[0-9a-f]{6}$/i.test(value ?? '')
}

function normalizeColor(value, fallback) {
  return isHexColor(value) ? value.toUpperCase() : fallback
}

function uniqueColors(values) {
  const seen = new Set()
  return values
    .filter(isHexColor)
    .map((color) => color.toUpperCase())
    .filter((color) => {
      if (seen.has(color)) return false
      seen.add(color)
      return true
    })
}

function Swatch({ color, selected, onSelect }) {
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  const isLifted = selected || hovered || pressed

  const handleSelect = () => {
    setPressed(true)
    window.setTimeout(() => setPressed(false), 180)
    onSelect(color)
  }

  return (
    <button
      type="button"
      onClick={handleSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false)
        setPressed(false)
      }}
      title={color}
      aria-label={`Seleccionar color ${color}`}
      style={{
        width: '24px',
        height: '24px',
        borderRadius: '7px',
        border: selected ? '2px solid #111827' : '1px solid rgba(17,24,39,0.12)',
        backgroundColor: color,
        cursor: 'pointer',
        boxShadow: selected
          ? '0 0 0 3px rgba(14,165,233,0.2), 0 8px 16px rgba(17,24,39,0.18)'
          : hovered
            ? '0 7px 14px rgba(17,24,39,0.16)'
            : '0 1px 2px rgba(17,24,39,0.08)',
        padding: 0,
        position: 'relative',
        transform: pressed ? 'scale(0.9)' : isLifted ? 'translateY(-2px) scale(1.08)' : 'translateY(0) scale(1)',
        transition: 'transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.18s ease, border-color 0.18s ease',
      }}
    >
      {selected && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: '6px',
            borderRadius: '999px',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.28)',
            transform: pressed ? 'scale(0.75)' : 'scale(1)',
            transition: 'transform 0.18s ease',
          }}
        />
      )}
    </button>
  )
}

export default function CategoryColorPicker({
  label = 'Color de la categoria',
  name,
  value,
  categorias = [],
  defaultColor = '#2196F3',
  onChange,
}) {
  const selectedColor = normalizeColor(value, defaultColor)
  const savedColors = uniqueColors(categorias.map((categoria) => categoria.color))

  const selectColor = (color) => {
    onChange({
      target: {
        name,
        value: normalizeColor(color, defaultColor),
      },
    })
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '8px',
      }}>
        <label style={{
          fontSize: '0.82rem',
          fontWeight: 800,
          color: '#374151',
        }}>
          {label}
        </label>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          color: '#6b7280',
          fontSize: '0.76rem',
          fontWeight: 800,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        }}>
          <span style={{
            width: '16px',
            height: '16px',
            borderRadius: '5px',
            backgroundColor: selectedColor,
            border: '1px solid rgba(17,24,39,0.16)',
          }} />
          {selectedColor}
        </span>
      </div>

      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        backgroundColor: '#ffffff',
        padding: '12px',
        display: 'grid',
        gap: '12px',
      }}>
        <div>
          <p style={{
            margin: '0 0 8px',
            color: '#111827',
            fontSize: '0.74rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            Colores del sistema
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(24px, 24px))',
            gap: '7px',
          }}>
            {SYSTEM_COLORS.map((color) => (
              <Swatch
                key={color}
                color={color}
                selected={selectedColor === color.toUpperCase()}
                onSelect={selectColor}
              />
            ))}
          </div>
        </div>

        {savedColors.length > 0 && (
          <div>
            <p style={{
              margin: '0 0 8px',
              color: '#111827',
              fontSize: '0.74rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              Colores guardados
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(24px, 24px))',
              gap: '7px',
            }}>
              {savedColors.map((color) => (
                <Swatch
                  key={color}
                  color={color}
                  selected={selectedColor === color}
                  onSelect={selectColor}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <p style={{
            margin: '0 0 8px',
            color: '#111827',
            fontSize: '0.74rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            Color personalizado
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="color"
              name={name}
              value={selectedColor}
              onChange={onChange}
              aria-label="Elegir color personalizado"
              style={{
                width: '42px',
                height: '34px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '3px',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
              }}
            />
            <input
              type="text"
              value={selectedColor}
              readOnly
              placeholder="#2196F3"
              aria-label="Codigo hexadecimal del color"
              style={{
                width: '112px',
                minHeight: '34px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '7px 9px',
                color: '#111827',
                fontSize: '0.82rem',
                fontWeight: 800,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
