import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTaskSearch } from '@/lib/tasks/use-task-search';

interface TaskAutocompleteProps {
  projectId: string;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function TaskAutocomplete({
  projectId,
  value,
  onChange,
  disabled,
}: TaskAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    setInputValue('');
    setShowSuggestions(false);
  }, [projectId]);

  const { data } = useTaskSearch(projectId, inputValue);

  const suggestions = useMemo(() => {
    if (!data?.data) return [];
    return data.data
      .map((t) => t.label)
      .filter((label) => !value.includes(label));
  }, [data, value]);

  const addLabel = useCallback(
    (label: string) => {
      const trimmed = label.trim();
      if (!trimmed || value.includes(trimmed)) return;
      onChange([...value, trimmed]);
      setInputValue('');
      setShowSuggestions(false);
    },
    [value, onChange],
  );

  const removeLabel = useCallback(
    (label: string) => {
      onChange(value.filter((v) => v !== label));
    },
    [value, onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addLabel(inputValue);
    }
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeLabel(value[value.length - 1]);
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1 rounded-md border border-input bg-background p-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
        {value.map((label) => (
          <Badge key={label} variant="outline" className="text-xs">
            {label}
            <button
              type="button"
              onClick={() => removeLabel(label)}
              className="ml-1 rounded-full outline-none"
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            // Delay to allow click on suggestion to fire first
            setTimeout(() => {
              if (!mountedRef.current) return;
              addLabel(inputValue);
              setShowSuggestions(false);
            }, 200);
          }}
          placeholder={value.length === 0 ? 'Type a task label and press Enter...' : 'Add another...'}
          className="h-7 min-w-[150px] flex-1 border-0 p-0 shadow-none focus-visible:ring-0"
          disabled={disabled || !projectId}
        />
      </div>

      {showSuggestions && suggestions.length > 0 && inputValue && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
          {suggestions.map((label) => (
            <button
              key={label}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addLabel(label);
              }}
              className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
