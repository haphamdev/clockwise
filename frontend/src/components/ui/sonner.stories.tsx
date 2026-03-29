import type { Meta, StoryObj } from '@storybook/react-vite';
import { toast } from 'sonner';

import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';

const meta: Meta<typeof Toaster> = {
  title: 'UI/Sonner',
  component: Toaster,
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Toaster>;

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button onClick={() => toast('Default toast message')}>Default</Button>
      <Button onClick={() => toast.success('Action completed successfully')}>
        Success
      </Button>
      <Button onClick={() => toast.error('Something went wrong')}>
        Error
      </Button>
      <Button onClick={() => toast.warning('Please check your input')}>
        Warning
      </Button>
    </div>
  ),
};
