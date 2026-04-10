import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChangeBadge } from '@/components/dashboard/change-badge';
import type { MyHours } from '@/lib/dashboard/types';

interface MyHoursCardsProps {
  data: MyHours | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function MyHoursCards({ data, isLoading, isError }: MyHoursCardsProps) {
  if (isError) {
    return <p className="text-sm text-destructive">Failed to load hours data.</p>;
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-2 h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    { label: 'Today', value: data.today, unit: 'h' },
    {
      label: 'This Week',
      value: data.thisWeek,
      unit: 'h',
      change: data.weekOverWeekPct,
      prev: data.lastWeek,
    },
    {
      label: 'This Month',
      value: data.thisMonth,
      unit: 'h',
      change: data.monthOverMonthPct,
      prev: data.lastMonth,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              {'change' in card && <ChangeBadge value={card.change!} />}
            </div>
            <p className="mt-1 text-2xl font-semibold">
              {card.value}
              <span className="ml-1 text-sm font-normal text-muted-foreground">{card.unit}</span>
            </p>
            {'prev' in card && card.prev !== undefined && (
              <p className="text-xs text-muted-foreground">
                Last: {card.prev}h
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
