import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRoute } from '@/components/admin-route';
import { AppLayout } from '@/components/layout/app-layout';
import { LoginPage } from '@/pages/LoginPage';
import { AuthCallbackPage } from '@/pages/AuthCallbackPage';

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Coming soon</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/invite/:token" element={<PlaceholderPage title="Invite" />} />

            {/* Authenticated routes with layout */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />
              <Route path="/time-logs" element={<PlaceholderPage title="My Time Logs" />} />
              <Route path="/projects" element={<PlaceholderPage title="Projects" />} />
              <Route path="/reports" element={<PlaceholderPage title="Reports" />} />

              {/* Admin routes */}
              <Route
                path="/admin/teams"
                element={
                  <AdminRoute>
                    <PlaceholderPage title="Teams" />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/teams/:id"
                element={
                  <AdminRoute>
                    <PlaceholderPage title="Team Detail" />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <PlaceholderPage title="Users" />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/invitations"
                element={
                  <AdminRoute>
                    <PlaceholderPage title="Invitations" />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <AdminRoute>
                    <PlaceholderPage title="Org Settings" />
                  </AdminRoute>
                }
              />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
