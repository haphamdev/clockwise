import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox } from '@/components/ui/combobox';
import { FilterBar } from '@/components/ui/filter-bar';
import { TimeWindowPicker } from '@/components/ui/time-window-picker';
import { useProjects } from '@/lib/projects/use-projects';
import { useTeams } from '@/lib/teams/use-teams';
import { useUsers } from '@/lib/users/use-users';
import type { ComboboxOption } from '@/components/ui/combobox';
import type { TimeWindow } from '@/lib/dates/time-window-utils';

interface TimeLogsFilterBarProps {
  dateFrom: string;
  dateTo: string;
  projectIds: string[];
  userIds: string[];
  teamIds: string[];
  includeArchived: boolean;
  showUserFilter: boolean;
  showTeamFilter: boolean;
  onTimeWindowChange: (window: TimeWindow) => void;
  onProjectIdsChange: (value: string[]) => void;
  onUserIdsChange: (value: string[]) => void;
  onTeamIdsChange: (value: string[]) => void;
  onIncludeArchivedChange: (value: boolean) => void;
}

export function TimeLogsFilterBar({
  dateFrom,
  dateTo,
  projectIds,
  userIds,
  teamIds,
  includeArchived,
  showUserFilter,
  showTeamFilter,
  onTimeWindowChange,
  onProjectIdsChange,
  onUserIdsChange,
  onTeamIdsChange,
  onIncludeArchivedChange,
}: TimeLogsFilterBarProps) {
  const { data: projectsData } = useProjects({ limit: 100 });
  const { data: teamsData } = useTeams({ limit: 100 });
  const { data: usersData } = useUsers({ limit: 100 });

  const projectOptions: ComboboxOption[] = (projectsData?.data ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const teamOptions: ComboboxOption[] = (teamsData?.data ?? [])
    .filter((t) => !t.isArchived)
    .map((t) => ({ value: t.id, label: t.name }));

  const userOptions: ComboboxOption[] = useMemo(() => {
    const allUsers = usersData?.data ?? [];
    if (teamIds.length === 0) {
      return allUsers.map((u) => ({ value: u.id, label: u.name }));
    }
    // Filter users to members of selected teams
    return allUsers
      .filter((u) =>
        u.teamMemberships.some((tm) => teamIds.includes(tm.teamId)),
      )
      .map((u) => ({ value: u.id, label: u.name }));
  }, [usersData, teamIds]);

  const handleTeamIdsChange = (value: string[]) => {
    onTeamIdsChange(value);
    // Clear user selections that are no longer valid for the new team scope
    if (value.length > 0 && userIds.length > 0) {
      const allUsers = usersData?.data ?? [];
      const validUserIds = allUsers
        .filter((u) => u.teamMemberships.some((tm) => value.includes(tm.teamId)))
        .map((u) => u.id);
      const filtered = userIds.filter((id) => validUserIds.includes(id));
      if (filtered.length !== userIds.length) {
        onUserIdsChange(filtered);
      }
    }
  };

  return (
    <FilterBar>
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Date range</Label>
        <TimeWindowPicker
          value={{ dateFrom, dateTo }}
          onChange={onTimeWindowChange}
        />
      </div>
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
      <div className="flex items-center gap-2 self-end pb-1">
        <Checkbox
          id="includeArchived"
          checked={includeArchived}
          onCheckedChange={(checked) => onIncludeArchivedChange(checked === true)}
        />
        <Label htmlFor="includeArchived" className="text-xs cursor-pointer">
          Show archived
        </Label>
      </div>
    </FilterBar>
  );
}
