import React from 'react'

export interface TimelineRowProps {
  smallLabel: string
  bigWord: string
  statusText: string
  icon: React.ReactNode
  isLast?: boolean
  onClick?: () => void
}

export const TimelineRow: React.FC<TimelineRowProps> = ({
  smallLabel,
  bigWord,
  statusText,
  icon,
  isLast = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: '20px',
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        padding: '8px 0',
      }}
    >
      {/* Vertical timeline connector & circular icon */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          width: '48px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--glass-bg-card)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            border: '1.5px solid var(--glass-border)',
            boxShadow: 'var(--glass-shadow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ink)',
            fontSize: '20px',
            zIndex: 2,
          }}
        >
          {icon}
        </div>

        {!isLast && (
          <div
            aria-hidden="true"
            style={{
              width: '2px',
              flex: 1,
              background: 'linear-gradient(to bottom, var(--line) 0%, rgba(227, 229, 218, 0.4) 100%)',
              margin: '8px 0',
              minHeight: '36px',
            }}
          />
        )}
      </div>

      {/* Row content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: isLast ? '0' : '28px',
        }}
      >
        <div>
          <div className="text-label" style={{ opacity: 0.65, marginBottom: '2px' }}>
            {smallLabel}
          </div>
          <div className="text-big-word" style={{ fontSize: '22px' }}>
            {bigWord}
          </div>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '6px 14px',
            background: 'var(--mist)',
            borderRadius: 'var(--radius-pill)',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--ink)',
            border: '1px solid var(--line)',
          }}
        >
          {statusText}
        </div>
      </div>
    </div>
  )
}
