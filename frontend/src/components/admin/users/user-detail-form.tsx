import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge, type Status } from '@/components/ui/status-badge';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { useTeams } from '@/lib/teams/use-teams';
import { useUpdateUser } from '@/lib/users/use-update-user';
import { useDeactivateUser } from '@/lib/users/use-deactivate-user';
import { useReactivateUser } from '@/lib/users/use-reactivate-user';
import type { User } from '@/lib/users/types';

const schema = z.object({
  isAdmin: z.boolean(),
  teamAssignments: z.array(
    z.object({
      teamId: z.string().min(1, 'Team is required'),
      role: z.enum(['manager', 'member']),
    }),
  ),
});

type FormValues = z.infer<typeof schema>;

interface UserDetailFormProps {
  user: User;
  onClose: () => void;
}

export function UserDetailForm({ user, onClose }: UserDetailFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      isAdmin: user.isAdmin,
      teamAssignments: user.teamMemberships.map((t) => ({
        teamId: t.teamId,
        role: t.role,
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'teamAssignments',
  });

  const { data: teamsData } = useTeams({ limit: 100 });
  const updateUser = useUpdateUser();
  const deactivateUser = useDeactivateUser();
  const reactivateUser = useReactivateUser();

  useEffect(() => {
    form.reset({
      isAdmin: user.isAdmin,
      teamAssignments: user.teamMemberships.map((t) => ({
        teamId: t.teamId,
        role: t.role,
      })),
    });
  }, [user, form]);

  const onSubmit = (values: FormValues) => {
    updateUser.mutate(
      { id: user.id, payload: values },
      { onSuccess: () => onClose() },
    );
  };

  const handleDeactivate = () => {
    deactivateUser.mutate(user.id, { onSuccess: () => onClose() });
  };

  const handleReactivate = () => {
    reactivateUser.mutate(user.id, { onSuccess: () => onClose() });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
          <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={user.status as Status} />
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="isAdmin"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal">
                  Organization Admin
                </FormLabel>
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
                onClick={() => append({ teamId: '', role: 'member' })}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add
              </Button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name={`teamAssignments.${index}.teamId`}
                  render={({ field: f }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Select value={f.value} onValueChange={f.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                          <SelectContent>
                            {teamsData?.data.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`teamAssignments.${index}.role`}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormControl>
                        <Select value={f.value} onValueChange={f.onChange}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground">No team assignments.</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={updateUser.isPending} className="flex-1">
              {updateUser.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            {user.status === 'active' ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeactivate}
                disabled={deactivateUser.isPending}
              >
                Deactivate
              </Button>
            ) : user.status === 'deactivated' ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleReactivate}
                disabled={reactivateUser.isPending}
              >
                Reactivate
              </Button>
            ) : null}
          </div>
        </form>
      </Form>
    </div>
  );
}
