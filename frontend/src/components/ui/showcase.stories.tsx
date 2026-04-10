import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ColumnDef } from '@tanstack/react-table';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ArrowUpDown,
  Inbox,
  Loader2,
  Plus,
  Terminal,
} from 'lucide-react';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'sonner';

import { AuthContext } from '@/lib/auth/auth-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterBar } from '@/components/ui/filter-bar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster } from '@/components/ui/sonner';
import { StatusBadge, STATUS_VALUES, type Status } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskDisplay } from '@/components/ui/task-display';
import { TimeDisplay } from '@/components/ui/time-display';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-md">
    <h2 className="text-xl font-semibold border-b border-border-muted pb-sm">{title}</h2>
    {children}
  </section>
);

const colors = [
  ['bg-dark', 'bg-bg-dark'],
  ['bg', 'bg-bg'],
  ['bg-light', 'bg-bg-light'],
  ['primary', 'bg-primary'],
  ['secondary', 'bg-secondary'],
  ['danger', 'bg-danger'],
  ['warning', 'bg-warning'],
  ['success', 'bg-success'],
  ['info', 'bg-info'],
  ['border', 'bg-border'],
  ['highlight', 'bg-accent'],
];

const variants = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const;
const sizes = ['sm', 'default', 'lg'] as const;

interface Person {
  name: string;
  email: string;
  status: Status;
  hours: number;
}

const tableData: Person[] = [
  { name: 'Alice Johnson', email: 'alice@example.com', status: 'active', hours: 38 },
  { name: 'Bob Smith', email: 'bob@example.com', status: 'pending', hours: 24 },
  { name: 'Carol White', email: 'carol@example.com', status: 'deactivated', hours: 0 },
  { name: 'David Brown', email: 'david@example.com', status: 'invited', hours: 0 },
  { name: 'Eve Davis', email: 'eve@example.com', status: 'archived', hours: 42 },
];

const tableColumns: ColumnDef<Person>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Name <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  { accessorKey: 'email', header: 'Email' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
  },
  { accessorKey: 'hours', header: 'Hours' },
];

const storyQueryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, enabled: false } },
});

const stubAuth = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: () => {},
  logout: async () => {},
  handleOAuthCallback: async () => {},
};

const sampleTasks = [
  { id: '1', label: 'FE-102', description: 'Implement login page redesign' },
  { id: '2', label: 'FE-103', description: null },
  { id: '3', label: 'BE-47', description: 'Add rate limiting to auth endpoints' },
] as const;

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function hoursAgo(n: number): Date {
  return new Date(Date.now() - n * 60 * 60 * 1000);
}

const meta: Meta = {
  title: 'Overview/Kitchen Sink',
  decorators: [
    (Story) => (
      <QueryClientProvider client={storyQueryClient}>
        <AuthContext.Provider value={stubAuth}>
          <MemoryRouter>
            <Story />
            <Toaster />
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    ),
  ],
};

export default meta;

