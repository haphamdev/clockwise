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
import { Label } from '@/components/ui/label';
import { TaskAutocomplete } from './task-autocomplete';
import { WarningAlert } from './warning-alert';
import { useCreateTimeLog } from '@/lib/time-logs/use-create-time-log';
import { useWarningsPreview } from '@/lib/time-logs/use-warnings-preview';
import { useProjects } from '@/lib/projects/use-projects';
import type { ComboboxOption } from '@/components/ui/combobox';
import type { Warning } from '@/lib/time-logs/types';
import { useState } from 'react';

const today = () => new Date().toISOString().slice(0, 10);

const schema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  taskLabels: z.array(z.string().min(1)).min(1, 'At least one task is required'),
  date: z.string().min(1, 'Date is required'),
  hours: z.string().min(1, 'Hours is required')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Hours must be greater than 0')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) <= 24, 'Maximum 24')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) % 0.25 === 0, 'Must be in 0.25 increments'),
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
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    defaultValues: {
      projectId: defaultProjectId ?? '',
      taskLabels: [],
      date: today(),
      hours: '',
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
        hours: '',
        notes: '',
      });
      setWarnings([]);
    }
  }, [open, defaultProjectId, form]);

  const projectId = form.watch('projectId');
  const taskLabels = form.watch('taskLabels');
  const date = form.watch('date');
  const hoursStr = form.watch('hours');
  const hoursNum = hoursStr ? parseFloat(hoursStr) || 0 : 0;

  const { data: previewWarnings } = useWarningsPreview({
    date,
    projectId: projectId || undefined,
    hours: hoursNum,
  });

  // Clear task labels when project changes
  useEffect(() => {
    form.setValue('taskLabels', []);
  }, [projectId, form]);

  const onSubmit = (values: FormValues) => {
    createTimeLog.mutate({ ...values, hours: parseFloat(values.hours) }, {
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
            hours: '',
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
                <div className="space-y-2">
                  <Label>Project</Label>
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
                </div>
              )}
            />
            <Controller
              control={form.control}
              name="taskLabels"
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Tasks</Label>
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
                </div>
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
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      {...field}
                      onChange={(e) => {
                        const v = e.target.value.replace(',', '.');
                        if (v === '' || /^\d*\.?\d*$/.test(v)) {
                          field.onChange(v);
                        }
                      }}
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
            {previewWarnings && previewWarnings.length > 0 && (
              <WarningAlert warnings={previewWarnings} />
            )}
            <Button type="submit" disabled={createTimeLog.isPending || !projectId || taskLabels.length === 0} className="w-full">
              {createTimeLog.isPending ? 'Logging...' : 'Log Time'}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
