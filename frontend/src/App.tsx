import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRoute } from '@/components/admin-route';
import { AppLayout } from '@/components/layout/app-layout';
import { LoginPage } from '@/pages/LoginPage';
import { AuthCallbackPage } from '@/pages/AuthCallbackPage';
import { TeamsPage } from '@/pages/admin/teams-page';
import { TeamDetailPage } from '@/pages/admin/team-detail-page';
import { UsersPage } from '@/pages/admin/users-page';
import { UserDetailPage } from '@/pages/admin/user-detail-page';
import { InvitationsPage } from '@/pages/admin/invitations-page';
import { OrgSettingsPage } from '@/pages/admin/org-settings-page';
import { InviteLandingPage } from '@/pages/invite-landing-page';
import { ProfilePage } from '@/pages/profile-page';

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
            <Route path="/invite/:token" element={<InviteLandingPage />} />

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
              <Route path="/profile" element={<ProfilePage />} />

              {/* Admin routes */}
              <Route
                path="/admin/teams"
                element={
                  <AdminRoute>
                    <TeamsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/teams/:id"
                element={
                  <AdminRoute>
                    <TeamDetailPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <UsersPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/users/:id"
                element={
                  <AdminRoute>
                    <UserDetailPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/invitations"
                element={
                  <AdminRoute>
                    <InvitationsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <AdminRoute>
                    <OrgSettingsPage />
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
