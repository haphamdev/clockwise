import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { type Status, StatusBadge } from "@/components/ui/status-badge";
import { TimeDisplay } from "@/components/ui/time-display";
import { useUserDetail } from "@/lib/users/use-user-detail";

interface UserDetailSheetProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailSheet({
  userId,
  open,
  onOpenChange,
}: UserDetailSheetProps) {
  const navigate = useNavigate();
  const { data: user, isLoading } = useUserDetail(userId);
  const handleViewDetails = () => {
    if (!user) return;
    onOpenChange(false);
    navigate(`/admin/users/${user.id}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>User Details</SheetTitle>
          <SheetDescription>Quick view of user information.</SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-8 w-full" />
            </div>
          ) : user ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={user.avatarUrl ?? undefined}
                    alt={user.name}
                  />
                  <AvatarFallback>
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="ml-auto">
                  <StatusBadge status={user.status as Status} />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {user.isAdmin && <Badge variant="outline">Admin</Badge>}
              </div>

              <dl className="flex flex-col gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">
                    Teams (
                    {user.teamMemberships.filter((t) => !t.isArchived).length}
                    {user.teamMemberships.some((t) => t.isArchived) &&
                      `, ${user.teamMemberships.filter((t) => t.isArchived).length} archived`}
                    )
                  </dt>
                  <dd>
                    {user.teamMemberships.length === 0 ? (
                      <span className="font-medium">None</span>
                    ) : (
                      <ul className="mt-1 space-y-1">
                        {user.teamMemberships.map((t) => (
                          <li
                            key={t.teamId}
                            className="flex items-center gap-2"
                          >
                            <span
                              className={
                                t.isArchived
                                  ? "text-muted-foreground line-through"
                                  : "font-medium"
                              }
                            >
                              {t.teamName}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {t.role}
                            </Badge>
                            {t.isArchived && (
                              <Badge variant="outline" className="text-xs">
                                archived
                              </Badge>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Last Login</dt>
                  <dd className="font-medium">
                    <TimeDisplay value={user.lastLoginAt} fallback="Never" />
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="font-medium">
                    <TimeDisplay value={user.createdAt} />
                  </dd>
                </div>
              </dl>

              <Button className="w-full" onClick={handleViewDetails}>
                View Details
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">User not found.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
