import React, { useState, useRef } from 'react'

export interface ModeTileProps {
  id: string
  title: string
  subtitle?: string
  icon: React.ReactNode
  tag?: string
  tags?: string[]
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
  tags,
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

    // Smooth leaning physics: card leans toward the mouse cursor
    const maxTilt = 8
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

  // Derive pills matching reference: tags prop, or fallback to [tag, subtitle, badgeText]
  const resolvedTags: string[] =
    tags && tags.length > 0
      ? tags
      : ([
          tag,
          subtitle,
          badgeText || (isActive ? 'Running' : 'Tap to Start'),
        ].filter(Boolean) as string[])

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
        aria-label={`${title}${subtitle ? `: ${subtitle}` : ''}`}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          appearance: 'none',
          position: 'relative',
          width: '100%',
          minHeight: '200px',
          aspectRatio: '1 / 1.14',
          padding: '14px 12px',
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
            : '1.5px solid rgba(255, 255, 255, 0.24)',
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
                transform: isHovered ? 'scale(1.06)' : 'scale(1)',
                transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                filter: 'brightness(0.96) contrast(1.05)',
              }}
            />
            {/* Cinematic frosted scrim overlay for readability while keeping the clean studio photograph luminous */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: isActive
                  ? 'linear-gradient(180deg, rgba(14, 25, 20, 0.48) 0%, rgba(14, 25, 20, 0.08) 45%, rgba(10, 18, 14, 0.8) 100%)'
                  : 'linear-gradient(180deg, rgba(10, 18, 15, 0.4) 0%, rgba(10, 18, 15, 0.05) 45%, rgba(8, 16, 13, 0.74) 100%)',
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
              background: `radial-gradient(circle 140px at ${sheen.x}% ${sheen.y}%, rgba(255, 255, 255, 0.22), transparent 75%)`,
            }}
          />
        )}

        {/* Top Header Row: Title on Left, Frosted Circle Icon on Right (matching reference image) */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            width: '100%',
            gap: '6px',
          }}
        >
          {/* Top-Left Title */}
          <div
            style={{
              fontSize: 'clamp(17px, 4.4vw, 22px)',
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              color: '#FFFFFF',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.65)',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              minWidth: 0,
              flex: 1,
            }}
          >
            {title}
          </div>

          {/* Top-Right Frosted Circle Button (matching the frosted edit circle in reference) */}
          <div
            style={{
              width: '32px',
              height: '32px',
              minWidth: '32px',
              minHeight: '32px',
              borderRadius: '50%',
              background: isActive
                ? 'var(--yellow)'
                : 'rgba(255, 255, 255, 0.24)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: isActive
                ? '1.5px solid var(--yellow)'
                : '1.2px solid rgba(255, 255, 255, 0.48)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '15px',
              color: isActive ? 'var(--ink)' : '#FFFFFF',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.22)',
              flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
          >
            {icon}
          </div>
        </div>

        {/* Bottom Section: Frosted Glassy Pill Badges (matching Dalmatian, 3 years old, Male in reference) */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            marginTop: 'auto',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            alignItems: 'center',
            width: '100%',
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          {resolvedTags.map((t, idx) => {
            const isLast = idx === resolvedTags.length - 1
            const isSmokyPill = isLast && !isActive
            return (
              <span
                key={idx}
                style={{
                  padding: '3px 8px',
                  borderRadius: '999px',
                  background:
                    isActive && isLast
                      ? 'rgba(237, 241, 123, 0.95)'
                      : isSmokyPill
                      ? 'rgba(20, 28, 24, 0.45)'
                      : 'rgba(255, 255, 255, 0.22)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border:
                    isActive && isLast
                      ? '1px solid var(--yellow)'
                      : '1px solid rgba(255, 255, 255, 0.42)',
                  fontSize: 'clamp(9.5px, 2.5vw, 11px)',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  color: isActive && isLast ? 'var(--ink)' : '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.25,
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {t}
              </span>
            )
          })}
        </div>
      </button>
    </div>
  )
}
