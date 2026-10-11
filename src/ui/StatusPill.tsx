import React from 'react'

export interface StatusPillProps {
  label: string
  icon?: React.ReactNode
  variant?: 'ok' | 'neutral' | 'active'
  className?: string
  style?: React.CSSProperties
}

export const StatusPill: React.FC<StatusPillProps> = ({
  label,
  icon,
  variant = 'ok',
  className = '',
  style,
}) => {
  const isOk = variant === 'ok'
  return (
    <div
      className={`blink-status-pill ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        background: 'var(--glass-bg-card)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-pill)',
        boxShadow: '0 4px 14px rgba(20, 35, 30, 0.06)',
        fontSize: '14px',
        fontWeight: 600,
        color: 'var(--ink)',
        userSelect: 'none',
        ...style,
      }}
    >
      {icon || (
        <span
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: isOk ? 'rgba(30, 122, 76, 0.15)' : 'rgba(20, 35, 30, 0.1)',
            color: isOk ? 'var(--ok)' : 'var(--ink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 700,
          }}
        >
          ✓
        </span>
      )}
      <span>{label}</span>
    </div>
  )
}
