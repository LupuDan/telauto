import { Navigate, Outlet, useLocation } from 'react-router'
import { LoadingState } from '../../components/ui/LoadingState'
import { useAuth } from './authContext'

/** Wraps routes that need a logged-in user; others are sent to #/login and come back afterwards. */
export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingState />
  }
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }
  return <Outlet />
}
