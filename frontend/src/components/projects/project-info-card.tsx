import { Pencil, Archive, ArchiveRestore } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import type { ProjectDetail } from '@/lib/projects/types';
import { TimeDisplay } from '@/components/ui/time-display';

interface ProjectInfoCardProps {
  project: ProjectDetail;
  onEdit: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  canEdit: boolean;
  canArchive: boolean;
}

export function ProjectInfoCard({
  project,
  onEdit,
  onArchive,
  onUnarchive,
  canEdit,
  canArchive,
}: ProjectInfoCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            {project.name}
            <StatusBadge status={project.status} />
          </CardTitle>
          {project.description && (
            <p className="text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          {project.status === 'archived' ? (
            canArchive && (
              <Button variant="outline" size="sm" onClick={onUnarchive}>
                <ArchiveRestore className="mr-1.5 h-3.5 w-3.5" />
                Unarchive
              </Button>
            )
          ) : (
            <>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
              )}
              {canArchive && (
                <Button variant="outline" size="sm" onClick={onArchive}>
                  <Archive className="mr-1.5 h-3.5 w-3.5" />
                  Archive
                </Button>
              )}
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Teams</dt>
            <dd className="font-medium">{project.teams.length}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Created</dt>
            <dd className="font-medium"><TimeDisplay value={project.createdAt} /></dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
