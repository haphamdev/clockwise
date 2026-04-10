import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrgOverview } from '@/lib/dashboard/use-org-overview';

interface OrgOverviewCardsProps {
  enabled: boolean;
}

export function OrgOverviewCards({ enabled }: OrgOverviewCardsProps) {
  const { data, isLoading, isError } = useOrgOverview(enabled);

  if (!enabled) return null;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Organization Overview</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Organization Overview</h2>
        <p className="text-sm text-destructive">Failed to load organization overview.</p>
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    { label: 'Users', active: data.users.active, inactive: data.users.deactivated, inactiveLabel: 'deactivated' },
    { label: 'Teams', active: data.teams.active, inactive: data.teams.archived, inactiveLabel: 'archived' },
    { label: 'Projects', active: data.projects.active, inactive: data.projects.archived, inactiveLabel: 'archived' },
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Organization Overview</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-2xl font-semibold">{card.active}</p>
              <p className="text-xs text-muted-foreground">
                {card.inactive} {card.inactiveLabel}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
