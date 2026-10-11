import React, { useState, useEffect } from 'react'
import { onCaptionChange, getCurrentCaption } from '../speech/speak'

export interface CaptionProps {
  text?: string
  className?: string
  style?: React.CSSProperties
}

export const Caption: React.FC<CaptionProps> = ({ text: controlledText, className = '', style }) => {
  const [caption, setCaption] = useState<string>(controlledText || getCurrentCaption() || 'Tap any button to begin.')
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false)

  useEffect(() => {
    if (controlledText !== undefined) {
      setCaption(controlledText)
      return
    }

    const unsubscribe = onCaptionChange((newCaption, speaking) => {
      if (newCaption) {
        setCaption(newCaption)
      }
      setIsSpeaking(speaking)
    })

    return unsubscribe
  }, [controlledText])

  return (
    <div
      className={`blink-caption-card ${className}`}
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '68px',
        background: 'var(--glass-bg-card)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1.5px solid var(--glass-border)',
        borderRadius: 'var(--radius-card)',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        boxShadow: 'var(--glass-shadow)',
        transition: 'all 0.2s ease',
        ...style,
      }}
    >
      {/* Speaking wave pill */}
      <div
        aria-hidden="true"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: isSpeaking ? 'var(--yellow)' : 'rgba(20, 35, 30, 0.08)',
          color: 'var(--ink)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.25s ease',
          boxShadow: isSpeaking ? '0 0 12px rgba(237, 241, 123, 0.8)' : 'none',
        }}
      >
        {isSpeaking ? (
          <span style={{ fontSize: '14px' }}>🔊</span>
        ) : (
          <span style={{ fontSize: '14px', opacity: 0.6 }}>💬</span>
        )}
      </div>

      <p
        style={{
          fontSize: '18px',
          fontWeight: 600,
          lineHeight: 1.35,
          color: 'var(--ink)',
          margin: 0,
          flex: 1,
          wordBreak: 'break-word',
        }}
      >
        {caption}
      </p>
    </div>
  )
}
