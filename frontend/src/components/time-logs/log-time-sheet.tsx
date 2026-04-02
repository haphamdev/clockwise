import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { TaskAutocomplete } from './task-autocomplete';
import { WarningAlert } from './warning-alert';
import { useCreateTimeLog } from '@/lib/time-logs/use-create-time-log';
import { useProjects } from '@/lib/projects/use-projects';
import type { ComboboxOption } from '@/components/ui/combobox';
import type { Warning } from '@/lib/time-logs/types';
import { useState } from 'react';

const today = () => new Date().toISOString().slice(0, 10);

const schema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  taskLabels: z.array(z.string().min(1)).min(1, 'At least one task is required'),
  date: z.string().min(1, 'Date is required'),
  hours: z.number().min(0.01, 'Minimum 0.01').max(24, 'Maximum 24'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface LogTimeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
}

export function LogTimeSheet({ open, onOpenChange, defaultProjectId }: LogTimeSheetProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      projectId: defaultProjectId ?? '',
      taskLabels: [],
      date: today(),
      hours: 0,
      notes: '',
    },
  });
  const createTimeLog = useCreateTimeLog();
  const { data: projectsData } = useProjects({ limit: 100 });
  const [warnings, setWarnings] = useState<Warning[]>([]);

  const projectOptions: ComboboxOption[] = (projectsData?.data ?? [])
    .filter((p) => p.status === 'active')
    .map((p) => ({ value: p.id, label: p.name }));

  useEffect(() => {
    if (open) {
      form.reset({
        projectId: defaultProjectId ?? '',
        taskLabels: [],
        date: today(),
        hours: 0,
        notes: '',
      });
      setWarnings([]);
    }
  }, [open, defaultProjectId, form]);

  const projectId = form.watch('projectId');

  // Clear task labels when project changes
  useEffect(() => {
    form.setValue('taskLabels', []);
  }, [projectId, form]);

  const onSubmit = (values: FormValues) => {
    createTimeLog.mutate(values, {
      onSuccess: (data) => {
        setWarnings(data.warnings);
        if (data.warnings.length === 0) {
          onOpenChange(false);
        } else {
          // Keep sheet open to show warnings, reset form for "log another"
          form.reset({
            projectId: values.projectId,
            taskLabels: [],
            date: values.date,
            hours: 0,
            notes: '',
          });
        }
      },
    });
  };

  const handleLogAnother = () => {
    setWarnings([]);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Log Time</SheetTitle>
          <SheetDescription>Record hours worked on a project.</SheetDescription>
        </SheetHeader>

        {warnings.length > 0 && (
          <div className="mt-4">
            <WarningAlert warnings={warnings} />
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleLogAnother}
            >
              Log Another
            </Button>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" max={today()} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Controller
              control={form.control}
              name="projectId"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Combobox
                    options={projectOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select project..."
                    searchPlaceholder="Search projects..."
                    emptyText="No projects available."
                  />
                  {fieldState.error && (
                    <p className="text-[0.8rem] font-medium text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                </FormItem>
              )}
            />
            <Controller
              control={form.control}
              name="taskLabels"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Tasks</FormLabel>
                  <TaskAutocomplete
                    projectId={projectId}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={!projectId}
                  />
                  {fieldState.error && (
                    <p className="text-[0.8rem] font-medium text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hours</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.25"
                      min="0.01"
                      max="24"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional notes"
                      maxLength={2000}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={createTimeLog.isPending} className="w-full">
              {createTimeLog.isPending ? 'Logging...' : 'Log Time'}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
