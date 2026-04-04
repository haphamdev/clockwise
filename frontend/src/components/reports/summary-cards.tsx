import { Card, CardContent } from '@/components/ui/card';

interface SummaryCard {
  label: string;
  value: string | number;
  unit?: string;
}

interface SummaryCardsProps {
  cards: SummaryCard[];
}

export function SummaryCards({ cards }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold">
              {card.value}
              {card.unit && (
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  {card.unit}
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
