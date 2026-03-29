import type { Meta, StoryObj } from '@storybook/react-vite';

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const meta: Meta<typeof Textarea> = {
  title: 'UI/Textarea',
  component: Textarea,
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: { placeholder: 'Type your message here...' },
};

export const Disabled: Story = {
  args: { disabled: true, placeholder: 'Disabled' },
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="notes">Notes</Label>
      <Textarea id="notes" placeholder="Add notes..." />
    </div>
  ),
};
