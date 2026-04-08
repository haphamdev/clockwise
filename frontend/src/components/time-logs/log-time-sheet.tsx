import { useEffect, useRef } from 'react';
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
import { useLoggableUsers } from '@/lib/time-logs/use-loggable-users';
import { useProjects } from '@/lib/projects/use-projects';
import { useUserProjects } from '@/lib/projects/use-user-projects';
import { useAuth } from '@/lib/auth/use-auth';
import type { ComboboxOption } from '@/components/ui/combobox';

const today = () => new Date().toISOString().slice(0, 10);

const schema = z.object({
  userId: z.string().optional(),
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

function isAdminOrManager(user: { isAdmin: boolean; teams: Array<{ role: string }> }): boolean {
  return user.isAdmin || user.teams.some((t) => t.role === 'manager');
}

interface LogTimeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
}

export function LogTimeSheet({ open, onOpenChange, defaultProjectId }: LogTimeSheetProps) {
  const { user: currentUser } = useAuth();
  const showUserSelector = currentUser ? isAdminOrManager(currentUser) : false;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    defaultValues: {
      userId: currentUser?.id ?? '',
      projectId: defaultProjectId ?? '',
      taskLabels: [],
      date: today(),
      hours: '',
      notes: '',
    },
  });
  const createTimeLog = useCreateTimeLog();

  const { data: loggableUsers } = useLoggableUsers({ enabled: showUserSelector });

  const selectedUserId = form.watch('userId');
  const isLoggingForSelf = !selectedUserId || selectedUserId === currentUser?.id;
  const prevUserIdRef = useRef(selectedUserId);

  const { data: ownProjectsData } = useProjects(
    { limit: 100 },
    { enabled: isLoggingForSelf },
  );
  const { data: otherProjectsData } = useUserProjects(
    isLoggingForSelf ? undefined : selectedUserId,
    { limit: 100 },
  );

  const projectsData = isLoggingForSelf ? ownProjectsData : otherProjectsData;
  const projectOptions: ComboboxOption[] = (projectsData?.data ?? [])
    .filter((p) => p.status === 'active')
    .map((p) => ({ value: p.id, label: p.name }));

  const userOptions: ComboboxOption[] = (loggableUsers ?? [])
    .slice()
    .sort((a, b) => {
      if (a.id === currentUser?.id) return -1;
      if (b.id === currentUser?.id) return 1;
      return 0;
    })
    .map((u) => ({
      value: u.id,
      label: u.id === currentUser?.id ? `${u.name} (you)` : `${u.name} (${u.email})`,
    }));

  useEffect(() => {
    if (open) {
      const resetUserId = currentUser?.id ?? '';
      prevUserIdRef.current = resetUserId;
      form.reset({
        userId: resetUserId,
        projectId: defaultProjectId ?? '',
        taskLabels: [],
        date: today(),
        hours: '',
        notes: '',
      });
    }
  }, [open, defaultProjectId, currentUser?.id, form]);

  // Reset project + tasks when selected user changes (not on initial mount)
  useEffect(() => {
    if (prevUserIdRef.current !== selectedUserId) {
      prevUserIdRef.current = selectedUserId;
      form.setValue('projectId', '');
      form.setValue('taskLabels', []);
    }
  }, [selectedUserId, form]);

  const projectId = form.watch('projectId');
  const taskLabels = form.watch('taskLabels');
  const date = form.watch('date');
  const hoursStr = form.watch('hours');
  const hoursNum = hoursStr ? parseFloat(hoursStr) || 0 : 0;
  const prevProjectIdRef = useRef(projectId);

  const { data: previewWarnings } = useWarningsPreview({
    userId: isLoggingForSelf ? undefined : selectedUserId,
    date,
    projectId: projectId || undefined,
    hours: hoursNum,
  });

  // Clear task labels when project changes (not on initial mount)
  useEffect(() => {
    if (prevProjectIdRef.current !== projectId) {
      prevProjectIdRef.current = projectId;
      form.setValue('taskLabels', []);
    }
  }, [projectId, form]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      projectId: values.projectId,
      taskLabels: values.taskLabels,
      date: values.date,
      hours: parseFloat(values.hours),
      notes: values.notes,
      ...(values.userId && values.userId !== currentUser?.id && { userId: values.userId }),
    };
    createTimeLog.mutate(payload, {
      onSuccess: () => {
        form.reset({
          userId: values.userId,
          projectId: values.projectId,
          taskLabels: [],
          date: values.date,
          hours: '',
          notes: '',
        });
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Log Time</SheetTitle>
          <SheetDescription>Record hours worked on a project.</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            {showUserSelector && (
              <Controller
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label>User</Label>
                    <Combobox
                      options={userOptions}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      placeholder="Select user..."
                      searchPlaceholder="Search users..."
                      emptyText="No users available."
                    />
                  </div>
                )}
              />
            )}
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
                        if (v === '' || /^(0|[1-9]\d*)?(\.\d*)?$/.test(v)) {
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
