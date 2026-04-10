import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ProjectInfoCard } from '@/components/projects/project-info-card';
import { ProjectTeamsTable } from '@/components/projects/project-teams-table';
import { EditProjectSheet } from '@/components/projects/edit-project-sheet';
import { AssignTeamSheet } from '@/components/projects/assign-team-sheet';
import { AuditTimeline } from '@/components/audit-logs/audit-timeline';
import { LogTimeSheet } from '@/components/time-logs/log-time-sheet';
import { useProjectDetail } from '@/lib/projects/use-project-detail';
import { useArchiveProject } from '@/lib/projects/use-archive-project';
import { useUnarchiveProject } from '@/lib/projects/use-unarchive-project';
import { useRemoveProjectTeam } from '@/lib/projects/use-remove-project-team';
import { useAuth } from '@/lib/auth/use-auth';
import { useDocumentTitle } from '@/hooks/use-document-title';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: project, isLoading } = useProjectDetail(id!);
  useDocumentTitle(project ? `Clockwise - ${project.name}` : 'Clockwise - Project');
  const archiveProject = useArchiveProject();
  const unarchiveProject = useUnarchiveProject();
  const removeTeam = useRemoveProjectTeam();

  const [editOpen, setEditOpen] = useState(false);
  const [assignTeamOpen, setAssignTeamOpen] = useState(false);
  const [logTimeOpen, setLogTimeOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'archive' | 'unarchive' | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!project) {
    return <p className="py-12 text-center text-muted-foreground">Project not found.</p>;
  }

  const isAdmin = user?.isAdmin ?? false;
  const isManagerOfLinkedTeam = project.teams.some((t) =>
    user?.teams.some((ut) => ut.teamId === t.teamId && ut.role === 'manager'),
  );
  const canEdit = isAdmin || isManagerOfLinkedTeam;
  const canArchive = isAdmin;
  const canManageTeams = isAdmin || isManagerOfLinkedTeam;
  const isActive = project.status === 'active';

  const handleRemoveTeam = (teamId: string) => {
    removeTeam.mutate({ projectId: project.id, teamId });
  };

  const handleConfirm = () => {
    if (confirmAction === 'archive') {
      archiveProject.mutate(project.id, { onSuccess: () => setConfirmAction(null) });
    } else if (confirmAction === 'unarchive') {
      unarchiveProject.mutate(project.id, { onSuccess: () => setConfirmAction(null) });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.name}
        breadcrumbs={[
          { label: 'Projects', href: '/projects' },
          { label: project.name },
        ]}
        actions={
          isActive ? (
            <Button onClick={() => setLogTimeOpen(true)}>
              <Clock className="mr-1.5 h-4 w-4" />
              Log Hours
            </Button>
          ) : undefined
        }
      />

      <ProjectInfoCard
        project={project}
        onEdit={() => setEditOpen(true)}
        onArchive={() => setConfirmAction('archive')}
        onUnarchive={() => setConfirmAction('unarchive')}
        canEdit={canEdit && isActive}
        canArchive={canArchive}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Teams</h2>
        {canManageTeams && isActive && (
          <Button size="sm" onClick={() => setAssignTeamOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Assign Team
          </Button>
        )}
      </div>

      <ProjectTeamsTable
        teams={project.teams}
        onRemove={handleRemoveTeam}
        canRemove={canManageTeams && isActive}
        removePending={removeTeam.isPending}
        isLastTeam={project.teams.length <= 1}
        isAdmin={isAdmin}
      />

      <AuditTimeline entityType="project" entityId={project.id} />

      <EditProjectSheet
        project={project}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <AssignTeamSheet
        projectId={project.id}
        existingTeams={project.teams}
        open={assignTeamOpen}
        onOpenChange={setAssignTeamOpen}
      />
      <LogTimeSheet
        open={logTimeOpen}
        onOpenChange={setLogTimeOpen}
        defaultProjectId={project.id}
      />

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction === 'archive' ? 'Archive Project' : 'Unarchive Project'}
        description={
          confirmAction === 'archive'
            ? `Are you sure you want to archive ${project.name}? Time logging will be disabled for this project.`
            : `Are you sure you want to unarchive ${project.name}? Time logging will be re-enabled.`
        }
        confirmLabel={confirmAction === 'archive' ? 'Archive' : 'Unarchive'}
        variant={confirmAction === 'archive' ? 'destructive' : 'default'}
        onConfirm={handleConfirm}
        isPending={archiveProject.isPending || unarchiveProject.isPending}
      />
    </div>
  );
}
