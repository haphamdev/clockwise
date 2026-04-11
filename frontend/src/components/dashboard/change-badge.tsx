export function ChangeBadge({ value }: { value: number | null }) {
  if (value === null)
    return <span className="text-xs text-muted-foreground">--</span>;
  if (value === 0)
    return <span className="text-xs text-muted-foreground">0%</span>;
  const isPositive = value > 0;
  return (
    <span
      className={`text-xs font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}
    >
      {isPositive ? "+" : ""}
      {value}%
    </span>
  );
}
