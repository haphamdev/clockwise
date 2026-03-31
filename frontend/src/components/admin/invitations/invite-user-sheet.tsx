import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { TeamAssignmentRow } from '@/components/admin/team-assignment-row';
import { useTeams } from '@/lib/teams/use-teams';
import { useCreateInvitation } from '@/lib/invitations/use-create-invitation';

const schema = z.object({
  email: z.string().email('Valid email is required'),
  teamAssignments: z
    .array(
      z.object({
        teamId: z.string().min(1, 'Team is required'),
        role: z.enum(['manager', 'member']),
      }),
    )
    .min(1, 'At least one team assignment is required'),
});

type FormValues = z.infer<typeof schema>;

interface InviteUserSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteUserSheet({ open, onOpenChange }: InviteUserSheetProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      teamAssignments: [{ teamId: '', role: 'member' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'teamAssignments',
  });

  const teamAssignments = form.watch('teamAssignments');
  const hasEmptyTeam = teamAssignments.some((a) => !a.teamId);

  const { data: teamsData } = useTeams({ limit: 100 });
  const createInvitation = useCreateInvitation();

  const onSubmit = (values: FormValues) => {
    createInvitation.mutate(values, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Invite User</SheetTitle>
          <SheetDescription>Send an invitation to join the organization.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Team Assignments</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={hasEmptyTeam}
                  onClick={() => append({ teamId: '', role: 'member' })}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
              {fields.map((field, index) => (
                <TeamAssignmentRow
                  key={field.id}
                  teamId={form.watch(`teamAssignments.${index}.teamId`)}
                  role={form.watch(`teamAssignments.${index}.role`)}
                  teams={teamsData?.data ?? []}
                  onTeamChange={(v) => form.setValue(`teamAssignments.${index}.teamId`, v)}
                  onRoleChange={(v) =>
                    form.setValue(`teamAssignments.${index}.role`, v as 'manager' | 'member')
                  }
                  onRemove={() => fields.length > 1 && remove(index)}
                />
              ))}
              {form.formState.errors.teamAssignments?.message && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.teamAssignments.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={!form.formState.isValid || createInvitation.isPending} className="w-full">
              {createInvitation.isPending ? 'Sending...' : 'Send Invitation'}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
