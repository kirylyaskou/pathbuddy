import React, { useState, useCallback, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { SplashScreen } from './app/SplashScreen'
import { AppRouter } from './app/router'
import { AppProviders } from './app/providers'
import './app/styles/globals.css'

function App() {
  const [dbReady, setDbReady] = useState(false)
  const handleReady = useCallback(() => setDbReady(true), [])

  useEffect(() => {
    document.getElementById('static-splash')?.remove()
  }, [])

  return (
    <AppProviders>
      {dbReady ? <AppRouter /> : <SplashScreen onReady={handleReady} />}
    </AppProviders>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
