import type { Meta, StoryObj } from "@storybook/react-vite";
import { Inbox, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

const meta: Meta<typeof EmptyState> = {
  title: "UI/EmptyState",
  component: EmptyState,
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    icon: Inbox,
    title: "No time logs yet",
    description: "Get started by logging your first hours against a project.",
  },
};

export const WithAction: Story = {
  render: () => (
    <EmptyState
      icon={Users}
      title="No team members"
      description="Invite people to join this team and start collaborating."
      action={
        <Button>
          <Plus className="h-4 w-4" />
          Invite Members
        </Button>
      }
    />
  ),
};
