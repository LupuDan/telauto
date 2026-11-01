import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HashRouter, Route, Routes } from 'react-router'
import { ComingSoonPage } from '../pages/ComingSoonPage'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { Layout } from './Layout'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
  },
})

// Routes from plan section 7. Pages not built yet show "Coming soon".
const PLANNED_ROUTES = [
  '/c/:slug',
  '/search',
  '/a/:id',
  '/a/:id/edit',
  '/new',
  '/u/:id',
  '/account',
  '/messages',
  '/messages/:id',
  '/login',
  '/register',
  '/reset',
  '/admin',
  '/p/:page',
]

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* HashRouter (#/...) because GitHub Pages cannot serve SPA routes on reload. */}
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            {PLANNED_ROUTES.map((path) => (
              <Route key={path} path={path} element={<ComingSoonPage />} />
            ))}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  )
}
