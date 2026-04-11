import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Status, StatusBadge } from "@/components/ui/status-badge";

interface User {
  id: string;
  name: string;
  email: string;
  status: Status;
  team: string;
}

const sampleData: User[] = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@example.com",
    status: "active",
    team: "Engineering",
  },
  {
    id: "2",
    name: "Bob Smith",
    email: "bob@example.com",
    status: "active",
    team: "Design",
  },
  {
    id: "3",
    name: "Carol White",
    email: "carol@example.com",
    status: "pending",
    team: "Engineering",
  },
  {
    id: "4",
    name: "David Brown",
    email: "david@example.com",
    status: "deactivated",
    team: "Marketing",
  },
  {
    id: "5",
    name: "Eve Davis",
    email: "eve@example.com",
    status: "invited",
    team: "Engineering",
  },
  {
    id: "6",
    name: "Frank Miller",
    email: "frank@example.com",
    status: "active",
    team: "Design",
  },
  {
    id: "7",
    name: "Grace Lee",
    email: "grace@example.com",
    status: "active",
    team: "Marketing",
  },
  {
    id: "8",
    name: "Henry Wilson",
    email: "henry@example.com",
    status: "archived",
    team: "Engineering",
  },
  {
    id: "9",
    name: "Ivy Chen",
    email: "ivy@example.com",
    status: "active",
    team: "Design",
  },
  {
    id: "10",
    name: "Jack Taylor",
    email: "jack@example.com",
    status: "pending",
    team: "Marketing",
  },
  {
    id: "11",
    name: "Kate Adams",
    email: "kate@example.com",
    status: "active",
    team: "Engineering",
  },
  {
    id: "12",
    name: "Leo Martin",
    email: "leo@example.com",
    status: "active",
    team: "Design",
  },
  {
    id: "13",
    name: "Mia Garcia",
    email: "mia@example.com",
    status: "invited",
    team: "Marketing",
  },
  {
    id: "14",
    name: "Noah Clark",
    email: "noah@example.com",
    status: "active",
    team: "Engineering",
  },
  {
    id: "15",
    name: "Olivia Hall",
    email: "olivia@example.com",
    status: "active",
    team: "Design",
  },
];

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "team",
    header: "Team",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>View Details</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">
            Deactivate
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

const meta: Meta<typeof DataTable> = {
  title: "UI/DataTable",
  component: DataTable,
};

export default meta;
type Story = StoryObj<typeof DataTable>;

export const Default: Story = {
  render: () => <DataTable columns={columns} data={sampleData} pageSize={5} />,
};

export const Empty: Story = {
  render: () => <DataTable columns={columns} data={[]} />,
};
