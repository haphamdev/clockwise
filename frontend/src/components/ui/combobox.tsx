import { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
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

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (props.multiple) {
      props.onChange(props.value.filter((v) => v !== optionValue));
    }
  };

  const renderTriggerContent = () => {
    if (props.multiple) {
      if (props.value.length === 0) {
        return <span className="text-muted-foreground">{placeholder}</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {props.value.map((v) => {
            const opt = options.find((o) => o.value === v);
            return (
              <Badge key={v} variant="secondary" className="text-xs">
                {opt?.label ?? v}
                <button
                  type="button"
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onClick={(e) => handleRemove(v, e)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      );
    }

    const selected = options.find((o) => o.value === props.value);
    if (!selected) {
      return <span className="text-muted-foreground">{placeholder}</span>;
    }
    return <span className="truncate">{selected.label}</span>;
  };

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
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      isSelected(option.value) ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
