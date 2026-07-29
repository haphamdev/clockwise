import { Link } from "react-router-dom";
import { ChangeBadge } from "@/components/dashboard/change-badge";
import { ProjectLink } from "@/components/projects/project-link";
import { Card, CardContent } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { UserLink } from "@/components/users/user-link";
import type { TeamBreakdownItem } from "@/lib/dashboard/types";

const fieldLabelClass = "flex items-center gap-1 text-xs text-muted-foreground";
const sectionLabelClass =
  "flex items-center gap-1 text-xs font-medium text-muted-foreground";

interface TeamBreakdownCardProps {
  team: TeamBreakdownItem;
  isAdmin: boolean;
}

export function TeamBreakdownCard({ team, isAdmin }: TeamBreakdownCardProps) {
  const overflowCount = team.activeProjectCount - team.activeProjects.length;

  return (
    <Card>
      <CardContent className="p-4">
        <Link
          to={`/teams/${team.teamId}`}
          className="text-base font-semibold text-foreground hover:underline"
        >
          {team.teamName}
        </Link>

        <div className="mt-3 grid grid-cols-3 gap-6">
          <div className="space-y-3">
            <div>
              <p className={fieldLabelClass}>
                Members
                <InfoTooltip label="Number of people on this team." />
              </p>
              <p className="text-lg font-semibold">{team.memberCount}</p>
            </div>
            <div>
              <p className={fieldLabelClass}>
                This Week
                <InfoTooltip label="Hours the whole team logged this week. The badge compares it with last week." />
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-semibold">
                  {team.hoursThisWeek}h
                </span>
                <ChangeBadge value={team.weekOverWeekPct} />
              </div>
            </div>
            <div>
              <p className={fieldLabelClass}>
                This Month
                <InfoTooltip label="Hours the whole team logged this month. The badge compares it with last month." />
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-semibold">
                  {team.hoursThisMonth}h
                </span>
                <ChangeBadge value={team.monthOverMonthPct} />
              </div>
            </div>

            {(team.thresholdBreaches.dailyCount > 0 ||
              team.thresholdBreaches.weeklyCount > 0) && (
              <div className="flex items-center gap-3 text-xs">
                {team.thresholdBreaches.dailyCount > 0 && (
                  <span className="text-amber-500">
                    {team.thresholdBreaches.dailyCount} daily breach
                    {team.thresholdBreaches.dailyCount !== 1 ? "es" : ""}
                  </span>
                )}
                {team.thresholdBreaches.weeklyCount > 0 && (
                  <span className="text-amber-500">
                    {team.thresholdBreaches.weeklyCount} weekly breach
                    {team.thresholdBreaches.weeklyCount !== 1 ? "es" : ""}
                  </span>
                )}
                <InfoTooltip label="How many times the team went over the org's daily or weekly hour limits." />
              </div>
            )}
          </div>

          <div className="border-l pl-6">
            <p className={sectionLabelClass}>
              Not logged this week
              <InfoTooltip label="Team members who haven't logged any time yet this week." />
            </p>
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
              <p className="mt-1 text-xs text-muted-foreground">
                All caught up
              </p>
            )}
          </div>

          <div className="border-l pl-6">
            <p className={sectionLabelClass}>
              Active Projects
              <InfoTooltip label="Projects this team is currently assigned to." />
            </p>
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
