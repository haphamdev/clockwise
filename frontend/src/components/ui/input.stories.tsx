import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { placeholder: "Enter text..." },
};

export const TypeEmail: Story = {
  args: { type: "email", placeholder: "email@example.com" },
};

export const TypePassword: Story = {
  args: { type: "password", placeholder: "Password" },
};

export const TypeNumber: Story = {
  args: { type: "number", placeholder: "0" },
};

export const Disabled: Story = {
  args: { disabled: true, placeholder: "Disabled" },
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="email@example.com" />
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="grid w-full max-w-sm gap-1.5">
      <Label htmlFor="email-error">Email</Label>
      <Input
        type="email"
        id="email-error"
        placeholder="email@example.com"
        className="border-destructive ring-destructive"
      />
      <p className="text-sm text-destructive">Please enter a valid email.</p>
    </div>
  ),
};
