import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

// ── Helpers ──────────────────────────────────────────────────────────────────

function uid(prefix: string, n: number): string {
  return `${prefix}-0000-0000-0000-${String(n).padStart(12, '0')}`;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(9, 0, 0, 0);
  return d;
}

function randomToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ── Seed data definitions ────────────────────────────────────────────────────

interface SeedUser {
  index: number;
  name: string;
  email: string;
  status: 'active' | 'pending' | 'deactivated';
  joinedDaysAgo: number;
}

const USERS: SeedUser[] = [
  // Deactivated users — joined earliest, deactivated ~2 weeks ago
  {
    index: 1,
    name: 'David Kim',
    email: 'david.kim@clockwise.test',
    status: 'deactivated',
    joinedDaysAgo: 90,
  },
  {
    index: 2,
    name: 'Natalia Petrov',
    email: 'natalia.petrov@clockwise.test',
    status: 'deactivated',
    joinedDaysAgo: 88,
  },
  {
    index: 3,
    name: 'Samuel Adeyemi',
    email: 'samuel.adeyemi@clockwise.test',
    status: 'deactivated',
    joinedDaysAgo: 85,
  },

  // Active users — staggered over past 2.5 months
  {
    index: 4,
    name: 'Sofia Chen',
    email: 'sofia.chen@clockwise.test',
    status: 'active',
    joinedDaysAgo: 75,
  },
  {
    index: 5,
    name: 'Marcus Johnson',
    email: 'marcus.johnson@clockwise.test',
    status: 'active',
    joinedDaysAgo: 70,
  },
  {
    index: 6,
    name: 'Priya Patel',
    email: 'priya.patel@clockwise.test',
    status: 'active',
    joinedDaysAgo: 65,
  },
  {
    index: 7,
    name: "James O'Brien",
    email: 'james.obrien@clockwise.test',
    status: 'active',
    joinedDaysAgo: 60,
  },
  {
    index: 8,
    name: 'Yuki Tanaka',
    email: 'yuki.tanaka@clockwise.test',
    status: 'active',
    joinedDaysAgo: 55,
  },
  {
    index: 9,
    name: 'Amara Okafor',
    email: 'amara.okafor@clockwise.test',
    status: 'active',
    joinedDaysAgo: 50,
  },
  {
    index: 10,
    name: 'Liam Schmidt',
    email: 'liam.schmidt@clockwise.test',
    status: 'active',
    joinedDaysAgo: 45,
  },
  {
    index: 11,
    name: 'Isabella Rivera',
    email: 'isabella.rivera@clockwise.test',
    status: 'active',
    joinedDaysAgo: 40,
  },
  {
    index: 12,
    name: 'Raj Kapoor',
    email: 'raj.kapoor@clockwise.test',
    status: 'active',
    joinedDaysAgo: 35,
  },
  {
    index: 13,
    name: 'Emma Lindqvist',
    email: 'emma.lindqvist@clockwise.test',
    status: 'active',
    joinedDaysAgo: 25,
  },
  {
    index: 14,
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@clockwise.test',
    status: 'active',
    joinedDaysAgo: 15,
  },
  {
    index: 15,
    name: 'Aisha Hassan',
    email: 'aisha.hassan@clockwise.test',
    status: 'active',
    joinedDaysAgo: 7,
  },

  // Pending users — invited recently, not yet accepted
  {
    index: 16,
    name: 'Clara Fischer',
    email: 'clara.fischer@clockwise.test',
    status: 'pending',
    joinedDaysAgo: 3,
  },
  {
    index: 17,
    name: 'Omar Al-Rashid',
    email: 'omar.alrashid@clockwise.test',
    status: 'pending',
    joinedDaysAgo: 2,
  },
  {
    index: 18,
    name: 'Hannah Brooks',
    email: 'hannah.brooks@clockwise.test',
    status: 'pending',
    joinedDaysAgo: 2,
  },
  {
    index: 19,
    name: 'Tomas Novak',
    email: 'tomas.novak@clockwise.test',
    status: 'pending',
    joinedDaysAgo: 1,
  },
  {
    index: 20,
    name: 'Mei-Lin Wu',
    email: 'meilin.wu@clockwise.test',
    status: 'pending',
    joinedDaysAgo: 1,
  },
];

const TEAMS = [
  {
    index: 1,
    name: 'Engineering',
    description: 'Backend, frontend, and infrastructure development',
  },
  { index: 2, name: 'Design', description: 'UI/UX design and user research' },
  { index: 3, name: 'Product', description: 'Product management and strategy' },
  { index: 4, name: 'Marketing', description: 'Growth, content, and brand marketing' },
  { index: 5, name: 'QA', description: 'Quality assurance and test automation' },
];

