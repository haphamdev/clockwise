// Static, deterministic definitions for the isolated demo organization.
// Consumed by seed-demo.ts. Everything lives under DEMO_ORG_ID so it can be
// wiped and recreated without touching the real Default Organization.

export const DEMO_ORG_ID = "00000000-0000-4000-a000-0000000000de";

export type DemoRoleKey = "admin" | "manager" | "member";

export interface DemoAccount {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

// The three logged-in demo personas. Fixed ids/emails so the backend
// demo-login endpoint can resolve them by email.
export const DEMO_ACCOUNTS: Record<DemoRoleKey, DemoAccount> = {
  admin: {
    id: "00000000-0000-4000-b000-000000000001",
    email: "demo-admin@clockwise.demo",
    name: "Demo Admin",
    isAdmin: true,
  },
  manager: {
    id: "00000000-0000-4000-b000-000000000002",
    email: "demo-manager@clockwise.demo",
    name: "Demo Manager",
    isAdmin: false,
  },
  member: {
    id: "00000000-0000-4000-b000-000000000003",
    email: "demo-member@clockwise.demo",
    name: "Demo Member",
    isAdmin: false,
  },
};

// Team indices: 0=Engineering, 1=Design, 2=Product, 3=Marketing, 4=QA
export const DEMO_TEAMS = [
  { name: "Engineering", description: "Software development and architecture" },
  { name: "Design", description: "UI/UX design and user research" },
  { name: "Product", description: "Product management and roadmap" },
  { name: "Marketing", description: "Brand, content, and growth marketing" },
  { name: "QA", description: "Quality assurance and test automation" },
] as const;

export interface DemoMembership {
  teamIndex: number;
  role: "manager" | "member";
}

// Memberships for the three demo personas (so each persona's own dashboard
// has data). Manager manages Engineering + Design; member is in Engineering;
// admin sits in Product.
export const DEMO_ACCOUNT_MEMBERSHIPS: Record<DemoRoleKey, DemoMembership[]> = {
  admin: [{ teamIndex: 2, role: "member" }],
  manager: [
    { teamIndex: 0, role: "manager" },
    { teamIndex: 1, role: "manager" },
  ],
  member: [{ teamIndex: 0, role: "member" }],
};

export interface DemoTeammate {
  name: string;
  email: string;
  teamIndex: number;
  role: "manager" | "member";
}

// 20 supporting teammates (no login) distributed Eng 6 / Design 4 / Product 4 /
// Marketing 3 / QA 3. First teammate in each team is a manager.
export const DEMO_TEAMMATES: DemoTeammate[] = [
  // Engineering (0)
  {
    name: "Alice Nguyen",
    email: "demo.user1@clockwise.demo",
    teamIndex: 0,
    role: "manager",
  },
  {
    name: "Bob Martinez",
    email: "demo.user2@clockwise.demo",
    teamIndex: 0,
    role: "member",
  },
  {
    name: "Carla Reyes",
    email: "demo.user3@clockwise.demo",
    teamIndex: 0,
    role: "member",
  },
  {
    name: "David Kim",
    email: "demo.user4@clockwise.demo",
    teamIndex: 0,
    role: "member",
  },
  {
    name: "Emma Wilson",
    email: "demo.user5@clockwise.demo",
    teamIndex: 0,
    role: "member",
  },
  {
    name: "Frank Zhao",
    email: "demo.user6@clockwise.demo",
    teamIndex: 0,
    role: "member",
  },
  // Design (1)
  {
    name: "Grace Lee",
    email: "demo.user7@clockwise.demo",
    teamIndex: 1,
    role: "manager",
  },
  {
    name: "Henry Adams",
    email: "demo.user8@clockwise.demo",
    teamIndex: 1,
    role: "member",
  },
  {
    name: "Isla Fernandez",
    email: "demo.user9@clockwise.demo",
    teamIndex: 1,
    role: "member",
  },
  {
    name: "Jack Turner",
    email: "demo.user10@clockwise.demo",
    teamIndex: 1,
    role: "member",
  },
  // Product (2)
  {
    name: "Karen Blake",
    email: "demo.user11@clockwise.demo",
    teamIndex: 2,
    role: "manager",
  },
  {
    name: "Liam Patel",
    email: "demo.user12@clockwise.demo",
    teamIndex: 2,
    role: "member",
  },
  {
    name: "Mia Rossi",
    email: "demo.user13@clockwise.demo",
    teamIndex: 2,
    role: "member",
  },
  {
    name: "Noah Clark",
    email: "demo.user14@clockwise.demo",
    teamIndex: 2,
    role: "member",
  },
  // Marketing (3)
  {
    name: "Olivia Brooks",
    email: "demo.user15@clockwise.demo",
    teamIndex: 3,
    role: "manager",
  },
  {
    name: "Peter Novak",
    email: "demo.user16@clockwise.demo",
    teamIndex: 3,
    role: "member",
  },
  {
    name: "Quinn Harris",
    email: "demo.user17@clockwise.demo",
    teamIndex: 3,
    role: "member",
  },
  // QA (4)
  {
    name: "Rachel Green",
    email: "demo.user18@clockwise.demo",
    teamIndex: 4,
    role: "manager",
  },
  {
    name: "Sam Okafor",
    email: "demo.user19@clockwise.demo",
    teamIndex: 4,
    role: "member",
  },
  {
    name: "Tara Singh",
    email: "demo.user20@clockwise.demo",
    teamIndex: 4,
    role: "member",
  },
];

export interface DemoProject {
  name: string;
  description: string;
  status: "active" | "archived";
  teamIndexes: number[];
  tasks: string[];
}

// 8 projects. Task labels drawn from a shared vocabulary; unique per project.
export const DEMO_PROJECTS: DemoProject[] = [
  {
    name: "Website Redesign",
    description: "Marketing site refresh and design system rollout",
    status: "active",
    teamIndexes: [1, 0],
    tasks: ["Design", "Development", "Code Review", "Testing", "Meetings"],
  },
  {
    name: "Mobile App",
    description: "iOS and Android time-tracking companion app",
    status: "active",
    teamIndexes: [0, 2],
    tasks: [
      "Development",
      "Code Review",
      "Testing",
      "Documentation",
      "Planning",
    ],
  },
  {
    name: "API Platform",
    description: "Public REST API and developer platform",
    status: "active",
    teamIndexes: [0],
    tasks: ["Development", "Code Review", "Testing", "Documentation"],
  },
  {
    name: "Q3 Growth Campaign",
    description: "Cross-channel acquisition campaign for Q3",
    status: "active",
    teamIndexes: [3, 2],
    tasks: ["Planning", "Meetings", "Documentation", "Development"],
  },
  {
    name: "Customer Onboarding",
    description: "Guided onboarding flow and lifecycle emails",
    status: "active",
    teamIndexes: [2, 1],
    tasks: ["Planning", "Design", "Documentation", "Meetings"],
  },
  {
    name: "Design System",
    description: "Shared component library and design tokens",
    status: "active",
    teamIndexes: [1, 0],
    tasks: ["Design", "Development", "Documentation", "Code Review"],
  },
  {
    name: "QA Automation",
    description: "End-to-end test suite and CI integration",
    status: "active",
    teamIndexes: [4, 0],
    tasks: ["Testing", "Development", "Code Review", "Documentation"],
  },
  {
    name: "Legacy Migration",
    description: "Retired monolith migration (archived)",
    status: "archived",
    teamIndexes: [0],
    tasks: ["Development", "Testing", "Documentation", "Meetings"],
  },
];

// Emails whose owners occasionally log >12h days to surface anomaly views.
export const DEMO_ANOMALY_EMAILS: Record<string, true> = {
  "demo.user5@clockwise.demo": true,
  "demo.user12@clockwise.demo": true,
};
