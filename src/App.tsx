import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { MotionConfig, motion } from 'motion/react';
import { AuthProvider } from './context/AuthContext';
import { AdminCatalogProvider } from './context/AdminCatalogContext';
import { LibraryProvider } from './context/LibraryContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { GridSkeleton } from './components/StateBlocks';
import { LIQUID_EASE } from './styles/glassTokens';

const CatalogPage = lazy(() =>
  import('./pages/CatalogPage').then((m) => ({ default: m.CatalogPage }))
);
const SearchPage = lazy(() =>
  import('./pages/SearchPage').then((m) => ({ default: m.SearchPage }))
);
const DetailsPage = lazy(() =>
  import('./pages/DetailsPage').then((m) => ({ default: m.DetailsPage }))
);
const WatchPlayerPage = lazy(() =>
  import('./pages/WatchPlayerPage').then((m) => ({ default: m.WatchPlayerPage }))
);
const MyListPage = lazy(() =>
  import('./pages/MyListPage').then((m) => ({ default: m.MyListPage }))
);
const ContinueWatchingPage = lazy(() =>
  import('./pages/ContinueWatchingPage').then((m) => ({ default: m.ContinueWatchingPage }))
);
const WatchHistoryPage = lazy(() =>
  import('./pages/WatchHistoryPage').then((m) => ({ default: m.WatchHistoryPage }))
);
const LoginPage = lazy(() =>
  import('./pages/AuthPages').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('./pages/AuthPages').then((m) => ({ default: m.RegisterPage }))
);
const ForgotPasswordPage = lazy(() =>
  import('./pages/AuthPages').then((m) => ({ default: m.ForgotPasswordPage }))
);
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const AdminPage = lazy(() =>
  import('./pages/AdminPage').then((m) => ({ default: m.AdminPage }))
);
const AboutPage = lazy(() =>
  import('./pages/InfoPages').then((m) => ({ default: m.AboutPage }))
);
const PrivacyPage = lazy(() =>
  import('./pages/InfoPages').then((m) => ({ default: m.PrivacyPage }))
);
const TermsPage = lazy(() =>
  import('./pages/InfoPages').then((m) => ({ default: m.TermsPage }))
);
const NotFoundPage = lazy(() =>
  import('./pages/InfoPages').then((m) => ({ default: m.NotFoundPage }))
);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function RouteFallback() {
  return (
    <div className="w-full pt-4">
      <GridSkeleton count={14} />
    </div>
  );
}

function AnimatedRoutes({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: LIQUID_EASE }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <AdminCatalogProvider>
            <LibraryProvider>
              <BrowserRouter>
                <ScrollToTop />
                <Layout>
                  <Suspense fallback={<RouteFallback />}>
                    <AnimatedRoutes>
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/movies" element={<CatalogPage mediaType="movie" />} />
                        <Route path="/tv" element={<CatalogPage mediaType="tv" />} />
                        <Route path="/anime" element={<CatalogPage mediaType="anime" />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/movie/:id" element={<DetailsPage mediaType="movie" />} />
                        <Route path="/tv/:id" element={<DetailsPage mediaType="tv" />} />
                        <Route path="/anime/:id" element={<DetailsPage mediaType="anime" />} />
                        <Route path="/watch/:type/:id" element={<WatchPlayerPage />} />
                        <Route path="/my-list" element={<MyListPage />} />
                        <Route path="/continue-watching" element={<ContinueWatchingPage />} />
                        <Route path="/history" element={<WatchHistoryPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/admin" element={<AdminPage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/privacy" element={<PrivacyPage />} />
                        <Route path="/terms" element={<TermsPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                      </Routes>
                    </AnimatedRoutes>
                  </Suspense>
                </Layout>
              </BrowserRouter>
            </LibraryProvider>
          </AdminCatalogProvider>
        </AuthProvider>
      </MotionConfig>
    </ErrorBoundary>
  );
}
