import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { useUpdateTimeLog } from '@/lib/time-logs/use-update-time-log';
import type { TimeLog } from '@/lib/time-logs/types';

const today = () => new Date().toISOString().slice(0, 10);

const schema = z.object({
  taskLabels: z.array(z.string().min(1)).min(1, 'At least one task is required'),
  date: z.string().min(1, 'Date is required'),
  hours: z.number().min(0.01, 'Minimum 0.01').max(24, 'Maximum 24'),
  notes: z.string().optional(),
  reason: z.string().min(1, 'Reason is required').max(500),
});

type FormValues = z.infer<typeof schema>;

interface EditTimeLogSheetProps {
  timeLog: TimeLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTimeLogSheet({ timeLog, open, onOpenChange }: EditTimeLogSheetProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      taskLabels: [],
      date: '',
      hours: 0,
      notes: '',
      reason: '',
    },
  });
  const updateTimeLog = useUpdateTimeLog();

  useEffect(() => {
    if (open && timeLog) {
      form.reset({
        taskLabels: timeLog.tasks.map((t) => t.label),
        date: timeLog.date.slice(0, 10),
        hours: timeLog.hours,
        notes: timeLog.notes ?? '',
        reason: '',
      });
    }
  }, [open, timeLog, form]);

  if (!timeLog) return null;

  const onSubmit = (values: FormValues) => {
    updateTimeLog.mutate(
      { id: timeLog.id, payload: values },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Time Log</SheetTitle>
          <SheetDescription>
            Update the time log for {timeLog.project.name}.
          </SheetDescription>
        </SheetHeader>

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
              name="taskLabels"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Tasks</FormLabel>
                  <TaskAutocomplete
                    projectId={timeLog.projectId}
                    value={field.value}
                    onChange={field.onChange}
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
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for edit</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Why are you making this change?"
                      maxLength={500}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={updateTimeLog.isPending} className="w-full">
              {updateTimeLog.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
