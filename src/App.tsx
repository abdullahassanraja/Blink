import { useState } from 'react'
import { Welcome } from './screens/Welcome'
import { Main } from './screens/Main'
import { Modes } from './screens/Modes'
import { useCamera } from './camera/useCamera'

export type Screen = 'welcome' | 'main' | 'modes'

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome')
  const camera = useCamera()

  const handleStartFromWelcome = async () => {
    setCurrentScreen('main')
    await camera.start()
  }

  const handleOpenModes = () => {
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
