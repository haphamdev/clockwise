import { useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { ReportsFilterBar } from '@/components/reports/reports-filter-bar';
import { PersonalInsight } from '@/components/reports/personal-insight';
import { usePaginationParams } from '@/hooks/use-pagination-params';
import { useAuth } from '@/lib/auth/use-auth';
import { defaultTimeWindow, type TimeWindow } from '@/lib/dates/time-window-utils';

function parseIds(value: string): string[] {
  return value ? value.split(',').filter(Boolean) : [];
}

function SectionPlaceholder({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <h2 className="text-lg font-medium">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">Coming soon</p>
    </div>
  );
}

export function ReportsPage() {
  const { user } = useAuth();
  const { getParam, setParam, setParams } = usePaginationParams();

  const isAdmin = user?.isAdmin ?? false;
  const isManager = user?.teams.some((t) => t.role === 'manager') ?? false;
  const showUserFilter = isAdmin || isManager;
  const showTeamFilter = isAdmin || isManager;
  const showTeamSection = isAdmin || isManager;
  const showProjectSection = isAdmin || isManager;

  const defaults = useMemo(() => defaultTimeWindow(), []);
  const dateFrom = getParam('dateFrom') || defaults.dateFrom;
  const dateTo = getParam('dateTo') || defaults.dateTo;
  const projectIdsParam = getParam('projectIds');
  const userIdsParam = getParam('userIds');
  const teamIdsParam = getParam('teamIds');
  const projectIds = useMemo(() => parseIds(projectIdsParam), [projectIdsParam]);
  const userIds = useMemo(() => parseIds(userIdsParam), [userIdsParam]);
  const teamIds = useMemo(() => parseIds(teamIdsParam), [teamIdsParam]);

  const setArrayParam = useCallback(
    (key: string, ids: string[]) => setParam(key, ids.join(',')),
    [setParam],
  );

  const handleTimeWindowChange = useCallback(
    (w: TimeWindow) => setParams({ dateFrom: w.dateFrom, dateTo: w.dateTo }),
    [setParams],
  );

  const handleProjectIdsChange = useCallback(
    (v: string[]) => setArrayParam('projectIds', v),
    [setArrayParam],
  );

  const handleUserIdsChange = useCallback(
    (v: string[]) => setArrayParam('userIds', v),
    [setArrayParam],
  );

  const handleTeamIdsChange = useCallback(
    (v: string[]) => setArrayParam('teamIds', v),
    [setArrayParam],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Analyze time tracking data across people, teams, and projects."
      />

      <ReportsFilterBar
        dateFrom={dateFrom}
        dateTo={dateTo}
        projectIds={projectIds}
        userIds={userIds}
        teamIds={teamIds}
        showUserFilter={showUserFilter}
        showTeamFilter={showTeamFilter}
        onTimeWindowChange={handleTimeWindowChange}
        onProjectIdsChange={handleProjectIdsChange}
        onUserIdsChange={handleUserIdsChange}
        onTeamIdsChange={handleTeamIdsChange}
      />

      {user && (
        <PersonalInsight
          filters={{
            dateFrom,
            dateTo,
            projectIds: projectIds.length > 0 ? projectIds : undefined,
            userIds: userIds.length > 0 ? userIds : undefined,
            teamIds: teamIds.length > 0 ? teamIds : undefined,
          }}
          userId={user.id}
        />
      )}
      {showTeamSection && <SectionPlaceholder title="Team Insight" />}
      {showProjectSection && <SectionPlaceholder title="Project Insight" />}
    </div>
  );
}
