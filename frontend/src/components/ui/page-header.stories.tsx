import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus } from 'lucide-react';
import { MemoryRouter } from 'react-router-dom';

import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';

const meta: Meta<typeof PageHeader> = {
  title: 'UI/PageHeader',
  component: PageHeader,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {
  args: { title: 'Teams' },
};

export const WithDescription: Story = {
  args: {
    title: 'Teams',
    description: 'Manage your organization teams and members.',
  },
};

export const WithBreadcrumbs: Story = {
  args: {
    title: 'Engineering',
    breadcrumbs: [
      { label: 'Admin', href: '/admin' },
      { label: 'Teams', href: '/teams' },
      { label: 'Engineering' },
    ],
  },
};

export const WithActions: Story = {
  render: () => (
    <PageHeader
      title="Teams"
      description="Manage your organization teams and members."
      actions={
        <Button>
          <Plus className="h-4 w-4" />
          Create Team
        </Button>
      }
    />
  ),
};

export const Full: Story = {
  render: () => (
    <PageHeader
      title="Engineering"
      description="8 members across 3 projects."
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Teams', href: '/teams' },
        { label: 'Engineering' },
      ]}
      actions={
        <>
          <Button variant="outline">Export</Button>
          <Button>
            <Plus className="h-4 w-4" />
            Add Member
          </Button>
        </>
      }
    />
  ),
};
