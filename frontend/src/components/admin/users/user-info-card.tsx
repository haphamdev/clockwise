import { Save, Undo2, UserX, UserCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { StatusBadge, type Status } from '@/components/ui/status-badge';
import type { User } from '@/lib/users/types';

interface UserInfoCardProps {
  user: User;
  isAdmin: boolean;
  onIsAdminChange: (checked: boolean) => void;
  onSave: () => void;
  onRestore: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  isSaving: boolean;
  isDirty: boolean;
}

export function UserInfoCard({
  user,
  isAdmin,
  onIsAdminChange,
  onSave,
  onRestore,
  onDeactivate,
  onReactivate,
  isSaving,
  isDirty,
}: UserInfoCardProps) {
  const isDeactivated = user.status === 'deactivated';
  const archivedCount = user.teamMemberships.filter((t) => t.isArchived).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {user.name}
              <StatusBadge status={user.status as Status} />
              {isAdmin && <Badge variant="outline">Admin</Badge>}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isDirty && (
            <Button variant="outline" size="sm" onClick={onRestore}>
              <Undo2 className="mr-1.5 h-3.5 w-3.5" />
              Restore Original
            </Button>
          )}
          <Button size="sm" onClick={onSave} disabled={!isDirty || isSaving}>
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          {isDeactivated ? (
            <Button variant="outline" size="sm" onClick={onReactivate}>
              <UserCheck className="mr-1.5 h-3.5 w-3.5" />
              Reactivate
            </Button>
          ) : user.status === 'active' ? (
            <Button variant="destructive" size="sm" onClick={onDeactivate}>
              <UserX className="mr-1.5 h-3.5 w-3.5" />
              Deactivate
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Teams</dt>
            <dd className="font-medium">
              {user.teamMemberships.length}
              {archivedCount > 0 && (
                <span className="ml-1 text-muted-foreground font-normal">
                  ({archivedCount} archived)
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Last Login</dt>
            <dd className="font-medium">
              {user.lastLoginAt
                ? new Date(user.lastLoginAt).toLocaleDateString()
                : 'Never'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Created</dt>
            <dd className="font-medium">
              {new Date(user.createdAt).toLocaleDateString()}
            </dd>
          </div>
        </dl>
        <div className="mt-4 flex items-center gap-2">
          <Checkbox
            id="isAdmin"
            checked={isAdmin}
            onCheckedChange={(checked) => onIsAdminChange(!!checked)}
          />
          <Label htmlFor="isAdmin" className="text-sm font-normal">
            Organization Admin
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}
