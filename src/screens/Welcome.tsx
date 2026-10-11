import React, { useState } from 'react'
import { APP_NAME } from '../config/app'
import { getStrings } from '../config/strings'
import { Button } from '../ui/Button'
import { unlockSpeech, speak } from '../speech/speak'

export interface WelcomeProps {
  onStart: () => void
}

export const Welcome: React.FC<WelcomeProps> = ({ onStart }) => {
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const strings = getStrings('en')

  const handleStart = async () => {
    // 1. Mobile audio unlock on direct tap
    unlockSpeech()

    // 2. Speak greeting if voice enabled
    if (voiceEnabled) {
      speak(strings.greeting, { interrupt: true })
    }

    // 3. Notify parent to start camera and transition to Main screen
    onStart()
  }

  const toggleVoice = () => {
    const next = !voiceEnabled
    setVoiceEnabled(next)
    if (next) {
      speak('Voice enabled.', { interrupt: true })
    }
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#0B1310',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Real-world background image with dark mode tint and reduced opacity */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        <img
          src="/Woman%20in%20Floral%20Dress.png"
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 20%',
            opacity: 0.38,
            filter: 'contrast(1.05)',
          }}
        />
        {/* Dark mode gradient overlays for optimal text readability */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(11, 19, 16, 0.4) 0%, rgba(11, 19, 16, 0.65) 50%, rgba(11, 19, 16, 0.92) 100%)',
          }}
        />
      </div>

      {/* Top Hero Section: Spaced so her face in the center remains completely uncovered */}
      <div
        style={{
          flex: '1 1 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 24px 16px 24px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Floating pill badges moved UP to top of screen (above face) */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '8px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(255, 255, 255, 0.14)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              fontSize: '12px',
              fontWeight: 600,
              color: '#FFFFFF',
              transform: 'rotate(-2deg)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            }}
          >
            Voice Active
          </span>
          <span
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(237, 241, 123, 0.16)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(237, 241, 123, 0.35)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--yellow)',
              transform: 'rotate(2deg)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            }}
          >
            AI Assistant
          </span>
        </div>

        {/* Textual 'blink' logo & subtitle moved DOWN (below face) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <h1
            style={{
              fontSize: '56px',
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '-0.035em',
              margin: '0 0 8px 0',
              textAlign: 'center',
              textTransform: 'lowercase',
              lineHeight: 1,
              textShadow: '0 4px 24px rgba(0, 0, 0, 0.7)',
            }}
          >
            {APP_NAME.toLowerCase()}
          </h1>

          <p
            style={{
              fontSize: '19px',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0,
              textAlign: 'center',
              textShadow: '0 2px 14px rgba(0, 0, 0, 0.6)',
            }}
          >
            Navigate with <span style={{ fontStyle: 'italic', fontWeight: 600, color: 'var(--yellow)' }}>clarity.</span>
          </p>
        </div>
      </div>

      {/* Bottom Controls: Floating directly over background without white sheet */}
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          margin: '0 auto',
          padding: '0 20px 28px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Two solid white buttons side by side ("Voice on", "English") on top of Start button */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onClick={toggleVoice}
            aria-label={voiceEnabled ? 'Voice output on' : 'Voice output muted'}
            style={{
              height: '44px',
              minHeight: '44px',
              padding: '0 12px',
              borderRadius: 'var(--radius-pill)',
              background: '#FFFFFF',
              color: 'var(--ink)',
              border: '1px solid var(--line)',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font)',
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span style={{ fontSize: '15px', flexShrink: 0 }}>{voiceEnabled ? '🔊' : '🔇'}</span>
            <span style={{ whiteSpace: 'nowrap' }}>{voiceEnabled ? strings.voiceOn : 'Voice muted'}</span>
          </button>

          <button
            type="button"
            aria-label="Current language English"
            onClick={() => speak('Language is set to English.', { interrupt: true })}
            style={{
              height: '44px',
              minHeight: '44px',
              padding: '0 12px',
              borderRadius: 'var(--radius-pill)',
              background: '#FFFFFF',
              color: 'var(--ink)',
              border: '1px solid var(--line)',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font)',
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span style={{ fontSize: '15px', flexShrink: 0 }}>🌐</span>
            <span style={{ whiteSpace: 'nowrap' }}>{strings.languageLabel}</span>
          </button>
        </div>

        {/* High-aesthetic glass slider button matching cropped reference image */}
        <Button
          id="btn-get-started"
          variant="glass-slider"
          fullWidth
          onClick={handleStart}
          aria-label="Start Blink camera and assistant"
        >
          Get Started
        </Button>

        {/* Compact footer: Privacy and How it works floating directly over dark bg */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '2px 4px 0 4px',
            gap: '10px',
          }}
        >
          <p
            style={{
              fontSize: '12px',
              lineHeight: 1.35,
              color: 'rgba(255, 255, 255, 0.72)',
              margin: 0,
              flex: 1,
              textShadow: '0 1px 4px rgba(0, 0, 0, 0.6)',
            }}
          >
            {strings.privacy}
          </p>
          <button
            type="button"
            onClick={() => setShowHowItWorks(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--yellow)',
              textDecoration: 'underline',
              fontSize: '12px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              padding: '4px 0',
              textShadow: '0 1px 4px rgba(0, 0, 0, 0.6)',
            }}
          >
            {strings.howItWorks}
          </button>
        </div>
      </div>

      {/* How it works modal / overlay */}
      {showHowItWorks && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="How Blink Works"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(20, 35, 30, 0.65)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              background: 'var(--white)',
              borderRadius: 'var(--radius-card)',
              padding: '28px 24px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <h3 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
              How Blink Works
            </h3>
            <div style={{ fontSize: '15px', lineHeight: 1.55, color: 'var(--ink)', opacity: 0.9 }}>
              <p style={{ margin: '0 0 10px 0' }}>
                • <strong>Voice first:</strong> Tap any mode to listen. Blink speaks short, direct sentences.
              </p>
              <p style={{ margin: '0 0 10px 0' }}>
                • <strong>Powered by Gemini:</strong> Real-time vision is powered by Google Gemini models to read packaging and describe environments.
              </p>
              <p style={{ margin: '0 0 10px 0' }}>
                • <strong>Camera assistant:</strong> Reads labels, describes rooms, alerts obstacles, and checks rupee currency.
              </p>
              <p style={{ margin: 0 }}>
                • <strong>Privacy protected:</strong> Photos are sent to Gemini for instant real-time analysis and are never saved or stored.
              </p>
            </div>
            <Button
              variant="primary"
              fullWidth
              onClick={() => setShowHowItWorks(false)}
              style={{ minHeight: '54px', fontSize: '16px' }}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
