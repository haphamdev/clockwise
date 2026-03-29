import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const WithImage: Story = {
  render: () => (
    <Avatar>
      <AvatarImage
        src="https://api.dicebear.com/9.x/initials/svg?seed=JD"
        alt="John Doe"
      />
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
  ),
};

export const FallbackOnly: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="" alt="Jane Smith" />
      <AvatarFallback>JS</AvatarFallback>
    </Avatar>
  ),
};
