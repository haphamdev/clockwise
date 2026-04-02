import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FilterBar } from '@/components/ui/filter-bar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProjects } from '@/lib/projects/use-projects';
import { useTeams } from '@/lib/teams/use-teams';
import { useUsers } from '@/lib/users/use-users';

interface TimeLogsFilterBarProps {
  dateFrom: string;
  dateTo: string;
  projectId: string;
  userId: string;
  teamId: string;
  includeArchived: boolean;
  showUserFilter: boolean;
  showTeamFilter: boolean;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onProjectIdChange: (value: string) => void;
  onUserIdChange: (value: string) => void;
  onTeamIdChange: (value: string) => void;
  onIncludeArchivedChange: (value: boolean) => void;
}

export function TimeLogsFilterBar({
  dateFrom,
  dateTo,
  projectId,
  userId,
  teamId,
  includeArchived,
  showUserFilter,
  showTeamFilter,
  onDateFromChange,
  onDateToChange,
  onProjectIdChange,
  onUserIdChange,
  onTeamIdChange,
  onIncludeArchivedChange,
}: TimeLogsFilterBarProps) {
  const { data: projectsData } = useProjects({ limit: 100 });
  const { data: teamsData } = useTeams({ limit: 100 });
  const { data: usersData } = useUsers({ limit: 100 });

  return (
    <FilterBar>
      <div className="space-y-1">
        <Label className="text-xs">From</Label>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="w-[150px]"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">To</Label>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="w-[150px]"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Project</Label>
        <Select value={projectId} onValueChange={onProjectIdChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {(projectsData?.data ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {showUserFilter && (
        <div className="space-y-1">
          <Label className="text-xs">User</Label>
          <Select value={userId} onValueChange={onUserIdChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              {(usersData?.data ?? []).map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {showTeamFilter && (
        <div className="space-y-1">
          <Label className="text-xs">Team</Label>
          <Select value={teamId} onValueChange={onTeamIdChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All teams</SelectItem>
              {(teamsData?.data ?? [])
                .filter((t) => !t.isArchived)
                .map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
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
