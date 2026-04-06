import { useMemo, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { useProjects } from '@/lib/projects/use-projects';
import { useTeams } from '@/lib/teams/use-teams';
import { useUsers } from '@/lib/users/use-users';
import type { ComboboxOption } from '@/components/ui/combobox';

interface ProjectInsightFiltersProps {
  projectId: string;
  teamIds: string[];
  userIds: string[];
  onProjectChange: (projectId: string) => void;
  onTeamIdsChange: (ids: string[]) => void;
  onUserIdsChange: (ids: string[]) => void;
}

export function ProjectInsightFilters({
  projectId,
  teamIds,
  userIds,
  onProjectChange,
  onTeamIdsChange,
  onUserIdsChange,
}: ProjectInsightFiltersProps) {
  // Project options (non-archived, sorted alphabetically)
  const { data: projectsData } = useProjects({ limit: 100 });
  const availableProjects = useMemo(
    () =>
      (projectsData?.data ?? [])
        .filter((p) => p.status !== 'archived')
        .sort((a, b) => a.name.localeCompare(b.name)),
    [projectsData],
  );

  const projectOptions: ComboboxOption[] = useMemo(
    () => availableProjects.map((p) => ({ value: p.id, label: p.name })),
    [availableProjects],
  );

  // Auto-select first project alphabetically when no param is set
  useEffect(() => {
    if (!projectId && availableProjects.length > 0) {
      onProjectChange(availableProjects[0].id);
    }
  }, [projectId, availableProjects, onProjectChange]);

  const selectedProject = useMemo(
    () => availableProjects.find((p) => p.id === projectId),
    [availableProjects, projectId],
  );

  // Team options — filter all teams to only those in the selected project's teamIds
  const { data: teamsData } = useTeams({ limit: 100 });
  const teamOptions: ComboboxOption[] = useMemo(() => {
    if (!selectedProject) return [];
    const projectTeamIds = new Set(selectedProject.teamIds);
    return (teamsData?.data ?? [])
      .filter((t) => !t.isArchived && projectTeamIds.has(t.id))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((t) => ({ value: t.id, label: t.name }));
  }, [teamsData, selectedProject]);

  // User options scoped to selected project
  const { data: usersData } = useUsers(
    { limit: 100, projectId: projectId || undefined },
    { enabled: !!projectId },
  );
  const userOptions: ComboboxOption[] = useMemo(
    () => (usersData?.data ?? []).map((u) => ({ value: u.id, label: u.name })),
    [usersData],
  );

  return (
    <div className="flex items-start justify-between gap-4 my-4">
      <div className="w-full flex justify-end items-end gap-3">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Project</Label>
          <Combobox
            options={projectOptions}
            value={projectId}
            onChange={onProjectChange}
            placeholder="Select project"
            searchPlaceholder="Search projects..."
            emptyText="No projects available."
            className="w-[200px]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Teams</Label>
          <Combobox
            multiple
            options={teamOptions}
            value={teamIds}
            onChange={onTeamIdsChange}
            placeholder="All teams"
            searchPlaceholder="Search teams..."
            emptyText="No teams available."
            className="w-[200px]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Members</Label>
          <Combobox
            multiple
            options={userOptions}
            value={userIds}
            onChange={onUserIdsChange}
            placeholder="All members"
            searchPlaceholder="Search members..."
            emptyText="No members available."
            className="w-[200px]"
          />
        </div>
      </div>
    </div>
  );
}
