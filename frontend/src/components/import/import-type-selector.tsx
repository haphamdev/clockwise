import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IMPORT_TYPE_OPTIONS } from '@/lib/import/import-type-config';
import type { ImportType } from '@/lib/import/types';

interface ImportTypeSelectorProps {
  value: ImportType;
  onChange: (type: ImportType) => void;
}

export function ImportTypeSelector({ value, onChange }: ImportTypeSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium">Import type</label>
      <Select value={value} onValueChange={(v) => onChange(v as ImportType)}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {IMPORT_TYPE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
