import React from 'react'

export interface SheetProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  frosted?: boolean
}

export const Sheet: React.FC<SheetProps> = ({
  children,
  className = '',
  style,
  frosted = true,
}) => {
  return (
    <section
      className={`blink-sheet sheet-scroll-area ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '540px',
        maxHeight: 'calc(100dvh - 68px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
        margin: '0 auto',
        borderTopLeftRadius: 'var(--radius-sheet)',
        borderTopRightRadius: 'var(--radius-sheet)',
        background: frosted ? 'var(--glass-bg-sheet)' : 'var(--white)',
        backdropFilter: frosted ? 'var(--glass-blur)' : 'none',
        WebkitBackdropFilter: frosted ? 'var(--glass-blur)' : 'none',
        borderTop: '1.5px solid var(--glass-border)',
        borderLeft: '1.5px solid var(--glass-border)',
        borderRight: '1.5px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow)',
        padding: '20px 18px 28px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        zIndex: 10,
        ...style,
      }}
    >
      {/* Subtle grab handle bar */}
      <div
        aria-hidden="true"
        style={{
          width: '36px',
          height: '4px',
          borderRadius: '2px',
          background: 'rgba(20, 35, 30, 0.18)',
          margin: '0 auto 6px auto',
        }}
      />
      {children}
    </section>
  )
}
