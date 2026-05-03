import React from 'react'

export default function Loader({ text = 'Loading...', fullScreen = false }) {
  const content = (
    <div className="modern-loader-container">
      <div className="modern-loader-spinner">
        <svg viewBox="0 0 100 100" width="70" height="70" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="42" className="arc arc-1" />
          <circle cx="50" cy="50" r="32" className="arc arc-2" />
          <circle cx="50" cy="50" r="22" className="arc arc-3" />
          <circle cx="50" cy="50" r="12" className="arc arc-4" />
        </svg>
      </div>
      {text && <p className="modern-loader-text">{text}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="modern-loader-fullscreen">
        {content}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      {content}
    </div>
  )
}
