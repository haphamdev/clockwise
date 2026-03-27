# Projects & Teams

## Overview
Teams are the organizational unit for users. Projects are where work happens. A project can span multiple teams, and each project has a designated owner.

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
- A project can involve members from **multiple teams**.
- Each project has a **designated owner** (an Admin or a Manager) who manages the project.
- Members are assigned to projects individually (not by team).

### Project Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Name | string | Yes | Project name |
| Description | string | No | Brief description |
| Status | enum | Yes | `active` or `archived` |
| Owner | User | Yes | Designated project owner (Admin or Manager) |

### Project Management

| Action | Who can do it |
|--------|---------------|
| Create project | Admin, Manager |
| Edit project (name, description, status) | Admin, Project Owner |
| Archive project | Admin, Project Owner |
| Assign members to project | Admin, Project Owner |
| Remove members from project | Admin, Project Owner |
| Transfer ownership | Admin, current Project Owner |

### Member Assignment
- A project owner can assign any user from any team to their project.
- A user must be assigned to a project before they can log time against it.
- When a user is removed from a project, their existing time logs remain intact.

### Rules
- Archiving a project prevents new time logging but preserves all existing data.
- A project must have exactly one owner at any time.
- Ownership can be transferred to another Admin or Manager.
- When a project owner leaves the org or is demoted, Admin must reassign ownership.

---

## Cross-Team & Cross-Project Permissions

### Time Log Visibility & Editing

| Scenario | Can view time logs? | Can edit time logs? |
|----------|-------------------|-------------------|
| Admin → any user, any project | Yes | Yes |
| Project Owner → project members | Yes | Yes |
| Manager → own team members (any project) | Yes | Yes |
| Member → self | Yes | Yes |
| Member → other members | No | No |

**Priority**: If a user qualifies through multiple roles (e.g., both Project Owner and team Manager), they get the union of permissions.

### Example
- User A is Manager of Team Alpha and Member of Team Beta.
- Project X has members from both Team Alpha and Team Beta.
- User A can view/edit time logs of Team Alpha members in Project X (as their Manager).
- User A can only view/edit their own time logs as a Team Beta member.
- If User A is also the owner of Project X, they can view/edit all project members' logs.

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
- **Admin**: Sees all projects.
- **Manager**: Sees projects they own + projects their team members are in.
- **Member**: Sees only their assigned projects.
- Columns: Name, Status, Owner, Member count.
- Filter by status (active/archived).

### Project Detail
- Project info (name, description, status, owner).
- Member list with team affiliation.
- Actions (for Admin/Owner): Edit, assign/remove members, archive, transfer ownership.

---

## Edge Cases
- **Project with no members**: Valid state (just created). Owner can still configure it.
- **User in no projects**: Can log in, sees empty project list. Dashboard shows prompt to contact manager.
- **All managers leave a team**: Admin is notified to assign a new manager. Team continues to function but management actions are blocked until resolved.
- **Project owner archived from org**: Ownership must be transferred by Admin before or during the archival.
