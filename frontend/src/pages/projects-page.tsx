import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ServerDataTable } from '@/components/ui/server-data-table';
import { getProjectsColumns } from '@/components/projects/projects-columns';
import { CreateProjectSheet } from '@/components/projects/create-project-sheet';
import { EditProjectSheet } from '@/components/projects/edit-project-sheet';
import { useProjects } from '@/lib/projects/use-projects';
import { useArchiveProject } from '@/lib/projects/use-archive-project';
import { useUnarchiveProject } from '@/lib/projects/use-unarchive-project';
import { usePaginationParams } from '@/hooks/use-pagination-params';
import { useAuth } from '@/lib/auth/use-auth';
import type { Project } from '@/lib/projects/types';

export function ProjectsPage() {
  const { user } = useAuth();
  const { page, limit, setPage } = usePaginationParams();
  const [showArchived, setShowArchived] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [confirmProject, setConfirmProject] = useState<{ project: Project; action: 'archive' | 'unarchive' } | null>(null);

  const isAdmin = user?.isAdmin ?? false;
  const isManager = user?.teams.some((t) => t.role === 'manager') ?? false;
  const canCreate = isAdmin || isManager;

  const { data, isLoading } = useProjects({
    page,
    limit,
    includeArchived: showArchived,
  });
  const archiveProject = useArchiveProject();
  const unarchiveProject = useUnarchiveProject();

  const actionPendingId = archiveProject.isPending
    ? archiveProject.variables
    : unarchiveProject.isPending
      ? unarchiveProject.variables
      : undefined;

  const columns = useMemo(
    () =>
      getProjectsColumns({
        onEdit: (project) => setEditProject(project),
        onArchive: (project) => setConfirmProject({ project, action: 'archive' }),
        onUnarchive: (project) => setConfirmProject({ project, action: 'unarchive' }),
        canEdit: isAdmin || isManager,
        canArchive: isAdmin,
        actionPendingId,
      }),
    [actionPendingId, isAdmin, isManager],
  );

  const handleConfirm = () => {
    if (!confirmProject) return;
    const { project, action } = confirmProject;
    if (action === 'archive') {
      archiveProject.mutate(project.id, { onSuccess: () => setConfirmProject(null) });
    } else {
      unarchiveProject.mutate(project.id, { onSuccess: () => setConfirmProject(null) });
    }
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Manage your organization's projects."
        actions={
          (isAdmin || canCreate) ? (
            <div className="flex gap-2">
              {isAdmin && (
                <Button variant="outline" asChild>
                  <Link to="/import?type=project">
                    <Upload className="mr-1.5 h-4 w-4" />
                    Import CSV
                  </Link>
                </Button>
              )}
              {canCreate && (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create Project
                </Button>
              )}
            </div>
          ) : undefined
        }
      />

      {isAdmin && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-archived"
            checked={showArchived}
            onCheckedChange={(v) => setShowArchived(v === true)}
          />
          <Label htmlFor="show-archived" className="text-sm">
            Show archived projects
          </Label>
        </div>
      )}

      <ServerDataTable
        columns={columns}
        data={data?.data ?? []}
        page={page}
        totalPages={totalPages}
        total={data?.total ?? 0}
        onPageChange={setPage}
        isLoading={isLoading}
      />

      <CreateProjectSheet open={createOpen} onOpenChange={setCreateOpen} />
      <EditProjectSheet
        project={editProject}
        open={!!editProject}
        onOpenChange={(open) => !open && setEditProject(null)}
      />

      <ConfirmDialog
        open={confirmProject !== null}
        onOpenChange={(open) => !open && setConfirmProject(null)}
        title={confirmProject?.action === 'archive' ? 'Archive Project' : 'Unarchive Project'}
        description={
          confirmProject?.action === 'archive'
            ? `Are you sure you want to archive ${confirmProject.project.name}? Time logging will be disabled for this project.`
            : `Are you sure you want to unarchive ${confirmProject?.project.name}? Time logging will be re-enabled.`
        }
        confirmLabel={confirmProject?.action === 'archive' ? 'Archive' : 'Unarchive'}
        variant={confirmProject?.action === 'archive' ? 'destructive' : 'default'}
        onConfirm={handleConfirm}
        isPending={archiveProject.isPending || unarchiveProject.isPending}
      />
    </div>
  );
}
