import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import type { ComboboxOption } from "@/components/ui/combobox";
import { Combobox } from "@/components/ui/combobox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/use-auth";
import { useCreateProject } from "@/lib/projects/use-create-project";
import { useTeams } from "@/lib/teams/use-teams";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
  teamIds: z.array(z.string()).min(1, "At least one team is required"),
});

type FormValues = z.infer<typeof schema>;

interface CreateProjectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectSheet({
  open,
  onOpenChange,
}: CreateProjectSheetProps) {
  const { user } = useAuth();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", teamIds: [] },
  });
  const createProject = useCreateProject();
  const { data: teamsData } = useTeams({ limit: 100 });

  const teamOptions: ComboboxOption[] = (teamsData?.data ?? [])
    .filter((t) => {
      if (user?.isAdmin) return !t.isArchived;
      // Manager: only teams they manage
      return (
        !t.isArchived &&
        user?.teams.some((tm) => tm.teamId === t.id && tm.role === "manager")
      );
    })
    .map((t) => ({ value: t.id, label: t.name }));

  const onSubmit = (values: FormValues) => {
    createProject.mutate(values, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create Project</SheetTitle>
          <SheetDescription>
            Add a new project to your organization.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-6 space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Mobile App Redesign" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Controller
              control={form.control}
              name="teamIds"
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label>Teams</Label>
                  <Combobox
                    multiple
                    options={teamOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select teams..."
                    searchPlaceholder="Search teams..."
                    emptyText="No teams available."
                  />
                  {fieldState.error && (
                    <p className="text-[0.8rem] font-medium text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />
            <Button
              type="submit"
              disabled={createProject.isPending}
              className="w-full"
            >
              {createProject.isPending ? "Creating..." : "Create Project"}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
