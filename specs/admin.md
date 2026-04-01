# Admin Panel

## Overview
The Admin panel provides organization-level settings, user management, and team management. Only users with the Admin role can access it.

---

## Organization Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Organization name | string | — | Displayed in the app header and PDF exports |
| Expected hours/week | decimal | 40 | Used for utilization rate calculations in reports |
| Daily soft warning threshold | decimal | 12 | Warn users when daily total exceeds this value |
| Weekly soft warning threshold | decimal | 60 | Warn users when weekly total exceeds this value |
| CSV max rows per import | integer | 500 | Maximum rows allowed in a single CSV import |
| Date display format | enum | `YYYY-MM-DD` | Options: `YYYY-MM-DD`, `DD/MM/YYYY`, `MM/DD/YYYY` |

---

## User Management

### User List
- Table: Name, Email, Teams (with roles), Status (active/pending/deactivated), Last login.
- Actions: Invite, Edit, Deactivate, Reactivate.
- Filter by: team, role, status.
- Search by: name, email.

### Invite User
See `specs/auth.md` for invitation flow details.
- Admin enters email, selects team(s) and role per team.
- System sends invitation email.

### Edit User
- Change team assignments and roles.
- Cannot change email (tied to SSO identity).

### Deactivate User
- Soft-deactivation: user can no longer log in.
- Existing time logs are preserved.
- User's team memberships remain intact (projects are accessed through teams, not individual assignment).
- Can be reactivated later (restores login access).

### User Status Lifecycle
```
Invited (pending) → Active → Deactivated
                       ↑          ↓
                       ← Reactivated
```

---

## Team Management
See `specs/projects-and-teams.md` for detailed team operations.

**Admin actions summary:**
- Create, edit, archive teams.
- Add/remove members.
- Assign/revoke Manager role.

---

## Project Oversight
- Admin can view all projects across all teams.
- Admin can create, edit, archive, and unarchive any project.
- Admin can assign or remove any team to/from any project.

---

## Edge Cases
- **Last Admin deactivated**: System blocks deactivation of the last Admin.
- **Deactivated user's pending time logs**: Remain as-is. Managers can still edit them.
- **Deactivated user in reports**: Still appears in historical reports. Marked as "(deactivated)" in user list.
