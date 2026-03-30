import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  onTeamChange: (teamId: string) => void;
  onRoleChange: (role: string) => void;
  onRemove: () => void;
}

export function TeamAssignmentRow({
  teamId,
  role,
  teams,
  onTeamChange,
  onRoleChange,
  onRemove,
}: TeamAssignmentRowProps) {
  return (
    <div className="flex items-center gap-2">
      <Select value={teamId} onValueChange={onTeamChange}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Select team" />
        </SelectTrigger>
        <SelectContent>
          {teams.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
