export interface SeedUserDef {
  name: string;
  email: string;
  outcome: "accepted" | "expired";
  inviteDateOffset: number; // Days after 2024-03-01
  acceptDelayDays?: number; // Days after invite (1-6), only for accepted
  teamAssignments: Array<{ teamIndex: number; role: "manager" | "member" }>;
}

export const TEAMS = [
  { name: "Engineering", description: "Software development and architecture" },
  { name: "Design", description: "UI/UX design and user research" },
  { name: "Marketing", description: "Brand, content, and growth marketing" },
  { name: "Sales", description: "Sales development and account management" },
  {
    name: "Customer Support",
    description: "Customer success and support operations",
  },
  { name: "Product", description: "Product management and strategy" },
  { name: "QA", description: "Quality assurance and test automation" },
  { name: "DevOps", description: "Infrastructure, CI/CD, and reliability" },
  { name: "Data Science", description: "Analytics, ML, and data engineering" },
  { name: "HR", description: "People operations and talent acquisition" },
] as const;

// Team indices: 0=Engineering, 1=Design, 2=Marketing, 3=Sales,
// 4=Customer Support, 5=Product, 6=QA, 7=DevOps, 8=Data Science, 9=HR

// ── Batch 1: March 1, 2024 — 40 invitations (37 accepted, 3 expired) ───────
//
// Target memberships (batch1 only — batch2 adds Eng+1, Design+1, Product+1, DS+1):
//   Eng=7  Design=4  Marketing=5  Sales=5  CS=6  Product=5  QA=5  DevOps=6  DS=5  HR=5
//   Total: 53 memberships from 37 users (16 cross-team assignments)

