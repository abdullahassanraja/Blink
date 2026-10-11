import React, { useState, useRef } from 'react'

export interface ModeTileProps {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  tag?: string
  badgeText?: string
  imageSrc?: string
  isActive?: boolean
  onClick: () => void
  style?: React.CSSProperties
}

export const ModeTile: React.FC<ModeTileProps> = ({
  id,
  title,
  subtitle,
  icon,
  tag,
  badgeText,
  imageSrc,
  isActive = false,
  onClick,
  style,
}) => {
  const cardRef = useRef<HTMLButtonElement>(null)
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [sheen, setSheen] = useState<{ x: number; y: number }>({ x: 50, y: 50 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    // Leaning physics: card leans toward the mouse cursor position
    const maxTilt = 10
    const tiltX = -((y - centerY) / centerY) * maxTilt
    const tiltY = ((x - centerX) / centerX) * maxTilt

    setTilt({ x: tiltX, y: tiltY })
    setSheen({
      x: Math.max(0, Math.min(100, (x / rect.width) * 100)),
      y: Math.max(0, Math.min(100, (y / rect.height) * 100)),
    })
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setTilt({ x: 0, y: 0 })
  }

  return (
    <div
      style={{
        perspective: '900px',
        width: '100%',
      }}
    >
      <button
        ref={cardRef}
        id={`mode-tile-${id}`}
        aria-label={`${title}: ${subtitle}`}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          appearance: 'none',
          position: 'relative',
          width: '100%',
          minHeight: '210px',
          height: '100%',
          padding: '16px 14px',
          borderRadius: '26px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'stretch',
          cursor: 'pointer',
          textAlign: 'left',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
          border: isActive
            ? '2px solid var(--yellow)'
            : isHovered
            ? '1.5px solid rgba(255, 255, 255, 0.55)'
            : '1.5px solid rgba(255, 255, 255, 0.28)',
          background: 'rgba(20, 32, 26, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: isActive
            ? '0 16px 36px rgba(237, 241, 123, 0.28), 0 8px 24px rgba(0, 0, 0, 0.5)'
            : isHovered
            ? '0 20px 42px rgba(0, 0, 0, 0.42), inset 0 1px 1px rgba(255, 255, 255, 0.6)'
            : '0 10px 28px rgba(0, 0, 0, 0.26), inset 0 1px 1px rgba(255, 255, 255, 0.35)',
          transform: isHovered
            ? `perspective(900px) rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg) scale3d(1.025, 1.025, 1.025)`
            : 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
          transition: isHovered
            ? 'transform 0.08s ease-out, border-color 0.2s ease-out, box-shadow 0.2s ease-out'
            : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease-out, box-shadow 0.3s ease-out',
          willChange: 'transform',
          ...style,
        }}
      >
        {/* Background Image with subtle zoom on hover */}
        {imageSrc && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              overflow: 'hidden',
              borderRadius: '24px',
            }}
          >
            <img
              src={imageSrc}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                filter: 'brightness(0.92) contrast(1.06)',
              }}
            />
            {/* Cinematic frosted scrim overlay for readability */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: isActive
                  ? 'linear-gradient(180deg, rgba(14, 25, 20, 0.45) 0%, rgba(14, 25, 20, 0.72) 55%, rgba(10, 18, 14, 0.95) 100%)'
                  : 'linear-gradient(180deg, rgba(12, 22, 18, 0.35) 0%, rgba(12, 22, 18, 0.65) 55%, rgba(8, 16, 13, 0.92) 100%)',
              }}
            />
          </div>
        )}

        {/* Dynamic Specular Sheen (follows cursor on hovered card) */}
        {isHovered && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              pointerEvents: 'none',
              borderRadius: '24px',
              background: `radial-gradient(circle 140px at ${sheen.x}% ${sheen.y}%, rgba(255, 255, 255, 0.25), transparent 75%)`,
            }}
          />
        )}

        {/* Top Header Row: Category Tag Pill + Icon Badge */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          {/* Frosted Glass Pill Tag (inspired by "Season Offer" in reference mockup) */}
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              background: isActive
                ? 'rgba(237, 241, 123, 0.28)'
                : 'rgba(255, 255, 255, 0.22)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: isActive
                ? '1px solid var(--yellow)'
                : '1px solid rgba(255, 255, 255, 0.35)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: isActive ? 'var(--yellow)' : '#FFFFFF',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)',
            }}
          >
            {tag || (isActive ? 'Active' : 'Mode')}
          </span>

          {/* Frosted Corner Icon Button */}
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: isActive
                ? 'var(--yellow)'
                : 'rgba(255, 255, 255, 0.22)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: isActive
                ? 'none'
                : '1px solid rgba(255, 255, 255, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: isActive ? 'var(--ink)' : '#FFFFFF',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        </div>

        {/* Bottom Info Section: Title, Subtitle, and Glass Pill Action */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            marginTop: 'auto',
            paddingTop: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div
            style={{
              fontSize: '21px',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              color: '#FFFFFF',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize: '12.5px',
              fontWeight: 500,
              lineHeight: 1.35,
              color: 'rgba(255, 255, 255, 0.85)',
              textShadow: '0 1px 4px rgba(0, 0, 0, 0.6)',
            }}
          >
            {subtitle}
          </div>

          {/* Action Glass Pill (matching the price/action glass button from the mockup) */}
          <div
            style={{
              marginTop: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              alignSelf: 'flex-start',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '999px',
              background: isActive
                ? 'rgba(237, 241, 123, 0.95)'
                : 'rgba(255, 255, 255, 0.24)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              border: isActive
                ? '1px solid var(--yellow)'
                : '1px solid rgba(255, 255, 255, 0.38)',
              color: isActive ? 'var(--ink)' : '#FFFFFF',
              fontSize: '12px',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            }}
          >
            <span>{badgeText || (isActive ? 'Running' : 'Tap to Start')}</span>
            <span style={{ fontSize: '12px', opacity: 0.9 }}>›</span>
          </div>
        </div>
      </button>
    </div>
  )
}