export const Default: StoryObj = {
  render: () => (
    <div className="min-h-screen bg-bg-dark p-xl">
      <div className="max-w-5xl mx-auto space-y-xl">
        <h1 className="text-3xl font-bold">Clockwise Design System</h1>

        <Section title="Typography">
          <div className="space-y-sm">
            <h1 className="text-4xl font-bold">Heading 1</h1>
            <h2 className="text-3xl font-semibold">Heading 2</h2>
            <h3 className="text-2xl font-semibold">Heading 3</h3>
            <h4 className="text-xl font-medium">Heading 4</h4>
            <p>Body text — primary foreground color for important content.</p>
            <p className="text-muted-foreground">Muted text — secondary information and descriptions.</p>
          </div>
        </Section>

        <Section title="Colors">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-sm">
            {colors.map(([label, cls]) => (
              <div key={label} className="space-y-xs">
                <div className={`h-12 rounded-md ${cls} border border-border-muted`} />
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Spacing">
          <div className="space-y-sm">
            {['xs', 'sm', 'md-sm', 'md', 'md-lg', 'lg', 'xl'].map((s) => (
              <div key={s} className="flex items-center gap-md">
                <span className="text-xs text-muted-foreground w-12">{s}</span>
                <div className="h-4 rounded bg-primary" style={{ width: `var(--space-${s})` }} />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Buttons">
          <div className="space-y-md">
            {variants.map((v) => (
              <div key={v} className="space-y-sm">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{v}</p>
                <div className="flex items-center gap-md flex-wrap">
                  {sizes.map((s) => (
                    <Button key={s} variant={v} size={s}>{s}</Button>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-md">
              <Button disabled>Disabled</Button>
              <Button disabled><Loader2 className="animate-spin" /> Loading</Button>
            </div>
          </div>
        </Section>

        <Section title="Badges">
          <div className="flex flex-wrap items-center gap-md">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-md mt-md">
            {STATUS_VALUES.map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>
        </Section>

        <Section title="TaskDisplay">
          <div className="space-y-md">
            <div className="space-y-sm">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">badge (default)</p>
              <div className="flex flex-wrap items-center gap-md">
                {sampleTasks.map((t) => (
                  <TaskDisplay key={t.id} task={t} />
                ))}
              </div>
            </div>
            <div className="space-y-sm">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">inline</p>
              <div className="flex flex-wrap items-center gap-md">
                {sampleTasks.map((t) => (
                  <TaskDisplay key={t.id} task={t} variant="inline" />
                ))}
              </div>
            </div>
            <div className="space-y-sm">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">block</p>
              <div className="grid grid-cols-3 gap-md">
                {sampleTasks.map((t) => (
                  <TaskDisplay key={t.id} task={t} variant="block" />
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section title="TimeDisplay">
          <div className="space-y-md">
            <div className="space-y-sm">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">mode=&quot;date&quot; (relative)</p>
              <div className="flex flex-wrap items-center gap-lg">
                <span className="text-sm"><span className="text-muted-foreground mr-2">3h ago:</span><TimeDisplay value={hoursAgo(3)} mode="date" /></span>
                <span className="text-sm"><span className="text-muted-foreground mr-2">Yesterday:</span><TimeDisplay value={daysAgo(1)} mode="date" /></span>
                <span className="text-sm"><span className="text-muted-foreground mr-2">3 days:</span><TimeDisplay value={daysAgo(3)} mode="date" /></span>
                <span className="text-sm"><span className="text-muted-foreground mr-2">30 days:</span><TimeDisplay value={daysAgo(30)} mode="date" /></span>
              </div>
            </div>
            <div className="space-y-sm">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">mode=&quot;date&quot; absolute</p>
              <div className="flex flex-wrap items-center gap-lg">
                <span className="text-sm"><span className="text-muted-foreground mr-2">Today:</span><TimeDisplay value={new Date()} mode="date" absolute /></span>
                <span className="text-sm"><span className="text-muted-foreground mr-2">Yesterday:</span><TimeDisplay value={daysAgo(1)} mode="date" absolute /></span>
                <span className="text-sm"><span className="text-muted-foreground mr-2">30 days:</span><TimeDisplay value={daysAgo(30)} mode="date" absolute /></span>
              </div>
            </div>
            <div className="space-y-sm">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">mode=&quot;datetime&quot;</p>
              <div className="flex flex-wrap items-center gap-lg">
                <span className="text-sm"><span className="text-muted-foreground mr-2">3h ago:</span><TimeDisplay value={hoursAgo(3)} mode="datetime" /></span>
                <span className="text-sm"><span className="text-muted-foreground mr-2">30 days:</span><TimeDisplay value={daysAgo(30)} mode="datetime" /></span>
                <span className="text-sm"><span className="text-muted-foreground mr-2">Absolute:</span><TimeDisplay value={hoursAgo(3)} mode="datetime" absolute /></span>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Cards">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Summary</CardTitle>
                <CardDescription>March 24–30, 2026</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">You logged 38.5 hours across 4 projects this week.</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Details</Button>
                <Button>Log Time</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Team Utilization</CardTitle>
                <CardDescription>Engineering — 8 members</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Average utilization at 92% for the current period.</p>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section title="Form Controls">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <div className="space-y-md">
              <div className="grid gap-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Enter your name" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" placeholder="Optional notes..." />
              </div>
              <div className="grid gap-1.5">
                <Label>Project</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eng">Engineering</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-md">
              <div className="flex items-center gap-2">
                <Checkbox id="billable" />
                <Label htmlFor="billable">Billable hours</Label>
              </div>
              <RadioGroup defaultValue="daily">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="daily" id="daily" />
                  <Label htmlFor="daily">Daily</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="weekly" id="weekly" />
                  <Label htmlFor="weekly">Weekly</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <Label htmlFor="monthly">Monthly</Label>
                </div>
              </RadioGroup>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Hover for tooltip</Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Helpful information here</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </Section>

        <Section title="DataTable">
          <DataTable columns={tableColumns} data={tableData} pageSize={5} />
        </Section>

        <Section title="PageHeader">
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
                <Button><Plus className="h-4 w-4" /> Add Member</Button>
              </>
            }
          />
        </Section>

        <Section title="EmptyState">
          <EmptyState
            icon={Inbox}
            title="No time logs yet"
            description="Get started by logging your first hours against a project."
            action={<Button><Plus className="h-4 w-4" /> Log Time</Button>}
          />
        </Section>

        <Section title="FilterBar">
          <FilterBar>
            <Input placeholder="Search..." className="w-[200px]" />
            <Select>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </FilterBar>
        </Section>

        <Section title="Dialog & Sheet">
          <div className="flex gap-md">
            <Dialog>
              <DialogTrigger asChild><Button variant="outline">Open Dialog</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Entry</DialogTitle>
                  <DialogDescription>Make changes to your time log entry.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Input placeholder="Task name" />
                  <Input type="number" placeholder="Hours" />
                </div>
                <DialogFooter><Button>Save</Button></DialogFooter>
              </DialogContent>
            </Dialog>
            <Sheet>
              <SheetTrigger asChild><Button variant="outline">Open Sheet</Button></SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>User Details</SheetTitle>
                  <SheetDescription>View and manage user information.</SheetDescription>
                </SheetHeader>
                <div className="py-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src="https://api.dicebear.com/9.x/initials/svg?seed=AJ" />
                      <AvatarFallback>AJ</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Alice Johnson</p>
                      <p className="text-sm text-muted-foreground">alice@example.com</p>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </Section>

        <Section title="Alerts">
          <div className="space-y-md">
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Heads up!</AlertTitle>
              <AlertDescription>Your weekly hours are below the expected threshold.</AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Failed to save time log. Please try again.</AlertDescription>
            </Alert>
          </div>
        </Section>

        <Section title="Tabs">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <p className="text-sm text-muted-foreground p-4">Team overview content goes here.</p>
            </TabsContent>
            <TabsContent value="members">
              <p className="text-sm text-muted-foreground p-4">Member list content goes here.</p>
            </TabsContent>
            <TabsContent value="settings">
              <p className="text-sm text-muted-foreground p-4">Team settings content goes here.</p>
            </TabsContent>
          </Tabs>
        </Section>

        <Section title="Skeleton">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        </Section>

        <Section title="Toast">
          <div className="flex flex-wrap gap-md">
            <Button onClick={() => toast('Default notification')}>Default</Button>
            <Button onClick={() => toast.success('Time logged successfully')}>Success</Button>
            <Button onClick={() => toast.error('Failed to save entry')}>Error</Button>
            <Button onClick={() => toast.warning('Hours exceed daily threshold')}>Warning</Button>
          </div>
        </Section>
      </div>
    </div>
  ),
};
