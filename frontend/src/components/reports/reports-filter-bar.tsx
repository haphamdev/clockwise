import { useCallback, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { FilterBar } from '@/components/ui/filter-bar';
import { TimeWindowPicker } from '@/components/ui/time-window-picker';
import { useProjects } from '@/lib/projects/use-projects';
import { useTeams } from '@/lib/teams/use-teams';
import { useUsers } from '@/lib/users/use-users';
import type { ComboboxOption } from '@/components/ui/combobox';
import type { TimeWindow } from '@/lib/dates/time-window-utils';

interface ReportsFilterBarProps {
  dateFrom: string;
  dateTo: string;
  projectIds: string[];
  userIds: string[];
  teamIds: string[];
  showUserFilter: boolean;
  showTeamFilter: boolean;
  onTimeWindowChange: (window: TimeWindow) => void;
  onProjectIdsChange: (value: string[]) => void;
  onUserIdsChange: (value: string[]) => void;
  onTeamIdsChange: (value: string[]) => void;
}

export function ReportsFilterBar({
  dateFrom,
  dateTo,
  projectIds,
  userIds,
  teamIds,
  showUserFilter,
  showTeamFilter,
  onTimeWindowChange,
  onProjectIdsChange,
  onUserIdsChange,
  onTeamIdsChange,
}: ReportsFilterBarProps) {
  const { data: projectsData } = useProjects({ limit: 100 });
  const { data: teamsData } = useTeams({ limit: 100 });
  const { data: usersData } = useUsers({ limit: 100 });

  const projectOptions: ComboboxOption[] = useMemo(() => {
    const allProjects = projectsData?.data ?? [];
    if (teamIds.length === 0) {
      return allProjects.map((p) => ({ value: p.id, label: p.name }));
    }
    return allProjects
      .filter((p) => (p.teamIds ?? []).some((tid) => teamIds.includes(tid)))
      .map((p) => ({ value: p.id, label: p.name }));
  }, [projectsData, teamIds]);

  const teamOptions: ComboboxOption[] = useMemo(
    () =>
      (teamsData?.data ?? [])
        .filter((t) => !t.isArchived)
        .map((t) => ({ value: t.id, label: t.name })),
    [teamsData],
  );

  const userOptions: ComboboxOption[] = useMemo(() => {
    const allUsers = usersData?.data ?? [];
    if (teamIds.length === 0) {
      return allUsers.map((u) => ({ value: u.id, label: u.name }));
    }
    return allUsers
      .filter((u) =>
        u.teamMemberships.some((tm) => teamIds.includes(tm.teamId)),
      )
      .map((u) => ({ value: u.id, label: u.name }));
  }, [usersData, teamIds]);

  const handleTeamIdsChange = useCallback(
    (value: string[]) => {
      onTeamIdsChange(value);
      if (value.length > 0) {
        // Prune user selections no longer valid for the new team scope
        if (userIds.length > 0) {
          const allUsers = usersData?.data ?? [];
          const validUserIds = allUsers
            .filter((u) => u.teamMemberships.some((tm) => value.includes(tm.teamId)))
            .map((u) => u.id);
          const filtered = userIds.filter((id) => validUserIds.includes(id));
          if (filtered.length !== userIds.length) {
            onUserIdsChange(filtered);
          }
        }
        // Prune project selections no longer valid for the new team scope
        if (projectIds.length > 0) {
          const allProjects = projectsData?.data ?? [];
          const validProjectIds = allProjects
            .filter((p) => (p.teamIds ?? []).some((tid) => value.includes(tid)))
            .map((p) => p.id);
          const filtered = projectIds.filter((id) => validProjectIds.includes(id));
          if (filtered.length !== projectIds.length) {
            onProjectIdsChange(filtered);
          }
        }
      }
    },
    [onTeamIdsChange, userIds, usersData, onUserIdsChange, projectIds, projectsData, onProjectIdsChange],
  );

  return (
    <FilterBar>
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Date range</Label>
        <TimeWindowPicker
          value={{ dateFrom, dateTo }}
          onChange={onTimeWindowChange}
        />
      </div>
      {showTeamFilter && (
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Teams</Label>
          <Combobox
            multiple
            options={teamOptions}
            value={teamIds}
            onChange={handleTeamIdsChange}
            placeholder="All teams"
            searchPlaceholder="Search teams..."
            emptyText="No teams available."
            className="w-[220px]"
          />
        </div>
      )}
      {showUserFilter && (
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Users</Label>
          <Combobox
            multiple
            options={userOptions}
            value={userIds}
            onChange={onUserIdsChange}
            placeholder="All users"
            searchPlaceholder="Search users..."
            emptyText="No users available."
            className="w-[220px]"
          />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Projects</Label>
        <Combobox
          multiple
          options={projectOptions}
          value={projectIds}
          onChange={onProjectIdsChange}
          placeholder="All projects"
          searchPlaceholder="Search projects..."
          emptyText="No projects available."
          className="w-[220px]"
        />
      </div>
    </FilterBar>
  );
}