// Manager is first, rest are members. Index refers to user index.
const TEAM_MEMBERS: Record<number, { manager: number; members: number[] }> = {
  1: { manager: 4, members: [5, 7, 8, 10, 14, 1] }, // Engineering — Sofia manages; David (deactivated) was here
  2: { manager: 6, members: [9, 11, 13, 2] }, // Design — Priya manages; Natalia (deactivated) was here
  3: { manager: 7, members: [4, 6, 12, 15] }, // Product — James manages; Sofia & Priya also on Product
  4: { manager: 9, members: [11, 13, 14, 3] }, // Marketing — Amara manages; Samuel (deactivated) was here
  5: { manager: 8, members: [5, 10, 12, 15] }, // QA — Yuki manages; Marcus & Liam also on QA
};

// Pending users' future team assignments (via InvitationTeamAssignment)
const PENDING_TEAM_ASSIGNMENTS: Record<
  number,
  { teamIndex: number; role: 'manager' | 'member' }[]
> = {
  16: [{ teamIndex: 1, role: 'member' }], // Clara → Engineering
  17: [
    { teamIndex: 2, role: 'member' },
    { teamIndex: 3, role: 'member' },
  ], // Omar → Design + Product
  18: [{ teamIndex: 4, role: 'member' }], // Hannah → Marketing
  19: [
    { teamIndex: 1, role: 'member' },
    { teamIndex: 5, role: 'member' },
  ], // Tomas → Engineering + QA
  20: [{ teamIndex: 2, role: 'member' }], // Mei-Lin → Design
};

const PROJECTS = [
  {
    index: 1,
    name: 'Mobile App Redesign',
    description: 'Complete redesign of the mobile application for iOS and Android',
    ownerIndex: 4,
  },
  {
    index: 2,
    name: 'API Platform v2',
    description: 'Next generation REST API with improved performance and new endpoints',
    ownerIndex: 4,
  },
  {
    index: 3,
    name: 'Customer Dashboard',
    description: 'Self-service analytics dashboard for enterprise customers',
    ownerIndex: 6,
  },
  {
    index: 4,
    name: 'Marketing Website',
    description: 'New company website with updated branding and content',
    ownerIndex: 9,
  },
  {
    index: 5,
    name: 'Automated Test Suite',
    description: 'End-to-end test automation framework and CI integration',
    ownerIndex: 8,
  },
  {
    index: 6,
    name: 'Design System',
    description: 'Shared component library and design tokens',
    ownerIndex: 6,
  },
];

// Project members by user index
const PROJECT_MEMBERS: Record<number, number[]> = {
  1: [4, 5, 7, 8, 11, 1], // Mobile App: Sofia, Marcus, James, Yuki, Isabella, David(deactivated)
  2: [4, 5, 10, 14], // API Platform: Sofia, Marcus, Liam, Carlos
  3: [6, 9, 11, 13, 2], // Customer Dashboard: Priya, Amara, Isabella, Emma, Natalia(deactivated)
  4: [9, 11, 13, 14, 3], // Marketing Website: Amara, Isabella, Emma, Carlos, Samuel(deactivated)
  5: [8, 5, 10, 12], // Test Suite: Yuki, Marcus, Liam, Raj
  6: [6, 9, 11, 15], // Design System: Priya, Amara, Isabella, Aisha
};

const TASKS: { projectIndex: number; label: string }[] = [
  // Mobile App Redesign
  { projectIndex: 1, label: 'Navigation overhaul' },
  { projectIndex: 1, label: 'Push notification system' },
  { projectIndex: 1, label: 'Offline mode support' },
  { projectIndex: 1, label: 'Performance profiling' },
  // API Platform v2
  { projectIndex: 2, label: 'Auth middleware rewrite' },
  { projectIndex: 2, label: 'Rate limiting implementation' },
  { projectIndex: 2, label: 'API documentation generation' },
  // Customer Dashboard
  { projectIndex: 3, label: 'Chart components' },
  { projectIndex: 3, label: 'Data export module' },
  { projectIndex: 3, label: 'Real-time updates' },
  { projectIndex: 3, label: 'Access control setup' },
  // Marketing Website
  { projectIndex: 4, label: 'Landing page design' },
  { projectIndex: 4, label: 'Blog integration' },
  { projectIndex: 4, label: 'SEO optimization' },
  // Automated Test Suite
  { projectIndex: 5, label: 'Test runner configuration' },
  { projectIndex: 5, label: 'Visual regression tests' },
  { projectIndex: 5, label: 'CI pipeline integration' },
  { projectIndex: 5, label: 'Flaky test detection' },
  // Design System
  { projectIndex: 6, label: 'Color token system' },
  { projectIndex: 6, label: 'Form components' },
  { projectIndex: 6, label: 'Accessibility audit' },
];

