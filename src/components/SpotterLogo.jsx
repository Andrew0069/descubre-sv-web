/**
 * SpotterLogo
 * Wordmark where the letter "o" is replaced by a yellow location-pin SVG.
 *
 * Props:
 *   height  – total visual height in px (default 48). Everything else scales.
 */
export function SpotterLogo({ height = 48 }) {
  const scale = height / 56
  const pinH = 64 * scale
  const pinW = 46 * scale
  const fontSize = 56 * scale

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, lineHeight: 1 }}>
      <span
        style={{
          fontFamily: '"Bricolage Grotesque", system-ui',
          fontWeight: 700,
          fontSize,
          color: '#1F1611',
          letterSpacing: '-1.9px',
          lineHeight: 1,
        }}
      >
        Sp
      </span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={pinW}
        height={pinH}
        viewBox="0 0 46 64"
        style={{ marginTop: 2 * scale }}
      >
        <path
          d="M23 4 C 12.5 4 4 12.5 4 23 c0 11 12 22 18 27.8 a 1.5 1.5 0 0 0 2 0 C 30 45 42 34 42 23 C 42 12.5 33.5 4 23 4 Z"
          fill="#FFCB47"
          stroke="#1F1611"
          strokeWidth="2"
        />
        <circle cx="23" cy="22" r="7" fill="#FFF8EC" stroke="#1F1611" strokeWidth="2" />
      </svg>
      <span
        style={{
          fontFamily: '"Bricolage Grotesque", system-ui',
          fontWeight: 700,
          fontSize,
          color: '#1F1611',
          letterSpacing: '-1.9px',
          lineHeight: 1,
        }}
      >
        tter
      </span>
    </div>
  )
}
