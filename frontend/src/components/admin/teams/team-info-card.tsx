import { Pencil, Archive, ArchiveRestore } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import type { TeamDetail } from '@/lib/teams/types';
import { TimeDisplay } from '@/components/ui/time-display';

interface TeamInfoCardProps {
  team: TeamDetail;
  onEdit?: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
  readOnly?: boolean;
}

export function TeamInfoCard({ team, onEdit, onArchive, onUnarchive, readOnly }: TeamInfoCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            {team.name}
            <StatusBadge status={team.isArchived ? 'archived' : 'active'} />
          </CardTitle>
          {team.description && (
            <p className="text-sm text-muted-foreground">{team.description}</p>
          )}
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            {team.isArchived ? (
              onUnarchive && (
                <Button variant="outline" size="sm" onClick={onUnarchive}>
                  <ArchiveRestore className="mr-1.5 h-3.5 w-3.5" />
                  Unarchive
                </Button>
              )
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={onArchive}>
                  <Archive className="mr-1.5 h-3.5 w-3.5" />
                  Archive
                </Button>
              </>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Members</dt>
            <dd className="font-medium">{team.members.length}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Created</dt>
            <dd className="font-medium">
              <TimeDisplay value={team.createdAt} />
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