const TIME_LOG_NOTES = [
  'Reviewed PR feedback and made adjustments',
  'Debugging intermittent test failure',
  'Pair programming session with team',
  'Refactored component structure',
  'Set up local dev environment',
  'Wrote unit tests for new feature',
  'Sprint planning and estimation',
  'Code review and documentation',
  'Investigated production issue',
  'Implemented requested changes',
  'Design review meeting',
  'Updated API contracts',
  'Fixed accessibility issues',
  'Performance optimization pass',
  'Database query tuning',
  null, // some entries have no notes
  null,
  null,
];

// Revoked invitation emails (never became users)
const REVOKED_INVITATIONS = [
  { email: 'alex.wong@clockwise.test', daysAgo: 30 },
  { email: 'jordan.smith@clockwise.test', daysAgo: 28 },
  { email: 'taylor.jones@clockwise.test', daysAgo: 25 },
];

// ── Main seed functions ──────────────────────────────────────────────────────

async function main() {
  // Always create the org
  await prisma.organization.upsert({
    where: { id: DEFAULT_ORG_ID },
    update: {},
    create: {
      id: DEFAULT_ORG_ID,
      name: 'Default Organization',
      settings: {
        expectedHoursPerWeek: 40,
        dailyWarningThreshold: 12,
        weeklyWarningThreshold: 60,
        dateFormat: 'YYYY-MM-DD',
        csvMaxRows: 5000,
      },
    },
  });

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        orgId: DEFAULT_ORG_ID,
        email: adminEmail,
        name: 'Admin',
        isAdmin: true,
        status: 'pending',
      },
    });
    console.log(`Admin user ensured (${adminEmail}).`);
  } else {
    console.log('Set ADMIN_EMAIL to create an initial admin user.');
  }

  if (process.env.NODE_ENV === 'production') {
    console.log('Skipping test data in production.');
    return;
  }

  if (!adminEmail) {
    throw new Error('ADMIN_EMAIL is required to seed test data (used as invitation sender).');
  }

  const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminUser) {
    throw new Error(`Admin user not found for email: ${adminEmail}`);
  }

  await seedTestData(adminUser.id);
  console.log('Test data seeded successfully.');
}

