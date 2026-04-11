import { Plus } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { RelatedProjectsSection } from "@/components/admin/related-projects-section";
import { AddMemberSheet } from "@/components/admin/teams/add-member-sheet";
import { EditTeamSheet } from "@/components/admin/teams/edit-team-sheet";
import { TeamInfoCard } from "@/components/admin/teams/team-info-card";
import { TeamMembersTable } from "@/components/admin/teams/team-members-table";
import { AuditTimeline } from "@/components/audit-logs/audit-timeline";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useAuth } from "@/lib/auth/use-auth";
import { useProjects } from "@/lib/projects/use-projects";
import type { TeamRole } from "@/lib/teams/types";
import { useArchiveTeam } from "@/lib/teams/use-archive-team";
import { useRemoveTeamMember } from "@/lib/teams/use-remove-team-member";
import { useTeamDetail } from "@/lib/teams/use-team-detail";
import { useUnarchiveTeam } from "@/lib/teams/use-unarchive-team";
import { useUpdateTeamMember } from "@/lib/teams/use-update-team-member";

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.isAdmin ?? false;
  const { data: team, isLoading } = useTeamDetail(id ?? "");
  useDocumentTitle(team ? `Clockwise - ${team.name}` : "Clockwise - Team");
  const archiveTeam = useArchiveTeam();
  const unarchiveTeam = useUnarchiveTeam();
  const updateMember = useUpdateTeamMember();
  const removeMember = useRemoveTeamMember();

  const [editOpen, setEditOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "archive" | "unarchive" | null
  >(null);
  const [projectsPage, setProjectsPage] = useState(1);
  const [showArchivedProjects, setShowArchivedProjects] = useState(false);

  const { data: projectsData, isLoading: projectsLoading } = useProjects({
    teamId: id,
    page: projectsPage,
    limit: 5,
    includeArchived: showArchivedProjects,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!team) {
    return (
      <p className="py-12 text-center text-muted-foreground">Team not found.</p>
    );
  }

  const handleChangeRole = (userId: string, role: TeamRole) => {
    updateMember.mutate({ teamId: team.id, userId, payload: { role } });
  };

  const handleRemove = (userId: string) => {
    removeMember.mutate({ teamId: team.id, userId });
  };

  const handleConfirm = () => {
    if (confirmAction === "archive") {
      archiveTeam.mutate(team.id, { onSuccess: () => setConfirmAction(null) });
    } else if (confirmAction === "unarchive") {
      unarchiveTeam.mutate(team.id, {
        onSuccess: () => setConfirmAction(null),
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={team.name}
        breadcrumbs={[{ label: "Teams", href: "/teams" }, { label: team.name }]}
      />

      {isAdmin ? (
        <TeamInfoCard
          team={team}
          onEdit={() => setEditOpen(true)}
          onArchive={() => setConfirmAction("archive")}
          onUnarchive={() => setConfirmAction("unarchive")}
        />
      ) : (
        <TeamInfoCard team={team} readOnly />
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Members</h2>
        {isAdmin && !team.isArchived && (
          <Button size="sm" onClick={() => setAddMemberOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Member
          </Button>
        )}
      </div>

      <TeamMembersTable
        members={team.members}
        onChangeRole={handleChangeRole}
        onRemove={handleRemove}
        readOnly={!isAdmin || team.isArchived}
        removePending={removeMember.isPending}
        roleChangePendingUserId={
          updateMember.isPending ? updateMember.variables?.userId : undefined
        }
      />

      <RelatedProjectsSection
        data={projectsData?.data ?? []}
        total={projectsData?.total ?? 0}
        page={projectsPage}
        totalPages={
          projectsData ? Math.ceil(projectsData.total / projectsData.limit) : 0
        }
        isLoading={projectsLoading}
        onPageChange={setProjectsPage}
        showArchived={showArchivedProjects}
        onShowArchivedChange={(v) => {
          setShowArchivedProjects(v);
          setProjectsPage(1);
        }}
      />

      {isAdmin && <AuditTimeline entityType="team" entityId={team.id} />}

      {isAdmin && (
        <>
          <EditTeamSheet
            team={team}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
          <AddMemberSheet
            teamId={team.id}
            existingMembers={team.members}
            open={addMemberOpen}
            onOpenChange={setAddMemberOpen}
          />

          <ConfirmDialog
            open={confirmAction !== null}
            onOpenChange={(open) => !open && setConfirmAction(null)}
            title={
              confirmAction === "archive" ? "Archive Team" : "Unarchive Team"
            }
            description={
              confirmAction === "archive"
                ? `Are you sure you want to archive ${team.name}? Members will lose access to this team.`
                : `Are you sure you want to unarchive ${team.name}? Members will regain access to this team.`
            }
            confirmLabel={confirmAction === "archive" ? "Archive" : "Unarchive"}
            variant={confirmAction === "archive" ? "destructive" : "default"}
            onConfirm={handleConfirm}
            isPending={archiveTeam.isPending || unarchiveTeam.isPending}
          />
        </>
      )}
    </div>
  );
}
