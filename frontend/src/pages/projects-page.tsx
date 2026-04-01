import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
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

  const columns = useMemo(
    () =>
      getProjectsColumns({
        onEdit: (project) => setEditProject(project),
        onArchive: (project) => archiveProject.mutate(project.id),
        onUnarchive: (project) => unarchiveProject.mutate(project.id),
        canEdit: isAdmin || isManager,
        canArchive: isAdmin,
      }),
    [archiveProject, unarchiveProject, isAdmin, isManager],
  );

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Manage your organization's projects."
        actions={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Create Project
            </Button>
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
    </div>
  );
}
