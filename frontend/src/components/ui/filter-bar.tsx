import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  children: React.ReactNode;
  collapsible?: boolean;
  className?: string;
}

export function FilterBar({
  children,
  collapsible = false,
  className,
}: FilterBarProps) {
  const [open, setOpen] = useState(true);

  if (!collapsible) {
    return (
      <div className={cn('flex flex-wrap items-end gap-4', className)}>
        {children}
      </div>
    );
  }

  return (
    <div className={className}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="mb-3"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
      </Button>
      {open && (
        <div className="flex flex-wrap items-end gap-4">{children}</div>
      )}
    </div>
  );
}
