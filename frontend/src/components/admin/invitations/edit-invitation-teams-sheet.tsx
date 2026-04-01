import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Info, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Form } from '@/components/ui/form';
import { TeamAssignmentRow } from '@/components/admin/team-assignment-row';
import { useTeams } from '@/lib/teams/use-teams';
import { useUpdateInvitationTeamAssignments } from '@/lib/invitations/use-update-invitation-team-assignments';
import type { Invitation } from '@/lib/invitations/types';

const schema = z.object({
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

interface EditInvitationTeamsSheetProps {
  invitation: Invitation | null;
  onOpenChange: (open: boolean) => void;
}

export function EditInvitationTeamsSheet({
  invitation,
  onOpenChange,
}: EditInvitationTeamsSheetProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { teamAssignments: [{ teamId: '', role: 'member' }] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'teamAssignments',
  });

  const teamAssignments = form.watch('teamAssignments');
  const hasEmptyTeam = teamAssignments.some((a) => !a.teamId);
  const selectedTeamIds = teamAssignments.map((a) => a.teamId).filter(Boolean);

  const { data: teamsData } = useTeams({ limit: 100 });
  const allTeamsAssigned = selectedTeamIds.length >= (teamsData?.data?.length ?? 0);
  const updateTeamAssignments = useUpdateInvitationTeamAssignments();

  useEffect(() => {
    if (invitation) {
      form.reset({
        teamAssignments: invitation.teamAssignments.map((ta) => ({
          teamId: ta.teamId,
          role: ta.role,
        })),
      });
    }
  }, [invitation, form]);

  const onSubmit = (values: FormValues) => {
    if (!invitation) return;
    updateTeamAssignments.mutate(
      { id: invitation.id, payload: values },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Sheet open={invitation !== null} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Team Assignments</SheetTitle>
          <SheetDescription>{invitation?.email}</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            {invitation?.isExpired && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This invitation has expired. Saving will resend the invitation with a new link.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Team Assignments</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={hasEmptyTeam || allTeamsAssigned}
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
                  excludeTeamIds={selectedTeamIds}
                  onTeamChange={(v) => form.setValue(`teamAssignments.${index}.teamId`, v, { shouldValidate: true })}
                  onRoleChange={(v) =>
                    form.setValue(`teamAssignments.${index}.role`, v as 'manager' | 'member', { shouldValidate: true })
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

            <Button
              type="submit"
              disabled={!form.formState.isValid || updateTeamAssignments.isPending}
              className="w-full"
            >
              {updateTeamAssignments.isPending
                ? 'Saving...'
                : invitation?.isExpired
                  ? 'Save & Resend Invitation'
                  : 'Save Changes'}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
