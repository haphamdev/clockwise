import { Badge } from '@/components/ui/badge';

interface ImportCellValueProps {
  value: string | undefined;
  isList?: boolean;
}

export function ImportCellValue({ value, isList }: ImportCellValueProps) {
  if (!value) return <>-</>;

  if (isList) {
    const items = value.split(',').map((s) => s.trim()).filter(Boolean);
    if (items.length === 0) return <>-</>;
    return (
      <div className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <Badge key={i} variant="secondary" className="text-xs">
            {item}
          </Badge>
        ))}
      </div>
    );
  }

  return <>{value}</>;
}
