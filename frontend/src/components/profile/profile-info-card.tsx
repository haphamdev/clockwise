import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge, type Status } from '@/components/ui/status-badge';
import { useFormatDate } from '@/lib/org/use-format-date';
import type { User } from '@/lib/users/types';

interface ProfileInfoCardProps {
  user: User;
}

export function ProfileInfoCard({ user }: ProfileInfoCardProps) {
  const { formatDate } = useFormatDate();
  const archivedCount = user.teamMemberships.filter((t) => t.isArchived).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {user.name}
              <StatusBadge status={user.status as Status} />
              {user.isAdmin && <Badge variant="outline">Admin</Badge>}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
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
              {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Member Since</dt>
            <dd className="font-medium">{formatDate(user.createdAt)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
