import React from 'react'
import { getStrings } from '../config/strings'
import { Button } from '../ui/Button'
import { TimelineRow } from '../ui/TimelineRow'
import { StatusPill } from '../ui/StatusPill'
import { speak } from '../speech/speak'

export interface ModesProps {
  onClose: () => void
}

export const Modes: React.FC<ModesProps> = ({ onClose }) => {
  const strings = getStrings('en')

  const modesList = [
    {
      smallLabel: 'READ',
      bigWord: 'Labels & Signs',
      statusText: strings.statusReady,
      icon: '📖',
      description: 'Read mode: Identifies package text, medicine names, and signs with voice feedback.',
    },
    {
      smallLabel: 'DESCRIBE',
      bigWord: 'Scene & Objects',
      statusText: strings.statusReady,
      icon: '✨',
      description: 'Describe mode: Provides concise scene and object descriptions.',
    },
    {
      smallLabel: 'ALERT',
      bigWord: 'Obstacle Detection',
      statusText: strings.statusReady,
      icon: '🛡️',
      description: 'Alert mode: Real-time obstacle warnings to assist your navigation.',
    },
    {
      smallLabel: 'MONEY',
      bigWord: 'Pakistani Rupee',
      statusText: strings.statusReady,
      icon: '💵',
      description: 'Money mode: Scans and speaks Pakistani rupee banknote denominations.',
    },
  ]

  const handleRowClick = (desc: string) => {
    speak(desc, { interrupt: true })
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100%',
        background: 'var(--white)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 20px',
        position: 'relative',
      }}
    >
      {/* Top Header */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          {/* Close circle button top left */}
          <Button
            id="btn-close-modes"
            variant="circle"
            onClick={onClose}
            aria-label="Close modes list"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </Button>

          {/* Quick Speak Info Button */}
          <Button
            variant="circle"
            onClick={() => speak('Blink has four modes: Read, Describe, Alert, and Money.', { interrupt: true })}
            aria-label="Hear modes description"
          >
            🔊
          </Button>
        </div>

        {/* Centered title and subtitle */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
              margin: '0 0 6px 0',
            }}
          >
            {strings.modesTitle}
          </h1>
          <p
            style={{
              fontSize: '18px',
              color: 'var(--ink)',
              opacity: 0.65,
              margin: 0,
            }}
          >
            {strings.modesSubtitle}
          </p>
        </div>

        {/* Vertical Timeline */}
        <div
          style={{
            maxWidth: '460px',
            margin: '0 auto',
            padding: '0 8px',
          }}
        >
          {modesList.map((mode, index) => (
            <TimelineRow
              key={mode.smallLabel}
              smallLabel={mode.smallLabel}
              bigWord={mode.bigWord}
              statusText={mode.statusText}
              icon={mode.icon}
              isLast={index === modesList.length - 1}
              onClick={() => handleRowClick(mode.description)}
            />
          ))}
        </div>
      </div>

      {/* Bottom status pill card: check icon plus "Works offline" */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '20px',
          paddingBottom: '16px',
        }}
      >
        <StatusPill
          label={strings.worksOffline}
          variant="ok"
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            boxShadow: 'var(--shadow-card)',
          }}
        />
      </div>
    </div>
  )
}
