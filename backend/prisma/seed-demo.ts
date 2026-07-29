import { randomUUID } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import {
  DEMO_ACCOUNT_MEMBERSHIPS,
  DEMO_ACCOUNTS,
  DEMO_ANOMALY_EMAILS,
  DEMO_ORG_ID,
  DEMO_PROJECTS,
  DEMO_TEAMMATES,
  DEMO_TEAMS,
  type DemoRoleKey,
} from "./seed-demo-data";

const prisma = new PrismaClient();

// `--reset` forces a full wipe + rebuild. Without it the script is a no-op when
// the demo org already has data, so the dev entrypoint can run it on every boot
// without discarding in-flight demo exploration.
const RESET = process.argv.includes("--reset");

const LOG_WINDOW_DAYS = 84; // ~12 weeks
// createdAt delay bands (in days) cycled by user index → drives the
// logging-delay report and heatmap gradients.
const DELAY_BANDS: Array<[number, number]> = [
  [0, 1],
  [1, 3],
  [3, 6],
  [6, 10],
];

function avatarUrl(name: string): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

// A logged-in demo persona or a supporting teammate, with the metadata the
// time-log generator needs.
interface DemoUserRecord {
  id: string;
  teamIndexes: number[];
  isDemo: boolean;
  delayBand: [number, number];
  anomaly: boolean;
}

// All rows for one demo org, computed in memory before any DB write so the
// persistence step is a single, atomic transaction of batched inserts.
interface SeedData {
  teams: Prisma.TeamCreateManyInput[];
  users: Prisma.UserCreateManyInput[];
  memberships: Prisma.TeamMemberCreateManyInput[];
  projects: Prisma.ProjectCreateManyInput[];
  projectTeams: Prisma.ProjectTeamCreateManyInput[];
  tasks: Prisma.TaskCreateManyInput[];
  timeLogs: Prisma.TimeLogCreateManyInput[];
  timeLogTasks: Prisma.TimeLogTaskCreateManyInput[];
}

function buildSeedData(): SeedData {
  const personaOrder: DemoRoleKey[] = ["admin", "manager", "member"];
  const managerId = DEMO_ACCOUNTS.manager.id;

  // ── Teams ───────────────────────────────────────────────────────────────
  const teamIds = DEMO_TEAMS.map(() => randomUUID());
  const teams: Prisma.TeamCreateManyInput[] = DEMO_TEAMS.map((t, i) => ({
    id: teamIds[i],
    orgId: DEMO_ORG_ID,
    name: t.name,
    description: t.description,
  }));

  // ── Users (3 personas + teammates) ───────────────────────────────────────
  const users: Prisma.UserCreateManyInput[] = [];
  const userRecords: DemoUserRecord[] = [];

  for (const key of personaOrder) {
    const acct = DEMO_ACCOUNTS[key];
    users.push({
      id: acct.id,
      orgId: DEMO_ORG_ID,
      email: acct.email,
      name: acct.name,
      avatarUrl: avatarUrl(acct.name),
      isAdmin: acct.isAdmin,
      status: "active",
    });
    userRecords.push({
      id: acct.id,
      teamIndexes: DEMO_ACCOUNT_MEMBERSHIPS[key].map((m) => m.teamIndex),
      isDemo: true,
      delayBand: DELAY_BANDS[userRecords.length % DELAY_BANDS.length],
      anomaly: false,
    });
  }

  for (const tm of DEMO_TEAMMATES) {
    const id = randomUUID();
    users.push({
      id,
      orgId: DEMO_ORG_ID,
      email: tm.email,
      name: tm.name,
      avatarUrl: avatarUrl(tm.name),
      isAdmin: false,
      status: "active",
    });
    userRecords.push({
      id,
      teamIndexes: [tm.teamIndex],
      isDemo: false,
      delayBand: DELAY_BANDS[userRecords.length % DELAY_BANDS.length],
      anomaly: Boolean(DEMO_ANOMALY_EMAILS[tm.email]),
    });
  }

  // ── Memberships ──────────────────────────────────────────────────────────
  const memberships: Prisma.TeamMemberCreateManyInput[] = [];
  for (const key of personaOrder) {
    for (const m of DEMO_ACCOUNT_MEMBERSHIPS[key]) {
      memberships.push({
        teamId: teamIds[m.teamIndex],
        userId: DEMO_ACCOUNTS[key].id,
        role: m.role,
      });
    }
  }
  DEMO_TEAMMATES.forEach((tm, i) => {
    memberships.push({
      teamId: teamIds[tm.teamIndex],
      // personas occupy the first 3 user slots.
      userId: users[personaOrder.length + i].id as string,
      role: tm.role,
    });
  });

  // ── Projects + tasks ─────────────────────────────────────────────────────
  const projects: Prisma.ProjectCreateManyInput[] = [];
  const projectTeams: Prisma.ProjectTeamCreateManyInput[] = [];
  const tasks: Prisma.TaskCreateManyInput[] = [];
  const projectRecords: Array<{
    id: string;
    status: "active" | "archived";
    teamIndexes: number[];
    taskIds: string[];
  }> = [];

  for (const p of DEMO_PROJECTS) {
    const projectId = randomUUID();
    projects.push({
      id: projectId,
      orgId: DEMO_ORG_ID,
      name: p.name,
      description: p.description,
      status: p.status,
    });
    for (const ti of p.teamIndexes) {
      projectTeams.push({ projectId, teamId: teamIds[ti] });
    }
    const taskIds = p.tasks.map(() => randomUUID());
    p.tasks.forEach((label, i) => {
      tasks.push({
        id: taskIds[i],
        projectId,
        label,
        labelNormalized: label.toLowerCase(),
        createdBy: managerId,
      });
    });
    projectRecords.push({
      id: projectId,
      status: p.status,
      teamIndexes: p.teamIndexes,
      taskIds,
    });
  }

  // ── Time logs over the trailing window ───────────────────────────────────
  const now = new Date();
  const todayUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  const timeLogs: Prisma.TimeLogCreateManyInput[] = [];
  const timeLogTasks: Prisma.TimeLogTaskCreateManyInput[] = [];

  for (const user of userRecords) {
    // Active projects reachable through any of the user's teams.
    const reachable = projectRecords.filter(
      (p) =>
        p.status === "active" &&
        p.teamIndexes.some((ti) => user.teamIndexes.includes(ti)),
    );
    if (reachable.length === 0) continue;

    let projCursor = 0;
    let taskCursor = 0;
    const dailyProb = user.isDemo ? 0.9 : 0.85;

    for (let offset = LOG_WINDOW_DAYS; offset >= 0; offset--) {
      const day = addDays(todayUTC, -offset);
      const dow = day.getUTCDay();
      if (dow === 0 || dow === 6) continue; // skip weekends
      if (Math.random() >= dailyProb) continue;

      const logsToday = Math.random() < 0.15 ? 2 : 1;
      for (let i = 0; i < logsToday; i++) {
        const project = reachable[projCursor++ % reachable.length];
        const taskId = project.taskIds[taskCursor++ % project.taskIds.length];

        let hours = 4 + Math.round(Math.random() * 8) / 2; // 4.0 – 8.0
        if (user.anomaly && Math.random() < 0.05) {
          hours = 13 + Math.round(Math.random() * 6) / 2; // 13.0 – 16.0
        }

        const delay = randInt(user.delayBand[0], user.delayBand[1]);
        const createdAt = new Date(
          Math.min(
            day.getTime() + delay * 86400000 + 10 * 3600000,
            now.getTime(),
          ),
        );

        const timeLogId = randomUUID();
        timeLogs.push({
          id: timeLogId,
          userId: user.id,
          projectId: project.id,
          date: day,
          hours,
          status: "active",
          createdAt,
        });
        timeLogTasks.push({ timeLogId, taskId });
      }
    }
  }

  return {
    teams,
    users,
    memberships,
    projects,
    projectTeams,
    tasks,
    timeLogs,
    timeLogTasks,
  };
}

