import React from 'react'

export type ButtonVariant = 'primary' | 'pill' | 'circle' | 'glass-slider'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  icon?: React.ReactNode
  fullWidth?: boolean
  children?: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  icon,
  fullWidth = false,
  children,
  className = '',
  style,
  ...rest
}) => {
  const baseStyles: React.CSSProperties = {
    fontFamily: 'var(--font)',
    cursor: 'pointer',
    border: 'none',
    outline: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
    textDecoration: 'none',
    ...(fullWidth ? { width: '100%' } : {}),
    ...style,
  }

  if (variant === 'primary') {
    return (
      <button
        className={`btn-primary ${className}`}
        style={{
          ...baseStyles,
          minHeight: '72px',
          padding: '0 28px',
          background: 'var(--ink)',
          color: 'var(--yellow)',
          borderRadius: 'var(--radius-pill)',
          fontSize: '20px',
          fontWeight: 600,
          boxShadow: '0 8px 24px rgba(20, 35, 30, 0.25)',
          gap: '12px',
        }}
        {...rest}
      >
        {children}
        {icon}
      </button>
    )
  }

  if (variant === 'pill') {
    return (
      <button
        className={`btn-pill ${className}`}
        style={{
          ...baseStyles,
          minHeight: '56px',
          padding: '0 24px',
          background: 'var(--glass-bg-pill)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          color: 'var(--ink)',
          border: '1.5px solid var(--glass-border)',
          borderRadius: 'var(--radius-pill)',
          fontSize: '16px',
          fontWeight: 600,
          gap: '8px',
          boxShadow: '0 4px 16px rgba(20, 35, 30, 0.05)',
        }}
        {...rest}
      >
        {icon}
        {children}
      </button>
    )
  }

  if (variant === 'circle') {
    return (
      <button
        className={`btn-circle ${className}`}
        style={{
          ...baseStyles,
          width: '52px',
          height: '52px',
          minWidth: '52px',
          minHeight: '52px',
          borderRadius: '50%',
          background: 'var(--glass-bg-card)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          color: 'var(--ink)',
          border: '1.5px solid var(--glass-border)',
          boxShadow: '0 4px 16px rgba(20, 35, 30, 0.08)',
          padding: 0,
        }}
        {...rest}
      >
        {children || icon}
      </button>
    )
  }

  if (variant === 'glass-slider') {
    // Exact match for the reference mockup: dark smoky translucent glass, ››› chevrons, white text, white circle arrow button
    return (
      <button
        className={`btn-glass-slider ${className}`}
        style={{
          ...baseStyles,
          minHeight: '60px',
          height: '60px',
          padding: '4px 6px 4px clamp(14px, 4vw, 22px)',
          background: 'rgba(38, 44, 38, 0.65)',
          backdropFilter: 'blur(30px) saturate(180%)',
          WebkitBackdropFilter: 'blur(30px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: '999px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'var(--white)',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
          cursor: 'pointer',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
          maxWidth: '100%',
        }}
        {...rest}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2.5vw, 18px)', pointerEvents: 'none', minWidth: 0, overflow: 'hidden' }}>
          <span
            style={{
              color: 'rgba(255, 255, 255, 0.72)',
              fontSize: 'clamp(15px, 3.8vw, 18px)',
              fontWeight: 400,
              letterSpacing: '2px',
              userSelect: 'none',
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ›››
          </span>
          <span
            style={{
              fontSize: 'clamp(15px, 3.8vw, 18px)',
              fontWeight: 500,
              color: '#FFFFFF',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {children || 'Get Started'}
          </span>
        </div>
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: '#FFFFFF',
            color: '#14231E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
            flexShrink: 0,
            pointerEvents: 'none',
          }}
        >
          {icon || (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#14231E"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          )}
        </div>
      </button>
    )
  }

  return <button style={baseStyles} {...rest}>{children}</button>
}