const batch1Accepted: SeedUserDef[] = [
  // Engineering — 7 members (2 mgr + 5 mem), 2 cross-team out
  {
    name: "Alice Chen",
    email: "alice.chen@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 1,
    teamAssignments: [{ teamIndex: 0, role: "manager" }],
  },
  {
    name: "Bob Martinez",
    email: "bob.martinez@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 1,
    teamAssignments: [{ teamIndex: 0, role: "manager" }],
  },
  {
    name: "Carol White",
    email: "carol.white@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 2,
    teamAssignments: [
      { teamIndex: 0, role: "member" },
      { teamIndex: 8, role: "member" },
    ],
  },
  {
    name: "David Kim",
    email: "david.kim@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 2,
    teamAssignments: [
      { teamIndex: 0, role: "member" },
      { teamIndex: 7, role: "member" },
    ],
  },
  {
    name: "Eva Johnson",
    email: "eva.johnson@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 3,
    teamAssignments: [{ teamIndex: 0, role: "member" }],
  },
  {
    name: "Frank Lee",
    email: "frank.lee@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 3,
    teamAssignments: [
      { teamIndex: 0, role: "member" },
      { teamIndex: 7, role: "member" },
    ],
  },
  {
    name: "Henry Zhao",
    email: "henry.zhao@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 4,
    teamAssignments: [
      { teamIndex: 0, role: "member" },
      { teamIndex: 6, role: "member" },
    ],
  },

  // Design — 4 members (1 mgr + 3 mem), 1 cross-team out
  {
    name: "Irene Costa",
    email: "irene.costa@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 1,
    teamAssignments: [{ teamIndex: 1, role: "manager" }],
  },
  {
    name: "Jack Rivera",
    email: "jack.rivera@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 2,
    teamAssignments: [{ teamIndex: 1, role: "member" }],
  },
  {
    name: "Karen Patel",
    email: "karen.patel@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 3,
    teamAssignments: [{ teamIndex: 1, role: "member" }],
  },
  {
    name: "Mia Tanaka",
    email: "mia.tanaka@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 6,
    teamAssignments: [
      { teamIndex: 1, role: "member" },
      { teamIndex: 5, role: "member" },
    ],
  },

  // Marketing — 5 members (1 mgr + 4 mem), 1 cross-team in from Sales
  {
    name: "Noah Green",
    email: "noah.green@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 1,
    teamAssignments: [{ teamIndex: 2, role: "manager" }],
  },
  {
    name: "Olivia Scott",
    email: "olivia.scott@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 2,
    teamAssignments: [
      { teamIndex: 2, role: "member" },
      { teamIndex: 3, role: "member" },
    ],
  },
  {
    name: "Paul Adams",
    email: "paul.adams@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 3,
    teamAssignments: [
      { teamIndex: 2, role: "member" },
      { teamIndex: 4, role: "member" },
    ],
  },
  {
    name: "Rachel Nguyen",
    email: "rachel.nguyen@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 5,
    teamAssignments: [
      { teamIndex: 2, role: "member" },
      { teamIndex: 9, role: "member" },
    ],
  },

  // Sales — 5 members (1 mgr + 4 mem), 1 cross-team in from Marketing
  {
    name: "Sam Wilson",
    email: "sam.wilson@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 1,
    teamAssignments: [{ teamIndex: 3, role: "manager" }],
  },
  {
    name: "Tina Brooks",
    email: "tina.brooks@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 2,
    teamAssignments: [
      { teamIndex: 3, role: "member" },
      { teamIndex: 2, role: "member" },
    ],
  },
  {
    name: "Umar Shah",
    email: "umar.shah@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 3,
    teamAssignments: [
      { teamIndex: 3, role: "member" },
      { teamIndex: 9, role: "member" },
    ],
  },
  {
    name: "Wesley Clark",
    email: "wesley.clark@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 6,
    teamAssignments: [
      { teamIndex: 3, role: "member" },
      { teamIndex: 4, role: "member" },
    ],
  },

  // Customer Support — 6 members (1 mgr + 5 mem), 3 cross-team in
  {
    name: "Xena Morgan",
    email: "xena.morgan@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 1,
    teamAssignments: [{ teamIndex: 4, role: "manager" }],
  },
  {
    name: "Yusuf Ali",
    email: "yusuf.ali@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 2,
    teamAssignments: [
      { teamIndex: 4, role: "member" },
      { teamIndex: 6, role: "member" },
    ],
  },
  {
    name: "Zara Hughes",
    email: "zara.hughes@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 3,
    teamAssignments: [
      { teamIndex: 4, role: "member" },
      { teamIndex: 7, role: "member" },
    ],
  },
  {
    name: "Aaron Bell",
    email: "aaron.bell@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 4,
    teamAssignments: [
      { teamIndex: 4, role: "member" },
      { teamIndex: 5, role: "member" },
    ],
  },

  // Product — 5 members (2 mgr + 3 mem), 3 cross-team in
  {
    name: "Carlos Diaz",
    email: "carlos.diaz@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 1,
    teamAssignments: [{ teamIndex: 5, role: "manager" }],
  },
  {
    name: "Diana Ross",
    email: "diana.ross@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 2,
    teamAssignments: [{ teamIndex: 5, role: "manager" }],
  },
  {
    name: "Fiona Grant",
    email: "fiona.grant@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 5,
    teamAssignments: [
      { teamIndex: 5, role: "member" },
      { teamIndex: 8, role: "member" },
    ],
  },

  // QA — 5 members (1 mgr + 4 mem), 2 cross-team in
  {
    name: "George Fox",
    email: "george.fox@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 1,
    teamAssignments: [{ teamIndex: 6, role: "manager" }],
  },
  {
    name: "Hannah Price",
    email: "hannah.price@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 2,
    teamAssignments: [{ teamIndex: 6, role: "member" }],
  },
  {
    name: "Ian Murphy",
    email: "ian.murphy@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 4,
    teamAssignments: [{ teamIndex: 6, role: "member" }],
  },

  // DevOps — 6 members (1 mgr + 5 mem), 3 cross-team in
  {
    name: "Kevin Yang",
    email: "kevin.yang@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 1,
    teamAssignments: [{ teamIndex: 7, role: "manager" }],
  },
  {
    name: "Marcus Hall",
    email: "marcus.hall@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 3,
    teamAssignments: [{ teamIndex: 7, role: "member" }],
  },
  {
    name: "Nina Petrov",
    email: "nina.petrov@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 5,
    teamAssignments: [
      { teamIndex: 7, role: "member" },
      { teamIndex: 8, role: "member" },
    ],
  },

  // Data Science — 5 members (1 mgr + 4 mem), 3 cross-team in
  {
    name: "Oscar Ruiz",
    email: "oscar.ruiz@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 1,
    teamAssignments: [{ teamIndex: 8, role: "manager" }],
  },
  {
    name: "Priya Sharma",
    email: "priya.sharma@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 3,
    teamAssignments: [{ teamIndex: 8, role: "member" }],
  },

  // HR — 5 members (1 mgr + 4 mem), 2 cross-team in
  {
    name: "Sofia Mendez",
    email: "sofia.mendez@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 1,
    teamAssignments: [{ teamIndex: 9, role: "manager" }],
  },
  {
    name: "Tyler James",
    email: "tyler.james@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 2,
    teamAssignments: [{ teamIndex: 9, role: "member" }],
  },
  {
    name: "Vera Stone",
    email: "vera.stone@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 0,
    acceptDelayDays: 6,
    teamAssignments: [{ teamIndex: 9, role: "member" }],
  },
];