async function seedTestData(adminUserId: string) {
  // ── Users ──────────────────────────────────────────────────────────────────
  console.log('Seeding users...');
  for (const u of USERS) {
    const createdAt = daysAgo(u.joinedDaysAgo);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        id: uid('10000000', u.index),
        orgId: DEFAULT_ORG_ID,
        email: u.email,
        name: u.name,
        status: u.status,
        lastLoginAt: u.status === 'active' ? daysAgo(Math.floor(Math.random() * 3)) : null,
        createdAt,
        updatedAt: u.status === 'deactivated' ? daysAgo(14) : createdAt,
      },
    });
  }

  // ── Teams ──────────────────────────────────────────────────────────────────
  console.log('Seeding teams...');
  for (const t of TEAMS) {
    await prisma.team.upsert({
      where: { orgId_name: { orgId: DEFAULT_ORG_ID, name: t.name } },
      update: {},
      create: {
        id: uid('20000000', t.index),
        orgId: DEFAULT_ORG_ID,
        name: t.name,
        description: t.description,
      },
    });
  }

  // ── Team members ───────────────────────────────────────────────────────────
  console.log('Seeding team members...');
  let tmCounter = 0;
  for (const [teamIdx, { manager, members }] of Object.entries(TEAM_MEMBERS)) {
    tmCounter++;
    await prisma.teamMember.upsert({
      where: {
        teamId_userId: {
          teamId: uid('20000000', Number(teamIdx)),
          userId: uid('10000000', manager),
        },
      },
      update: {},
      create: {
        id: uid('30000000', tmCounter),
        teamId: uid('20000000', Number(teamIdx)),
        userId: uid('10000000', manager),
        role: 'manager',
      },
    });

    for (const memberIdx of members) {
      tmCounter++;
      await prisma.teamMember.upsert({
        where: {
          teamId_userId: {
            teamId: uid('20000000', Number(teamIdx)),
            userId: uid('10000000', memberIdx),
          },
        },
        update: {},
        create: {
          id: uid('30000000', tmCounter),
          teamId: uid('20000000', Number(teamIdx)),
          userId: uid('10000000', memberIdx),
          role: 'member',
        },
      });
    }
  }

  // ── Projects ───────────────────────────────────────────────────────────────
  console.log('Seeding projects...');
  for (const p of PROJECTS) {
    await prisma.project.upsert({
      where: { id: uid('40000000', p.index) },
      update: {},
      create: {
        id: uid('40000000', p.index),
        orgId: DEFAULT_ORG_ID,
        name: p.name,
        description: p.description,
        ownerId: uid('10000000', p.ownerIndex),
      },
    });
  }

  // ── Project members ────────────────────────────────────────────────────────
  console.log('Seeding project members...');
  let pmCounter = 0;
  for (const [projIdx, memberIndices] of Object.entries(PROJECT_MEMBERS)) {
    for (const userIdx of memberIndices) {
      pmCounter++;
      await prisma.projectMember.upsert({
        where: {
          projectId_userId: {
            projectId: uid('40000000', Number(projIdx)),
            userId: uid('10000000', userIdx),
          },
        },
        update: {},
        create: {
          id: uid('50000000', pmCounter),
          projectId: uid('40000000', Number(projIdx)),
          userId: uid('10000000', userIdx),
        },
      });
    }
  }

  // ── Tasks ──────────────────────────────────────────────────────────────────
  console.log('Seeding tasks...');
  for (let i = 0; i < TASKS.length; i++) {
    const t = TASKS[i];
    const taskId = uid('60000000', i + 1);
    // Use the project owner as task creator
    const project = PROJECTS.find((p) => p.index === t.projectIndex)!;
    await prisma.task.upsert({
      where: { id: taskId },
      update: {},
      create: {
        id: taskId,
        projectId: uid('40000000', t.projectIndex),
        label: t.label,
        labelNormalized: t.label.toLowerCase().replace(/\s+/g, '-'),
        createdBy: uid('10000000', project.ownerIndex),
      },
    });
  }

  // ── Time logs ──────────────────────────────────────────────────────────────
  console.log('Seeding time logs...');
  let tlCounter = 0;
  const seededRng = createSeededRng(42);

  for (const [projIdx, memberIndices] of Object.entries(PROJECT_MEMBERS)) {
    const projectTasks = TASKS.map((t, i) => ({ ...t, taskIndex: i + 1 })).filter(
      (t) => t.projectIndex === Number(projIdx),
    );
    if (projectTasks.length === 0) continue;

    for (const userIdx of memberIndices) {
      const user = USERS.find((u) => u.index === userIdx)!;
      // Skip pending users
      if (user.status === 'pending') continue;

      // Deactivated users: logs from join to 14 days ago
      // Active users: logs from join to today
      const startDay = user.joinedDaysAgo;
      const endDay = user.status === 'deactivated' ? 14 : 0;

      // Create 2-5 time log entries per user per project
      const entryCount = 2 + Math.floor(seededRng() * 4);
      for (let e = 0; e < entryCount; e++) {
        tlCounter++;
        const logDay = endDay + Math.floor(seededRng() * (startDay - endDay));
        const task = projectTasks[Math.floor(seededRng() * projectTasks.length)];
        const hours = (1 + Math.floor(seededRng() * 15)) * 0.5; // 0.5 to 8.0 in 0.5 increments
        const note = TIME_LOG_NOTES[Math.floor(seededRng() * TIME_LOG_NOTES.length)];

        await prisma.timeLog.upsert({
          where: { id: uid('70000000', tlCounter) },
          update: {},
          create: {
            id: uid('70000000', tlCounter),
            userId: uid('10000000', userIdx),
            projectId: uid('40000000', Number(projIdx)),
            taskId: uid('60000000', task.taskIndex),
            date: daysAgo(logDay),
            hours: hours,
            notes: note,
          },
        });
      }
    }
  }

  // ── Invitations ─────────────────────────────────────────────────────────────
  console.log('Seeding invitations...');
  let invCounter = 0;
  let itaCounter = 0; // separate counter for InvitationTeamAssignment IDs

  // Accepted invitations — for active + deactivated users
  for (const u of USERS.filter((u) => u.status === 'active' || u.status === 'deactivated')) {
    invCounter++;
    const invId = uid('80000000', invCounter);
    const invitedDaysAgo = u.joinedDaysAgo + 2; // invited 2 days before joining
    await prisma.invitation.upsert({
      where: { id: invId },
      update: {},
      create: {
        id: invId,
        orgId: DEFAULT_ORG_ID,
        email: u.email,
        invitedBy: adminUserId,
        token: `accepted-token-${u.index}-${randomToken().slice(0, 16)}`,
        expiresAt: daysAgo(invitedDaysAgo - 7), // expired (already accepted)
        status: 'accepted',
        createdAt: daysAgo(invitedDaysAgo),
      },
    });

    const teamAssignments = getTeamAssignmentsForUser(u.index);
    for (const ta of teamAssignments) {
      itaCounter++;
      await prisma.invitationTeamAssignment.upsert({
        where: {
          invitationId_teamId: {
            invitationId: invId,
            teamId: uid('20000000', ta.teamIndex),
          },
        },
        update: {},
        create: {
          id: uid('90000000', itaCounter),
          invitationId: invId,
          teamId: uid('20000000', ta.teamIndex),
          role: ta.role,
        },
      });
    }
  }

  // Pending invitations — for pending users (valid tokens, future expiry)
  for (const u of USERS.filter((u) => u.status === 'pending')) {
    invCounter++;
    const invId = uid('80000000', invCounter);
    await prisma.invitation.upsert({
      where: { id: invId },
      update: {},
      create: {
        id: invId,
        orgId: DEFAULT_ORG_ID,
        email: u.email,
        invitedBy: adminUserId,
        token: `pending-token-${u.index}-${randomToken().slice(0, 16)}`,
        expiresAt: daysAgo(-7), // expires 7 days from now (in the future)
        status: 'pending',
        createdAt: daysAgo(u.joinedDaysAgo),
      },
    });

    const assignments = PENDING_TEAM_ASSIGNMENTS[u.index] || [];
    for (const ta of assignments) {
      itaCounter++;
      await prisma.invitationTeamAssignment.upsert({
        where: {
          invitationId_teamId: {
            invitationId: invId,
            teamId: uid('20000000', ta.teamIndex),
          },
        },
        update: {},
        create: {
          id: uid('90000000', itaCounter),
          invitationId: invId,
          teamId: uid('20000000', ta.teamIndex),
          role: ta.role,
        },
      });
    }
  }

  // Revoked invitations — emails that never became users
  for (let i = 0; i < REVOKED_INVITATIONS.length; i++) {
    invCounter++;
    const ri = REVOKED_INVITATIONS[i];
    const invId = uid('80000000', invCounter);
    await prisma.invitation.upsert({
      where: { id: invId },
      update: {},
      create: {
        id: invId,
        orgId: DEFAULT_ORG_ID,
        email: ri.email,
        invitedBy: adminUserId,
        token: `revoked-token-${i}-${randomToken().slice(0, 16)}`,
        expiresAt: daysAgo(ri.daysAgo - 7),
        status: 'revoked',
        createdAt: daysAgo(ri.daysAgo),
      },
    });

    itaCounter++;
    await prisma.invitationTeamAssignment.upsert({
      where: {
        invitationId_teamId: {
          invitationId: invId,
          teamId: uid('20000000', (i % TEAMS.length) + 1),
        },
      },
      update: {},
      create: {
        id: uid('90000000', itaCounter),
        invitationId: invId,
        teamId: uid('20000000', (i % TEAMS.length) + 1),
        role: 'member',
      },
    });
  }

  console.log(
    `Seeded: ${USERS.length} users, ${TEAMS.length} teams, ${PROJECTS.length} projects, ${TASKS.length} tasks, ${tlCounter} time logs, ${invCounter} invitations, ${itaCounter} team assignments`,
  );
}

// ── Utility functions ────────────────────────────────────────────────────────

function getTeamAssignmentsForUser(
  userIndex: number,
): { teamIndex: number; role: 'manager' | 'member' }[] {
  const assignments: { teamIndex: number; role: 'manager' | 'member' }[] = [];
  for (const [teamIdx, { manager, members }] of Object.entries(TEAM_MEMBERS)) {
    if (manager === userIndex) {
      assignments.push({ teamIndex: Number(teamIdx), role: 'manager' });
    } else if (members.includes(userIndex)) {
      assignments.push({ teamIndex: Number(teamIdx), role: 'member' });
    }
  }
  return assignments;
}

function createSeededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// ── Run ──────────────────────────────────────────────────────────────────────

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
