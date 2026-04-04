import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
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
import { UserPreferencesPage } from '@/pages/user-preferences-page';
import { ProjectsPage } from '@/pages/projects-page';
import { ProjectDetailPage } from '@/pages/project-detail-page';
import { TimeLogsPage } from '@/pages/time-logs-page';
import { ImportPage } from '@/pages/import-page';
import { ReportsPage } from '@/pages/reports-page';

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
    <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
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
                <Route path="/time-logs" element={<TimeLogsPage />} />
                <Route path="/import" element={<ImportPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/settings" element={<UserPreferencesPage />} />

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
    </ThemeProvider>
  );
}
