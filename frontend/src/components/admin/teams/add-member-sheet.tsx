import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useUsers } from '@/lib/users/use-users';
import { useAddTeamMember } from '@/lib/teams/use-add-team-member';
import type { TeamMember, TeamRole } from '@/lib/teams/types';

interface AddMemberSheetProps {
  teamId: string;
  existingMembers: TeamMember[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMemberSheet({
  teamId,
  existingMembers,
  open,
  onOpenChange,
}: AddMemberSheetProps) {
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [role, setRole] = useState<TeamRole>('member');

  const { data: usersData } = useUsers({ search, limit: 20 });
  const addMember = useAddTeamMember();

  const existingIds = new Set(existingMembers.map((m) => m.userId));
  const availableUsers = usersData?.data.filter((u) => !existingIds.has(u.id)) ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    addMember.mutate(
      { teamId, payload: { userId: selectedUserId, role } },
      {
        onSuccess: () => {
          setSelectedUserId('');
          setRole('member');
          setSearch('');
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Member</SheetTitle>
          <SheetDescription>Search for a user and assign a role.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>Search Users</Label>
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {availableUsers.length > 0 && (
            <div className="space-y-2">
              <Label>Select User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as TeamRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            disabled={!selectedUserId || addMember.isPending}
            className="w-full"
          >
            {addMember.isPending ? 'Adding...' : 'Add Member'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
