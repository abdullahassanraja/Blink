import { useState } from 'react'
import { Welcome } from './screens/Welcome'
import { Main } from './screens/Main'
import { Modes } from './screens/Modes'
import { useCamera } from './camera/useCamera'

export type Screen = 'welcome' | 'main' | 'modes'

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome')
  const camera = useCamera()

  const handleStartFromWelcome = () => {
    setCurrentScreen('main')
    // Camera remains OFF in menu screen until user selects a mode
  }

  const handleOpenModes = () => {
    camera.stop()
    setCurrentScreen('modes')
  }

  const handleCloseModes = () => {
    setCurrentScreen('main')
  }

  const handleBackToWelcome = () => {
    camera.stop()
    setCurrentScreen('welcome')
  }

  return (
    <main style={{ minHeight: '100dvh', width: '100%', position: 'relative' }}>
      {currentScreen === 'welcome' && (
        <Welcome onStart={handleStartFromWelcome} />
      )}

      {currentScreen === 'main' && (
        <Main
          videoRef={camera.videoRef}
          cameraStatus={camera.status}
          cameraErrorMessage={camera.errorMessage}
          onStartCamera={camera.start}
          onStopCamera={camera.stop}
          onOpenModes={handleOpenModes}
          onBackToWelcome={handleBackToWelcome}
        />
      )}

      {currentScreen === 'modes' && (
        <Modes onClose={handleCloseModes} />
      )}
    </main>
  )
}
