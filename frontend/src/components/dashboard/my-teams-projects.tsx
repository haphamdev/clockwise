import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth/use-auth';
import type { ProjectSummary } from '@/lib/dashboard/types';

interface MyTeamsProjectsProps {
  projectSummaries: ProjectSummary[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function MyTeamsProjects({ projectSummaries, isLoading, isError }: MyTeamsProjectsProps) {
  const { user } = useAuth();
  const teams = user?.teams ?? [];
  const projects = projectSummaries ?? [];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">My Teams</CardTitle>
        </CardHeader>
        <CardContent>
          {teams.length === 0 ? (
            <p className="text-sm text-muted-foreground">No team memberships</p>
          ) : (
            <ul className="space-y-2">
              {teams.map((team) => (
                <li key={team.teamId} className="flex items-center justify-between text-sm">
                  <span>{team.teamName}</span>
                  <Badge variant="secondary" className="capitalize">
                    {team.role}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">My Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <p className="text-sm text-destructive">Failed to load projects.</p>
          ) : isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects</p>
          ) : (
            <ul className="space-y-2">
              {projects.map((project) => (
                <li key={project.projectId} className="flex items-center justify-between text-sm">
                  <Link
                    to={`/projects/${project.projectId}`}
                    className="text-foreground hover:underline"
                  >
                    {project.projectName}
                  </Link>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {project.hoursThisWeek}h · {project.entriesThisWeek} entries this week
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
