import type { Meta, StoryObj } from "@storybook/react-vite";

import { STATUS_VALUES, StatusBadge } from "@/components/ui/status-badge";

const meta: Meta<typeof StatusBadge> = {
  title: "UI/StatusBadge",
  component: StatusBadge,
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

export const AllStatuses: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {STATUS_VALUES.map((status) => (
        <StatusBadge key={status} status={status} />
      ))}
    </div>
  ),
};
