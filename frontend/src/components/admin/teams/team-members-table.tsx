import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2 } from 'lucide-react';
import type { TeamMember, TeamRole } from '@/lib/teams/types';

interface TeamMembersTableProps {
  members: TeamMember[];
  onChangeRole: (userId: string, role: TeamRole) => void;
  onRemove: (userId: string) => void;
}

export function TeamMembersTable({ members, onChangeRole, onRemove }: TeamMembersTableProps) {
  if (members.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No members yet.</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="w-[80px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.userId}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {member.userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{member.userName}</p>
                    <p className="text-xs text-muted-foreground">{member.userEmail}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Select
                  value={member.role}
                  onValueChange={(value) => onChangeRole(member.userId, value as TeamRole)}
                >
                  <SelectTrigger className="h-8 w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">
                      <Badge variant="outline" className="border-0">Manager</Badge>
                    </SelectItem>
                    <SelectItem value="member">
                      <Badge variant="outline" className="border-0">Member</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => onRemove(member.userId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
