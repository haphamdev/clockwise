import { PageHeader } from '@/components/ui/page-header';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { useAuth } from '@/lib/auth/use-auth';
import { isAdminOrManager } from '@/lib/auth/role-utils';
import { useMySummary } from '@/lib/dashboard/use-my-summary';
import { MyHoursCards } from '@/components/dashboard/my-hours-cards';
import { GapsList } from '@/components/dashboard/gaps-list';
import { RecentLogsTable } from '@/components/dashboard/recent-logs-table';
import { MyTeamsProjects } from '@/components/dashboard/my-teams-projects';
import { TeamBreakdownSection } from '@/components/dashboard/team-breakdown-section';
import { OrgOverviewCards } from '@/components/dashboard/org-overview-cards';

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useMySummary();

  useDocumentTitle('Clockwise - Dashboard');

  const isAdmin = !!user?.isAdmin;
  const showTeamBreakdown = !!user && isAdminOrManager(user);
  const showOrgOverview = isAdmin;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />
      <MyHoursCards data={data?.myHours} isLoading={isLoading} isError={isError} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="md:col-span-3">
          <RecentLogsTable logs={data?.recentLogs} isLoading={isLoading} isError={isError} />
        </div>
        <GapsList gaps={data?.gaps} isLoading={isLoading} isError={isError} />
      </div>
      <MyTeamsProjects projectSummaries={data?.projectSummaries} isLoading={isLoading} isError={isError} />
      <TeamBreakdownSection enabled={showTeamBreakdown} isAdmin={isAdmin} />
      <OrgOverviewCards enabled={showOrgOverview} />
    </div>
  );
}
