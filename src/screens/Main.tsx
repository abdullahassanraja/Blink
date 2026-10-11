import React, { useState, useEffect, useRef } from 'react'
import { getStrings } from '../config/strings'
import { ModeTile } from '../ui/ModeTile'
import { Caption } from '../ui/Caption'
import { Sheet } from '../ui/Sheet'
import { Button } from '../ui/Button'
import { speak, stopSpeaking } from '../speech/speak'
import { CameraStatus } from '../camera/useCamera'
import { readText } from '../modes/readText'
import { describeScene } from '../modes/describe'
import {
  startObstacleDetection,
  stopObstacleDetection,
  subscribeDetectorStats,
  DetectorStats,
} from '../modes/obstacle/detector'
import {
  identifyMoney,
  stopMoneyScan,
  onMoneyDebugUpdate,
  MoneyDebugData,
} from '../modes/money'

export interface MainProps {
  videoRef: React.RefObject<HTMLVideoElement>
  cameraStatus: CameraStatus
  cameraErrorMessage: string | null
  onOpenModes: () => void
  onBackToWelcome: () => void
}

export const Main: React.FC<MainProps> = ({
  videoRef,
  cameraStatus,
  cameraErrorMessage,
  onOpenModes,
  onBackToWelcome,
}) => {
  const [activeMode, setActiveMode] = useState<string | null>(null)
  const [isAlertActive, setIsAlertActive] = useState(false)
  const [detectorStats, setDetectorStats] = useState<DetectorStats | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [moneyDebugData, setMoneyDebugData] = useState<MoneyDebugData | null>(null)
  const isDebugUrl = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1'
  const tapCountRef = useRef(0)
  const lastTapRef = useRef(0)
  const strings = getStrings('en')

  useEffect(() => {
    const unsubDetector = subscribeDetectorStats(setDetectorStats)
    const unsubMoney = isDebugUrl ? onMoneyDebugUpdate(setMoneyDebugData) : () => {}
    return () => {
      unsubDetector()
      unsubMoney()
      stopObstacleDetection()
      stopMoneyScan()
    }
  }, [isDebugUrl])

  const handleRead = async () => {
    stopMoneyScan()
    if (isAlertActive) {
      stopObstacleDetection()
      setIsAlertActive(false)
    }
    setActiveMode('read')
    await readText(videoRef.current)
  }

  const handleDescribe = async () => {
    stopMoneyScan()
    if (isAlertActive) {
      stopObstacleDetection()
      setIsAlertActive(false)
    }
    setActiveMode('describe')
    await describeScene(videoRef.current)
  }

  const handleToggleAlert = async () => {
    stopMoneyScan()
    if (isAlertActive) {
      stopObstacleDetection()
      stopSpeaking()
      setIsAlertActive(false)
      setActiveMode(null)
      speak(strings.alertOff, { interrupt: true })
    } else {
      setActiveMode('alert')
      setIsAlertActive(true)
      speak(strings.alertOn, { interrupt: true })
      if (videoRef.current) {
        await startObstacleDetection(videoRef.current)
      }
    }
  }

  const handleMoney = async () => {
    if (isAlertActive) {
      stopObstacleDetection()
      setIsAlertActive(false)
    }
    setActiveMode('money')
    await identifyMoney(videoRef.current, { lang: 'en' })
  }

  const handleStatusBadgeTap = () => {
    const now = Date.now()
    if (now - lastTapRef.current < 400) {
      tapCountRef.current++
      if (tapCountRef.current >= 3) {
        setShowDebug((prev) => !prev)
        tapCountRef.current = 0
      }
    } else {
      tapCountRef.current = 1
    }
    lastTapRef.current = now
  }


  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100dvh',
        overflow: 'hidden',
        background: '#0D1512',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Full-bleed Camera Video Viewport */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Fallback / Status overlay if camera is not ready */}
        {cameraStatus !== 'ready' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(180deg, #1A2823 0%, #101915 100%)',
              padding: '32px 24px',
              textAlign: 'center',
              color: 'var(--white)',
              gap: '16px',
              zIndex: 2,
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: cameraStatus === 'denied' ? 'rgba(179, 38, 30, 0.2)' : 'rgba(237, 241, 123, 0.15)',
                color: cameraStatus === 'denied' ? '#FF7A70' : 'var(--yellow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
              }}
            >
              {cameraStatus === 'denied' ? '🚫' : '📷'}
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: 600, margin: 0 }}>
              {cameraStatus === 'denied'
                ? 'Camera Access Denied'
                : cameraStatus === 'error'
                ? 'Camera Error'
                : 'Starting Camera...'}
            </h3>

            <p style={{ fontSize: '16px', opacity: 0.75, maxWidth: '320px', margin: 0, lineHeight: 1.4 }}>
              {cameraErrorMessage || 'Preparing live assistive video feed...'}
            </p>

            {cameraStatus === 'denied' && (
              <p style={{ fontSize: '14px', color: 'var(--yellow-soft)', marginTop: '8px' }}>
                Please allow camera access in your browser address bar.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Top Floating Glass Bar */}
      <header
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
        }}
      >
        {/* Back / Home circle button */}
        <Button
          variant="circle"
          onClick={onBackToWelcome}
          aria-label="Back to welcome screen"
          style={{
            background: 'rgba(20, 35, 30, 0.65)',
            color: 'var(--white)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </Button>

        {/* Live Camera Status Badge (Triple tap to toggle debug overlay) */}
        <div
          onClick={handleStatusBadgeTap}
          title="Triple-tap for debug stats"
          style={{
            padding: '6px 16px',
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(20, 35, 30, 0.72)',
            backdropFilter: 'var(--glass-blur-sm)',
            WebkitBackdropFilter: 'var(--glass-blur-sm)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--white)',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: cameraStatus === 'ready' ? '#4ADE80' : '#F87171',
              boxShadow: cameraStatus === 'ready' ? '0 0 8px #4ADE80' : 'none',
            }}
          />
          <span>{cameraStatus === 'ready' ? (isAlertActive ? 'Alert Live' : 'Camera Live') : 'Camera Off'}</span>
        </div>

        {/* Hidden Triple-Tap Demo Debug Overlay (Feature 4 Step 7) */}
        {showDebug && (
          <div
            style={{
              position: 'absolute',
              top: '72px',
              left: '16px',
              right: '16px',
              padding: '12px 16px',
              borderRadius: '16px',
              background: 'rgba(13, 21, 18, 0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(237, 241, 123, 0.4)',
              color: 'var(--white)',
              zIndex: 30,
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontFamily: 'monospace',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--yellow)', fontWeight: 600 }}>MediaPipe EfficientDet-Lite0</span>
              <button
                onClick={() => setShowDebug(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>FPS: <span style={{ color: '#4ADE80' }}>{detectorStats?.fps ?? 0}</span></div>
              <div>Latency: <span style={{ color: 'var(--yellow)' }}>{detectorStats?.avgLatencyMs ?? 0} ms</span></div>
              <div>Delegate: <span>{detectorStats?.delegate ?? 'GPU'}</span></div>
              <div>Loop: <span style={{ color: isAlertActive ? '#4ADE80' : '#F87171' }}>{isAlertActive ? 'ACTIVE' : 'IDLE'}</span></div>
            </div>
            {detectorStats?.lastObstacle && (
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '4px', color: '#93C5FD' }}>
                Obstacle: {detectorStats.lastObstacle.label} ({detectorStats.lastObstacle.position}, {detectorStats.lastObstacle.bucket})
              </div>
            )}
          </div>
        )}

        {/* Temporary Money Debug View (visible only with ?debug=1 in URL) */}
        {isDebugUrl && (
          <aside
            id="money-debug-view"
            aria-label="Money identifier debug view"
            style={{
              position: 'absolute',
              top: '74px',
              right: '16px',
              width: '230px',
              padding: '12px',
              borderRadius: '16px',
              background: 'rgba(13, 21, 18, 0.94)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(237, 241, 123, 0.6)',
              color: 'var(--white)',
              zIndex: 35,
              fontSize: '11px',
              fontFamily: 'monospace',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.15)', paddingBottom: '4px' }}>
              <span style={{ color: 'var(--yellow)', fontWeight: 700 }}>JPEG DEBUG</span>
              <span style={{ fontSize: '10px', color: '#93C5FD' }}>?debug=1</span>
            </div>

            {moneyDebugData ? (
              <>
                <img
                  src={moneyDebugData.dataUrl}
                  alt="Exact raw JPEG sent to /predict"
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    display: 'block',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Frame:</span>
                  <span style={{ color: 'var(--yellow)', fontWeight: 600 }}>{moneyDebugData.frameIndex} / 8</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Top:</span>
                  <span style={{ color: '#4ADE80', fontWeight: 700 }}>{moneyDebugData.prediction?.top ?? 'waiting...'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>top_p:</span>
                  <span style={{ color: '#93C5FD' }}>{moneyDebugData.prediction ? moneyDebugData.prediction.top_p.toFixed(3) : '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>second_p:</span>
                  <span>{moneyDebugData.prediction ? moneyDebugData.prediction.second_p.toFixed(3) : '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Latency:</span>
                  <span>{moneyDebugData.prediction ? `${moneyDebugData.prediction.latency_ms}ms` : '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Streak:</span>
                  <span style={{ color: moneyDebugData.consecutiveWins >= 3 ? '#4ADE80' : 'var(--yellow)' }}>{moneyDebugData.consecutiveWins} / 3</span>
                </div>
              </>
            ) : (
              <div style={{ padding: '12px 0', textAlign: 'center', opacity: 0.7 }}>
                Tap Money card to inspect raw JPEG frame
              </div>
            )}
          </aside>
        )}

        {/* Modes / Settings circle button */}
        <Button
          id="btn-open-modes"
          variant="circle"
          onClick={onOpenModes}
          aria-label="View all modes and features"
          style={{
            background: 'rgba(20, 35, 30, 0.65)',
            color: 'var(--white)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </Button>
      </header>

      {/* Bottom Sheet with Live Caption and 2x2 Mode Grid */}
      <Sheet style={{ zIndex: 10, paddingBottom: '16px' }}>
        {/* Live spoken caption card */}
        <Caption />

        {/* 2-Column Responsive Grid of Aesthetic Minimal Mode Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '14px',
            marginTop: '4px',
            paddingBottom: '76px', /* Ensures cards scroll completely clear of the floating dock */
          }}
        >
          {/* Read Mode */}
          <ModeTile
            id="read"
            title={strings.modeRead}
            subtitle="Labels & Signs"
            icon="📖"
            tag="Instant OCR"
            badgeText="Read Text"
            imageSrc="/cards/read.jpg"
            isActive={activeMode === 'read'}
            onClick={handleRead}
          />

          {/* Describe Mode */}
          <ModeTile
            id="describe"
            title={strings.modeDescribe}
            subtitle="Scene & Objects"
            icon="✨"
            tag="AI Vision"
            badgeText="Describe"
            imageSrc="/cards/describe.jpg"
            isActive={activeMode === 'describe'}
            onClick={handleDescribe}
          />

          {/* Alert Mode */}
          <ModeTile
            id="alert"
            title={isAlertActive ? 'Stop Alert' : strings.modeAlert}
            subtitle={isAlertActive ? 'Active • Pinging' : 'Obstacle Safety'}
            icon={isAlertActive ? '🛑' : '🛡️'}
            tag={isAlertActive ? 'Live Warning' : 'Real-Time'}
            badgeText={isAlertActive ? 'Stop Alert' : 'Start Alert'}
            imageSrc="/cards/alert.jpg"
            isActive={isAlertActive}
            onClick={handleToggleAlert}
          />

          {/* Money Mode */}
          <ModeTile
            id="money"
            title={strings.modeMoney}
            subtitle={activeMode === 'money' ? 'Scanning • Up to 8 frames' : 'Rupee Notes'}
            icon="💵"
            tag="Currency"
            badgeText={activeMode === 'money' ? 'Scanning...' : 'Scan Cash'}
            imageSrc="/cards/money.jpg"
            isActive={activeMode === 'money'}
            onClick={handleMoney}
          />
        </div>

        {/* Floating frosted glass bottom navigation bar (matching 'Get Started' glass effect) */}
        <nav
          aria-label="Quick navigation dock"
          style={{
            position: 'sticky',
            bottom: '4px',
            zIndex: 20,
            marginTop: '-64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(38, 44, 38, 0.72)',
            backdropFilter: 'blur(30px) saturate(180%)',
            WebkitBackdropFilter: 'blur(30px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '999px',
            padding: '6px 8px',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
          }}
        >
          {/* Camera Tab (Active) */}
          <button
            onClick={() => speak('Main camera view active.', { interrupt: true })}
            aria-label="Camera active"
            style={{
              flex: 1,
              height: '46px',
              border: 'none',
              borderRadius: '999px',
              background: 'rgba(237, 241, 123, 0.22)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'rgba(237, 241, 123, 0.5)',
              color: 'var(--yellow)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.18s ease',
            }}
          >
            <span style={{ fontSize: '16px', lineHeight: 1 }}>📷</span>
            <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '-0.01em' }}>Camera</span>
          </button>

          {/* Modes Timeline Tab */}
          <button
            onClick={onOpenModes}
            aria-label="Open modes timeline"
            style={{
              flex: 1,
              height: '46px',
              border: 'none',
              borderRadius: '999px',
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.85)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.18s ease',
            }}
          >
            <span style={{ fontSize: '16px', lineHeight: 1 }}>📋</span>
            <span style={{ fontSize: '11px', fontWeight: 500 }}>Modes</span>
          </button>

          {/* Obstacle Alert Tab */}
          <button
            onClick={handleToggleAlert}
            aria-label={isAlertActive ? 'Stop obstacle alert' : 'Start obstacle alert'}
            style={{
              flex: 1,
              height: '46px',
              border: 'none',
              borderRadius: '999px',
              background: isAlertActive ? 'rgba(248, 113, 113, 0.25)' : 'transparent',
              borderColor: isAlertActive ? 'rgba(248, 113, 113, 0.6)' : 'transparent',
              borderWidth: isAlertActive ? '1px' : '0',
              borderStyle: 'solid',
              color: isAlertActive ? '#FCA5A5' : 'rgba(255, 255, 255, 0.85)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.18s ease',
            }}
          >
            <span style={{ fontSize: '16px', lineHeight: 1 }}>{isAlertActive ? '🛑' : '🛡️'}</span>
            <span style={{ fontSize: '11px', fontWeight: 500 }}>{isAlertActive ? 'Alerting' : 'Alert'}</span>
          </button>

          {/* Spoken Help Tab */}
          <button
            onClick={() => speak(strings.helpText, { interrupt: true })}
            aria-label="Spoken help"
            style={{
              flex: 1,
              height: '46px',
              border: 'none',
              borderRadius: '999px',
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.85)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.18s ease',
            }}
          >
            <span style={{ fontSize: '16px', lineHeight: 1 }}>❓</span>
            <span style={{ fontSize: '11px', fontWeight: 500 }}>Help</span>
          </button>
        </nav>
      </Sheet>
    </div>
  )
}
