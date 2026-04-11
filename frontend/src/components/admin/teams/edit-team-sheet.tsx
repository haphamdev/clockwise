import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateTeam } from "@/lib/teams/use-update-team";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface EditableTeam {
  id: string;
  name: string;
  description: string | null;
}

interface EditTeamSheetProps {
  team: EditableTeam | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTeamSheet({
  team,
  open,
  onOpenChange,
}: EditTeamSheetProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "" },
  });
  const updateTeam = useUpdateTeam();

  useEffect(() => {
    if (team) {
      form.reset({ name: team.name, description: team.description ?? "" });
    }
  }, [team, form]);

  const onSubmit = (values: FormValues) => {
    if (!team) return;
    updateTeam.mutate(
      { id: team.id, payload: values },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Team</SheetTitle>
          <SheetDescription>Update team details.</SheetDescription>
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
                    <Input {...field} />
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
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={updateTeam.isPending}
              className="w-full"
            >
              {updateTeam.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
