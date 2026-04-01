# Projects & Teams

## Overview
Teams are the organizational unit for users. Projects are where work happens. Teams are assigned to projects via a many-to-many relationship (`ProjectTeam`). Users access projects through their team membership — there is no individual project membership or project owner.

---

## Teams

### Structure
- A team is a group of users within the organization.
- A team can have **multiple managers** and **multiple members**.
- A user can belong to **multiple teams** with different roles per team (Manager or Member).

### Team Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Name | string | Yes | Unique team name |
| Description | string | No | Brief description of the team |

### Team Management

| Action | Who can do it |
|--------|---------------|
| Create team | Admin |
| Edit team (name, description) | Admin |
| Delete/archive team | Admin |
| Add members to team | Admin |
| Remove members from team | Admin |
| Assign Manager role within team | Admin |

### Rules
- A team must have at least one manager.
- Deleting a team is a soft-delete (archive). Archived teams and their data remain for reporting but no new time can be logged.
- When a user is removed from a team, their existing time logs remain intact.

---

## Projects

### Structure
- A project can involve members from **multiple teams** via team assignments.
- There is **no project owner** — governance is role-based:
  - **Admins** can manage any project.
  - **Managers** can manage projects linked to their managed teams.
  - **Members** can view projects linked to their teams.
- Users access projects through their team membership (via the `ProjectTeam` join table).

### Project Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Name | string | Yes | Unique per org (among active projects) |
| Description | string | No | Brief description |
| Status | enum | Yes | `active` or `archived` |

### Project Management

| Action | Who can do it |
|--------|---------------|
| Create project (with at least 1 team) | Admin, Manager (own managed teams only) |
| Edit project (name, description) | Admin, Manager of a linked team |
| Archive project | Admin only |
| Unarchive project | Admin only |
| Assign team to project | Admin, Manager of the team being assigned (must also manage a linked team) |
| Remove team from project | Admin, Manager of the team being removed |

### Team Assignment
- Teams are assigned to projects, not individual users.
- A project must have **at least one team** at all times — the last team cannot be removed.
- When creating a project, at least one team must be selected. Managers can only select teams they manage; Admins can select any team.
- When a team is removed from a project, existing time logs from that team's members remain intact.

### Rules
- Archiving a project prevents new time logging but preserves all existing data.
- Active project names must be unique within the organization (enforced by partial unique index).
- A project must always have at least one assigned team.

---

## Cross-Team & Cross-Project Permissions

### Time Log Visibility & Editing

| Scenario | Can view time logs? | Can edit time logs? |
|----------|-------------------|-------------------|
| Admin → any user, any project | Yes | Yes |
| Manager → own team members (any project) | Yes | Yes |
| Member → self | Yes | Yes |
| Member → other members | No | No |

**Priority**: If a user qualifies through multiple roles (e.g., Manager in one team and Member in another), they get the union of permissions.

### Example
- User A is Manager of Team Alpha and Member of Team Beta.
- Project X has both Team Alpha and Team Beta assigned.
- User A can view/edit time logs of Team Alpha members in Project X (as their Manager).
- User A can only view/edit their own time logs as a Team Beta member.

---

## UI Views

### Team List (Admin)
- Table of all teams with name, member count, manager names.
- Actions: Create, Edit, Archive.

### Team Detail (Admin)
- Team info (name, description).
- Member list with roles (Manager/Member).
- Actions: Add/remove members, change roles.

### Project List
- **Admin**: Sees all projects. Can filter to include archived.
- **Manager**: Sees projects linked to their managed teams.
- **Member**: Sees projects linked to their teams.
- Columns: Name, Description, Teams count, Status badge, Actions.
- Actions (role-aware): Edit, Archive/Unarchive.

### Project Detail
- Project info card (name, description, status, teams count, created date).
- Assigned teams table with Name, Members count, Status, Remove button.
- Audit timeline showing project history.
- Actions (for Admin/Manager of linked team): Edit, Assign/Remove teams, Archive/Unarchive.

---

## Edge Cases
- **Project with one team**: The last team cannot be removed — at least one must remain.
- **User in no teams**: Can log in, sees empty project list. Dashboard shows prompt to contact admin.
- **All managers leave a team**: Admin is notified to assign a new manager. Team continues to function but management actions are blocked until resolved.
- **Duplicate project name**: Active project names must be unique per org. Archived projects do not conflict.
