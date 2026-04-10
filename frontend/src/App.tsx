import { lazy, Suspense } from 'react';
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
import { TeamsPage } from '@/pages/teams-page';
import { TeamDetailPage } from '@/pages/team-detail-page';
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
import { ManagerRoute } from '@/components/manager-route';
import { DashboardPage } from '@/pages/dashboard-page';
import { Skeleton } from '@/components/ui/skeleton';

const PersonalInsightPage = lazy(() =>
  import('@/pages/reports/personal-insight-page').then((m) => ({ default: m.PersonalInsightPage })),
);
const TeamInsightPage = lazy(() =>
  import('@/pages/reports/team-insight-page').then((m) => ({ default: m.TeamInsightPage })),
);
const ProjectInsightPage = lazy(() =>
  import('@/pages/reports/project-insight-page').then((m) => ({ default: m.ProjectInsightPage })),
);

function ReportFallback() {
  return <Skeleton className="h-[60vh] w-full" />;
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
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/time-logs" element={<TimeLogsPage />} />
                <Route path="/import" element={<ImportPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />
                <Route path="/reports" element={<Navigate to="/reports/personal" replace />} />
                <Route
                  path="/reports/personal"
                  element={
                    <Suspense fallback={<ReportFallback />}>
                      <PersonalInsightPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/reports/team"
                  element={
                    <ManagerRoute>
                      <Suspense fallback={<ReportFallback />}>
                        <TeamInsightPage />
                      </Suspense>
                    </ManagerRoute>
                  }
                />
                <Route
                  path="/reports/project"
                  element={
                    <ManagerRoute>
                      <Suspense fallback={<ReportFallback />}>
                        <ProjectInsightPage />
                      </Suspense>
                    </ManagerRoute>
                  }
                />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/settings" element={<UserPreferencesPage />} />

                {/* Manager+ routes */}
                <Route
                  path="/teams"
                  element={
                    <ManagerRoute>
                      <TeamsPage />
                    </ManagerRoute>
                  }
                />
                <Route
                  path="/teams/:id"
                  element={
                    <ManagerRoute>
                      <TeamDetailPage />
                    </ManagerRoute>
                  }
                />

                {/* Admin routes */}
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
