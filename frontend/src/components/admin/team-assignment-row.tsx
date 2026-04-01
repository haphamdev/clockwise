import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Team } from '@/lib/teams/types';

interface TeamAssignmentRowProps {
  teamId: string;
  role: string;
  teams: Team[];
  excludeTeamIds?: string[];
  onTeamChange: (teamId: string) => void;
  onRoleChange: (role: string) => void;
  onRemove: () => void;
}

export function TeamAssignmentRow({
  teamId,
  role,
  teams,
  excludeTeamIds,
  onTeamChange,
  onRoleChange,
  onRemove,
}: TeamAssignmentRowProps) {
  const teamOptions = teams
    .filter((t) => t.id === teamId || !excludeTeamIds?.includes(t.id))
    .map((t) => ({ value: t.id, label: t.name }));

  return (
    <div className="flex items-center gap-2">
      <Combobox
        options={teamOptions}
        value={teamId}
        onChange={onTeamChange}
        placeholder="Select team"
        searchPlaceholder="Search teams..."
        emptyText="No teams found."
        className="flex-1"
      />
      <Select value={role} onValueChange={onRoleChange}>
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="manager">Manager</SelectItem>
          <SelectItem value="member">Member</SelectItem>
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-9 w-9 p-0 text-destructive hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
