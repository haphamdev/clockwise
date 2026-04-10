import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { UserLink } from '@/components/users/user-link';
import { ProjectLink } from '@/components/projects/project-link';
import { ChangeBadge } from '@/components/dashboard/change-badge';
import type { TeamBreakdownItem } from '@/lib/dashboard/types';

interface TeamBreakdownCardProps {
  team: TeamBreakdownItem;
  isAdmin: boolean;
}

export function TeamBreakdownCard({ team, isAdmin }: TeamBreakdownCardProps) {
  const overflowCount = team.activeProjectCount - team.activeProjects.length;

  return (
    <Card>
      <CardContent className="p-4">
        {isAdmin ? (
          <Link
            to={`/admin/teams/${team.teamId}`}
            className="text-base font-semibold text-foreground hover:underline"
          >
            {team.teamName}
          </Link>
        ) : (
          <p className="text-base font-semibold text-foreground">{team.teamName}</p>
        )}

        <div className="mt-3 grid grid-cols-3 gap-6">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Members</p>
              <p className="text-lg font-semibold">{team.memberCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">This Week</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-semibold">{team.hoursThisWeek}h</span>
                <ChangeBadge value={team.weekOverWeekPct} />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">This Month</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-semibold">{team.hoursThisMonth}h</span>
                <ChangeBadge value={team.monthOverMonthPct} />
              </div>
            </div>

            {(team.thresholdBreaches.dailyCount > 0 || team.thresholdBreaches.weeklyCount > 0) && (
              <div className="flex gap-3 text-xs">
                {team.thresholdBreaches.dailyCount > 0 && (
                  <span className="text-amber-500">
                    {team.thresholdBreaches.dailyCount} daily breach{team.thresholdBreaches.dailyCount !== 1 ? 'es' : ''}
                  </span>
                )}
                {team.thresholdBreaches.weeklyCount > 0 && (
                  <span className="text-amber-500">
                    {team.thresholdBreaches.weeklyCount} weekly breach{team.thresholdBreaches.weeklyCount !== 1 ? 'es' : ''}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="border-l pl-6">
            <p className="text-xs font-medium text-muted-foreground">Not logged this week</p>
            {team.notLoggedThisWeek.length > 0 ? (
              <ul className="mt-1 list-disc pl-4">
                {team.notLoggedThisWeek.map((u) => (
                  <li key={u.userId} className="text-xs">
                    {isAdmin ? (
                      <UserLink id={u.userId} name={u.userName} />
                    ) : (
                      <span className="text-sm font-medium">{u.userName}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">All caught up</p>
            )}
          </div>

          <div className="border-l pl-6">
            <p className="text-xs font-medium text-muted-foreground">Active Projects</p>
            {team.activeProjects.length > 0 ? (
              <ul className="mt-1 list-disc pl-4">
                {team.activeProjects.map((p) => (
                  <li key={p.projectId} className="text-xs">
                    <ProjectLink id={p.projectId} name={p.projectName} />
                  </li>
                ))}
                {overflowCount > 0 && (
                  <li className="text-xs text-muted-foreground list-none">
                    and {overflowCount} more
                  </li>
                )}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">No projects</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
