import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import LandingPage from './LandingPage'
import PrivacyPage from './PrivacyPage'

// Lazy-load the in-app demo (has react-native deps) to avoid bundling issues
const App = lazy(() => import('./App'))

/**
 * Simple path-based router:
 *  - /           → Landing page
 *  - /privacy    → Privacy policy
 *  - /app        → In-app demo (existing DeviceFrame UI)
 */
function Router() {
  const path = window.location.pathname

  if (path === '/privacy') return <PrivacyPage />
  if (path === '/app') {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-[#0a0614] flex items-center justify-center">
          <div className="text-violet-400 text-lg font-semibold animate-pulse">Loading app demo…</div>
        </div>
      }>
        <App />
      </Suspense>
    )
  }
  return <LandingPage />
}

const root = createRoot(document.getElementById('root')!)

function render() {
  root.render(
    <StrictMode>
      <Router />
    </StrictMode>,
  )
}

render()

// Listen for popstate (back/forward buttons)
window.addEventListener('popstate', render)

// Override pushState to trigger re-renders
const originalPushState = history.pushState.bind(history)
history.pushState = (...args: Parameters<typeof history.pushState>) => {
  originalPushState(...args)
  render()
}
