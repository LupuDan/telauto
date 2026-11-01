import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { captureAuthRedirect } from './features/auth/authRedirect'
import './i18n'
import './index.css'

// Email links return as "?code=..." – move them into the hash route before the router starts.
captureAuthRedirect()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