// 3 expired from batch 1 (invited March 1, never accepted)
const batch1Expired: SeedUserDef[] = [
  {
    name: "Wendy Flores",
    email: "wendy.flores@clockwise.test",
    outcome: "expired",
    inviteDateOffset: 0,
    teamAssignments: [{ teamIndex: 4, role: "member" }],
  },
  {
    name: "Xavier Long",
    email: "xavier.long@clockwise.test",
    outcome: "expired",
    inviteDateOffset: 0,
    teamAssignments: [{ teamIndex: 5, role: "member" }],
  },
  {
    name: "Yvonne Blake",
    email: "yvonne.blake@clockwise.test",
    outcome: "expired",
    inviteDateOffset: 0,
    teamAssignments: [{ teamIndex: 7, role: "member" }],
  },
];

// ── Batch 2: April–August 2024 — 10 invitations scattered ──────────────────

const batch2: SeedUserDef[] = [
  // 3 accepted
  {
    name: "Zane Mitchell",
    email: "zane.mitchell@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 35,
    acceptDelayDays: 2,
    teamAssignments: [{ teamIndex: 0, role: "member" }],
  },
  {
    name: "Aria Dubois",
    email: "aria.dubois@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 65,
    acceptDelayDays: 1,
    teamAssignments: [
      { teamIndex: 1, role: "member" },
      { teamIndex: 5, role: "member" },
    ],
  },
  {
    name: "Blake Harper",
    email: "blake.harper@clockwise.test",
    outcome: "accepted",
    inviteDateOffset: 120,
    acceptDelayDays: 3,
    teamAssignments: [{ teamIndex: 8, role: "member" }],
  },

  // 7 expired
  {
    name: "Chloe Watts",
    email: "chloe.watts@clockwise.test",
    outcome: "expired",
    inviteDateOffset: 40,
    teamAssignments: [{ teamIndex: 2, role: "member" }],
  },
  {
    name: "Derek Nash",
    email: "derek.nash@clockwise.test",
    outcome: "expired",
    inviteDateOffset: 55,
    teamAssignments: [{ teamIndex: 3, role: "member" }],
  },
  {
    name: "Elena Popov",
    email: "elena.popov@clockwise.test",
    outcome: "expired",
    inviteDateOffset: 75,
    teamAssignments: [{ teamIndex: 6, role: "member" }],
  },
  {
    name: "Felix Strand",
    email: "felix.strand@clockwise.test",
    outcome: "expired",
    inviteDateOffset: 90,
    teamAssignments: [{ teamIndex: 0, role: "member" }],
  },
  {
    name: "Gina Marchetti",
    email: "gina.marchetti@clockwise.test",
    outcome: "expired",
    inviteDateOffset: 110,
    teamAssignments: [{ teamIndex: 4, role: "member" }],
  },
  {
    name: "Hugo Lind",
    email: "hugo.lind@clockwise.test",
    outcome: "expired",
    inviteDateOffset: 140,
    teamAssignments: [{ teamIndex: 9, role: "member" }],
  },
  {
    name: "Isla Kemp",
    email: "isla.kemp@clockwise.test",
    outcome: "expired",
    inviteDateOffset: 160,
    teamAssignments: [{ teamIndex: 7, role: "member" }],
  },
];

export const USERS: SeedUserDef[] = [
  ...batch1Accepted,
  ...batch1Expired,
  ...batch2,
];
