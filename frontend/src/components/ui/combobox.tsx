import { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

export interface ComboboxOption {
  value: string;
  label: string;
  group?: string;
}

interface ComboboxBaseProps {
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
}

interface SingleComboboxProps extends ComboboxBaseProps {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
}

interface MultiComboboxProps extends ComboboxBaseProps {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
}

type ComboboxProps = SingleComboboxProps | MultiComboboxProps;

function groupOptions(options: ComboboxOption[]) {
  const groups: { name: string | undefined; items: ComboboxOption[] }[] = [];
  const seen = new Map<string | undefined, number>();

  for (const option of options) {
    const key = option.group;
    const idx = seen.get(key);
    if (idx !== undefined) {
      groups[idx].items.push(option);
    } else {
      seen.set(key, groups.length);
      groups.push({ name: key, items: [option] });
    }
  }

  return groups;
}

export function Combobox(props: ComboboxProps) {
  const {
    options,
    placeholder = 'Select...',
    searchPlaceholder = 'Search...',
    emptyText = 'No results found.',
    disabled,
    className,
  } = props;

  const [open, setOpen] = useState(false);

  const isSelected = (optionValue: string) => {
    if (props.multiple) return props.value.includes(optionValue);
    return props.value === optionValue;
  };

  const handleSelect = (optionValue: string) => {
    if (props.multiple) {
      const next = props.value.includes(optionValue)
        ? props.value.filter((v) => v !== optionValue)
        : [...props.value, optionValue];
      props.onChange(next);
    } else {
      props.onChange(optionValue === props.value ? '' : optionValue);
      setOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (props.multiple) {
      props.onChange([]);
    } else {
      props.onChange('');
    }
  };

  const hasValue = props.multiple ? props.value.length > 0 : !!props.value;

  const renderTriggerContent = () => {
    if (props.multiple) {
      if (props.value.length === 0) {
        return <span className="text-muted-foreground">{placeholder}</span>;
      }
      if (props.value.length === 1) {
        const opt = options.find((o) => o.value === props.value[0]);
        return <span className="truncate">{opt?.label ?? props.value[0]}</span>;
      }
      return <span className="truncate">{props.value.length} selected</span>;
    }

    const selected = options.find((o) => o.value === props.value);
    if (!selected) {
      return <span className="text-muted-foreground">{placeholder}</span>;
    }
    return <span className="truncate">{selected.label}</span>;
  };

  const groups = groupOptions(options);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'h-10 w-full justify-between font-normal',
            className,
          )}
        >
          {renderTriggerContent()}
          <div className="ml-2 flex shrink-0 items-center">
            {hasValue && (
              <span
                role="button"
                tabIndex={0}
                className="rounded-sm opacity-50 hover:opacity-100"
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleClear(e as unknown as React.MouseEvent);
                  }
                }}
              >
                <X className="h-4 w-4" />
              </span>
            )}
            <ChevronsUpDown className="ml-1 h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {groups.map((group, i) => (
              <CommandGroup
                key={group.name ?? `__default_${i}`}
                heading={group.name}
              >
                {group.items.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        isSelected(option.value)
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
