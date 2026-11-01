import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HashRouter, Route, Routes } from 'react-router'
import { AuthProvider } from '../features/auth/AuthProvider'
import { RequireAuth } from '../features/auth/RequireAuth'
import { AccountPage } from '../pages/AccountPage'
import { AuthConfirmPage } from '../pages/AuthConfirmPage'
import { CategoryPage } from '../pages/CategoryPage'
import { ComingSoonPage } from '../pages/ComingSoonPage'
import { ConversationPage } from '../pages/ConversationPage'
import { EditListingPage } from '../pages/EditListingPage'
import { HomePage } from '../pages/HomePage'
import { ListingPage } from '../pages/ListingPage'
import { LoginPage } from '../pages/LoginPage'
import { MessagesPage } from '../pages/MessagesPage'
import { NewListingPage } from '../pages/NewListingPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { PublicProfilePage } from '../pages/PublicProfilePage'
import { RegisterPage } from '../pages/RegisterPage'
import { ResetPage } from '../pages/ResetPage'
import { SearchPage } from '../pages/SearchPage'
import { Layout } from './Layout'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
  },
})

// Routes from plan section 7 that are built in later phases show "Coming soon".
const PUBLIC_PLANNED_ROUTES = ['/p/:page']
const PRIVATE_PLANNED_ROUTES = ['/admin']

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* HashRouter (#/...) because GitHub Pages cannot serve SPA routes on reload. */}
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/reset" element={<ResetPage />} />
              <Route path="/auth/confirm" element={<AuthConfirmPage />} />
              <Route path="/u/:id" element={<PublicProfilePage />} />
              <Route path="/c/:slug" element={<CategoryPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/a/:id" element={<ListingPage />} />
              {PUBLIC_PLANNED_ROUTES.map((path) => (
                <Route key={path} path={path} element={<ComingSoonPage />} />
              ))}

              <Route element={<RequireAuth />}>
                <Route path="/account" element={<AccountPage />} />
                <Route path="/new" element={<NewListingPage />} />
                <Route path="/a/:id/edit" element={<EditListingPage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/messages/:id" element={<ConversationPage />} />
                {PRIVATE_PLANNED_ROUTES.map((path) => (
                  <Route key={path} path={path} element={<ComingSoonPage />} />
                ))}
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </HashRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