// FK-safe deletion (children → parents), scoped to the demo org only.
async function wipeDemoOrg(tx: Prisma.TransactionClient): Promise<void> {
  const byProjectOrg = { project: { orgId: DEMO_ORG_ID } };
  await tx.timeLogTask.deleteMany({ where: { timeLog: byProjectOrg } });
  await tx.timeLog.deleteMany({ where: byProjectOrg });
  await tx.task.deleteMany({ where: byProjectOrg });
  await tx.projectTeam.deleteMany({ where: byProjectOrg });
  await tx.project.deleteMany({ where: { orgId: DEMO_ORG_ID } });
  await tx.teamMember.deleteMany({ where: { team: { orgId: DEMO_ORG_ID } } });
  await tx.invitationTeamAssignment.deleteMany({
    where: { invitation: { orgId: DEMO_ORG_ID } },
  });
  await tx.invitation.deleteMany({ where: { orgId: DEMO_ORG_ID } });
  await tx.auditLog.deleteMany({ where: { orgId: DEMO_ORG_ID } });
  await tx.user.deleteMany({ where: { orgId: DEMO_ORG_ID } });
  await tx.team.deleteMany({ where: { orgId: DEMO_ORG_ID } });
}

async function main() {
  const existing = await prisma.user.count({ where: { orgId: DEMO_ORG_ID } });
  if (existing > 0 && !RESET) {
    console.log(
      `Demo org already seeded (${existing} users); skipping. Use --reset to rebuild.`,
    );
    return;
  }

  const data = buildSeedData();

  // One atomic transaction: wipe + rebuild, so a mid-run failure never leaves a
  // half-populated demo org.
  await prisma.$transaction(
    async (tx) => {
      await wipeDemoOrg(tx);
      await tx.organization.upsert({
        where: { id: DEMO_ORG_ID },
        update: { name: "Clockwise Demo Co." },
        create: {
          id: DEMO_ORG_ID,
          name: "Clockwise Demo Co.",
          settings: {
            expectedHoursPerWeek: 40,
            dailyWarningThreshold: 12,
            weeklyWarningThreshold: 60,
            dateFormat: "YYYY-MM-DD",
            csvMaxRows: 5000,
          },
        },
      });
      await tx.team.createMany({ data: data.teams });
      await tx.user.createMany({ data: data.users });
      await tx.teamMember.createMany({ data: data.memberships });
      await tx.project.createMany({ data: data.projects });
      await tx.projectTeam.createMany({ data: data.projectTeams });
      await tx.task.createMany({ data: data.tasks });
      await tx.timeLog.createMany({ data: data.timeLogs });
      await tx.timeLogTask.createMany({ data: data.timeLogTasks });
    },
    { timeout: 120_000, maxWait: 15_000 },
  );

  console.log("\n── Demo Seed Summary ──");
  console.log(`  Org:          Clockwise Demo Co. (${DEMO_ORG_ID})`);
  console.log(`  Teams:        ${data.teams.length}`);
  console.log(`  Users:        ${data.users.length} (3 personas + teammates)`);
  console.log(`  Memberships:  ${data.memberships.length}`);
  console.log(`  Projects:     ${data.projects.length}`);
  console.log(`  Tasks:        ${data.tasks.length}`);
  console.log(`  Time logs:    ${data.timeLogs.length}`);
}

main()
  .catch((e) => {
    console.error("Demo seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
