import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import './i18n.js'
import { loadConfig } from './lib/runtimeConfig.js'
import { restoreSession, setOnSessionEnded } from './utils/auth/sessionManager.js'
import { startTokenRefreshScheduler, stopTokenRefreshScheduler } from './utils/auth/tokenRefreshManager.js'

const root = createRoot(document.getElementById('root'))

function showFatal(error) {
  root.render(<p style={{ padding: 24 }}>{error?.message || 'Failed to start the application.'}</p>)
}

// Backend url/token come from /config.json, so it must load before any request.
loadConfig()
  .then(() => {
    // Session ended (server-side or after 45 min of inactivity): drop to login.
    setOnSessionEnded(() => {
      stopTokenRefreshScheduler()
      window.location.replace('/login')
    })
    if (restoreSession()) startTokenRefreshScheduler()

    root.render(
      <StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StrictMode>,
    )
  })
  .catch(showFatal)
