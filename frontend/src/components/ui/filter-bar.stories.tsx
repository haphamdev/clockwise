import type { Meta, StoryObj } from '@storybook/react-vite';

import { FilterBar } from '@/components/ui/filter-bar';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const meta: Meta<typeof FilterBar> = {
  title: 'UI/FilterBar',
  component: FilterBar,
};

export default meta;
type Story = StoryObj<typeof FilterBar>;

const FilterChildren = () => (
  <>
    <Input placeholder="Search..." className="w-[200px]" />
    <Select>
      <SelectTrigger className="w-[150px]">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="active">Active</SelectItem>
        <SelectItem value="archived">Archived</SelectItem>
      </SelectContent>
    </Select>
    <Select>
      <SelectTrigger className="w-[150px]">
        <SelectValue placeholder="Team" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="engineering">Engineering</SelectItem>
        <SelectItem value="design">Design</SelectItem>
        <SelectItem value="marketing">Marketing</SelectItem>
      </SelectContent>
    </Select>
  </>
);

export const Default: Story = {
  render: () => (
    <FilterBar>
      <FilterChildren />
    </FilterBar>
  ),
};

export const Collapsible: Story = {
  render: () => (
    <FilterBar collapsible>
      <FilterChildren />
    </FilterBar>
  ),
};
