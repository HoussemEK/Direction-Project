import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppLayout from './components/AppLayout.jsx';
import GlobalErrorBoundary from './components/GlobalErrorBoundary.jsx';

// Lazy Load Pages
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const TracksPage = lazy(() => import('./pages/TracksPage.jsx'));
const ChallengePage = lazy(() => import('./pages/ChallengePage.jsx'));
const ReflectionPage = lazy(() => import('./pages/ReflectionPage.jsx'));
const SummaryPage = lazy(() => import('./pages/SummaryPage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));

import CosmicLoader from './components/CosmicLoader.jsx';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <GlobalErrorBoundary>
          <Suspense fallback={<CosmicLoader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/tracks" element={<TracksPage />} />
                        <Route path="/challenge" element={<ChallengePage />} />
                        <Route path="/reflection" element={<ReflectionPage />} />
                        <Route path="/summary" element={<SummaryPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                      </Routes>
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </GlobalErrorBoundary>
      </AuthProvider>
    </ToastProvider>
  );
}