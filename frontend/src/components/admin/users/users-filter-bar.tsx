import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { FilterBar } from '@/components/ui/filter-bar';
import { useTeams } from '@/lib/teams/use-teams';

interface UsersFilterBarProps {
  search: string;
  status: string;
  teamId: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTeamChange: (value: string) => void;
}

export function UsersFilterBar({
  search,
  status,
  teamId,
  onSearchChange,
  onStatusChange,
  onTeamChange,
}: UsersFilterBarProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const { data: teamsData } = useTeams({ limit: 100 });

  useEffect(() => {
    const timer = setTimeout(() => onSearchChange(localSearch), 300);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const teamOptions = [
    { value: 'all', label: 'All teams' },
    ...(teamsData?.data.map((t) => ({ value: t.id, label: t.name })) ?? []),
  ];

  return (
    <FilterBar>
      <div className="space-y-1.5">
        <Label className="text-xs">Search</Label>
        <Input
          placeholder="Name or email..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-[220px]"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Status</Label>
        <Select value={status || 'all'} onValueChange={(v) => onStatusChange(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="deactivated">Deactivated</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Team</Label>
        <Combobox
          options={teamOptions}
          value={teamId || 'all'}
          onChange={(v) => onTeamChange(v === 'all' ? '' : v)}
          placeholder="All teams"
          searchPlaceholder="Search teams..."
          emptyText="No teams found."
          className="w-[180px]"
        />
      </div>
    </FilterBar>
  );
}
