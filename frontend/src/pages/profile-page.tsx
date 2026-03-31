import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { ProfileInfoCard } from '@/components/profile/profile-info-card';
import { ProfileTeamsTable } from '@/components/profile/profile-teams-table';
import { AuditTimeline } from '@/components/audit-logs/audit-timeline';
import { useMyProfile } from '@/lib/users/use-my-profile';

export function ProfilePage() {
  const { data: user, isLoading, isError } = useMyProfile();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (isError) {
    return <p className="py-12 text-center text-muted-foreground">Failed to load profile.</p>;
  }

  if (!user) {
    return <p className="py-12 text-center text-muted-foreground">Unable to load profile.</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" />
      <ProfileInfoCard user={user} />

      <h2 className="text-lg font-semibold">Team Memberships</h2>
      <ProfileTeamsTable memberships={user.teamMemberships} />

      <AuditTimeline selfService />
    </div>
  );
}
