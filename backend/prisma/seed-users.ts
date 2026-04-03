import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { TEAMS, USERS, SeedUserDef } from './seed-users-data';

const prisma = new PrismaClient();

const ORG_ID = '00000000-0000-4000-a000-000000000001';
const BASE_DATE = new Date('2024-03-01T09:00:00Z');
const INVITE_EXPIRY_DAYS = 7;

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function avatarUrl(name: string): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
}

async function main() {
  // ── Step 0: Idempotency check ─────────────────────────────────────────
  const existing = await prisma.user.findFirst({
    where: { email: { endsWith: '@clockwise.test' } },
  });
  if (existing) {
    console.log('Seed users already exist — skipping. Delete @clockwise.test users to re-seed.');
    return;
  }

  // ── Step 1: Admin lookup & activation ─────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    throw new Error('ADMIN_EMAIL env var is required. Run `pnpm prisma db seed` first.');
  }
  const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    throw new Error(`Admin user not found (${adminEmail}). Run \`pnpm prisma db seed\` first.`);
  }

  if (admin.status === 'pending') {
    await prisma.user.update({
      where: { id: admin.id },
      data: { status: 'active', name: 'Admin' },
    });
    console.log('Admin user activated.');
  }

  // ── Step 2: Create teams ──────────────────────────────────────────────
  const teamMap: Array<{ id: string; name: string }> = [];
  for (const t of TEAMS) {
    const team = await prisma.team.upsert({
      where: { orgId_name: { orgId: ORG_ID, name: t.name } },
      update: {},
      create: { orgId: ORG_ID, name: t.name, description: t.description },
    });
    teamMap.push({ id: team.id, name: team.name });
  }
  console.log(`Teams: ${teamMap.length} ensured.`);

  // ── Step 3: Create pending users + invitations ────────────────────────
  const userRecords: Array<{
    def: SeedUserDef;
    userId: string;
    inviteDate: Date;
  }> = [];

  for (const def of USERS) {
    const inviteDate = addDays(BASE_DATE, def.inviteDateOffset);

    // Create pending user
    const user = await prisma.user.create({
      data: {
        orgId: ORG_ID,
        email: def.email,
        name: def.email, // Matches real createPendingUser pattern
        status: 'pending',
      },
    });

    // Backdate created_at / updated_at
    await prisma.$executeRawUnsafe(
      `UPDATE "user" SET created_at = $1, updated_at = $1 WHERE id = $2`,
      inviteDate,
      user.id,
    );

    // Create invitation with team assignments
    const token = randomBytes(32).toString('hex');
    const expiresAt = addDays(inviteDate, INVITE_EXPIRY_DAYS);
    const invitationStatus = def.outcome === 'accepted' ? 'accepted' : 'sent';

    await prisma.invitation.create({
      data: {
        orgId: ORG_ID,
        email: def.email,
        invitedBy: admin.id,
        token,
        expiresAt,
        status: invitationStatus,
        createdAt: inviteDate,
        teamAssignments: {
          create: def.teamAssignments.map((ta) => ({
            teamId: teamMap[ta.teamIndex].id,
            role: ta.role,
          })),
        },
      },
    });

    userRecords.push({ def, userId: user.id, inviteDate });
  }
  console.log(`Users: ${userRecords.length} pending users + invitations created.`);

  // ── Step 4: Activate accepted users + create team memberships ─────────
  const acceptedUsers = userRecords.filter((r) => r.def.outcome === 'accepted');
  let membershipCount = 0;

  for (const rec of acceptedUsers) {
    const acceptDate = addDays(rec.inviteDate, rec.def.acceptDelayDays!);

    // Activate user
    await prisma.user.update({
      where: { id: rec.userId },
      data: {
        status: 'active',
        name: rec.def.name,
        avatarUrl: avatarUrl(rec.def.name),
        lastLoginAt: acceptDate,
      },
    });

    // Backdate updated_at to accept date
    await prisma.$executeRawUnsafe(
      `UPDATE "user" SET updated_at = $1 WHERE id = $2`,
      acceptDate,
      rec.userId,
    );

    // Create team memberships
    for (const ta of rec.def.teamAssignments) {
      await prisma.teamMember.create({
        data: {
          teamId: teamMap[ta.teamIndex].id,
          userId: rec.userId,
          role: ta.role,
          createdAt: acceptDate,
        },
      });
      membershipCount++;
    }
  }
  console.log(`Activated: ${acceptedUsers.length} users, ${membershipCount} team memberships.`);

  // ── Step 5: Batch-insert audit logs ───────────────────────────────────
  const auditLogs: Array<{
    orgId: string;
    entityType: string;
    entityId: string;
    action: string;
    performedBy: string;
    metadata: object;
    createdAt: Date;
  }> = [];

  for (const rec of userRecords) {
    // user.created
    auditLogs.push({
      orgId: ORG_ID,
      entityType: 'user',
      entityId: rec.userId,
      action: 'created',
      performedBy: admin.id,
      metadata: { after: { email: rec.def.email, status: 'pending' } },
      createdAt: rec.inviteDate,
    });

    if (rec.def.outcome === 'accepted') {
      const acceptDate = addDays(rec.inviteDate, rec.def.acceptDelayDays!);

      // user.activated
      auditLogs.push({
        orgId: ORG_ID,
        entityType: 'user',
        entityId: rec.userId,
        action: 'activated',
        performedBy: 'system',
        metadata: {
          before: { status: 'pending' },
          after: { status: 'active', name: rec.def.name },
        },
        createdAt: acceptDate,
      });

      // member_added — dual audit logs per team assignment
      for (const ta of rec.def.teamAssignments) {
        const team = teamMap[ta.teamIndex];
        const meta = {
          after: {
            userId: rec.userId,
            userName: rec.def.name,
            role: ta.role,
            teamId: team.id,
            teamName: team.name,
          },
        };

        auditLogs.push({
          orgId: ORG_ID,
          entityType: 'team',
          entityId: team.id,
          action: 'member_added',
          performedBy: 'system',
          metadata: meta,
          createdAt: acceptDate,
        });

        auditLogs.push({
          orgId: ORG_ID,
          entityType: 'user',
          entityId: rec.userId,
          action: 'member_added',
          performedBy: 'system',
          metadata: meta,
          createdAt: acceptDate,
        });
      }
    }
  }

  await prisma.auditLog.createMany({ data: auditLogs as any });
  console.log(`Audit logs: ${auditLogs.length} entries created.`);

  // ── Step 6: Summary ───────────────────────────────────────────────────
  const active = userRecords.filter((r) => r.def.outcome === 'accepted').length;
  const pending = userRecords.filter((r) => r.def.outcome === 'expired').length;
  console.log('\n── Seed Summary ──');
  console.log(`  Teams:        ${teamMap.length}`);
  console.log(`  Users:        ${userRecords.length} (${active} active, ${pending} pending/expired)`);
  console.log(`  Invitations:  ${userRecords.length} (${active} accepted, ${pending} sent/expired)`);
  console.log(`  Memberships:  ${membershipCount}`);
  console.log(`  Audit logs:   ${auditLogs.length}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
