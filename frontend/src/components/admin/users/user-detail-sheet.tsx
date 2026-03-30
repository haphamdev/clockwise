import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { UserDetailForm } from '@/components/admin/users/user-detail-form';
import { useUserDetail } from '@/lib/users/use-user-detail';

interface UserDetailSheetProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailSheet({ userId, open, onOpenChange }: UserDetailSheetProps) {
  const { data: user, isLoading } = useUserDetail(userId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>User Details</SheetTitle>
          <SheetDescription>View and edit user information.</SheetDescription>
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
              <Skeleton className="h-24 w-full" />
            </div>
          ) : user ? (
            <UserDetailForm user={user} onClose={() => onOpenChange(false)} />
          ) : (
            <p className="text-sm text-muted-foreground">User not found.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
