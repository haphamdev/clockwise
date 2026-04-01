# Authentication & Authorization

## Overview
Clockwise uses SSO/OAuth for authentication. Users are invited by an Admin and sign in via Google. Authorization is role-based, with roles assigned per team.

---

## Authentication

### SSO Provider
- **Google OAuth 2.0** at launch.
- Architecture should allow adding more providers (Microsoft, SAML) later.

### Login Flow
1. User navigates to the app → sees login page.
2. User clicks "Sign in with Google".
3. App redirects to Google OAuth consent screen.
4. On success, Google redirects back with auth code.
5. Backend exchanges code for tokens, verifies email against invited users.
6. If email matches an invited user → create session (JWT), redirect to dashboard.
7. If email is not invited → show "You don't have access. Contact your admin." message.

### Session Management
- Backend issues a JWT access token (short-lived, ~15 min) and a refresh token (long-lived, ~7 days).
- Access token is sent in `Authorization: Bearer` header.
- Refresh token is stored in an HTTP-only cookie.
- On access token expiry, frontend silently refreshes using the refresh token.
- On refresh token expiry, user is redirected to login.

---

## User Invitation

### Flow
1. Admin goes to User Management → clicks "Invite User".
2. Admin enters email address and selects the team(s) + role per team.
3. System sends an invitation email with a link.
4. Invited user clicks link → redirected to Google OAuth → account is activated on first login.

### Invitation Rules
- Invitation link expires after 7 days.
- Admin can resend or revoke pending invitations.
- A user must be invited before they can log in (no self-registration).
- Invited users are in "pending" status until their first login.

---

## Authorization

### Roles
Roles are assigned **per team**. A user can have different roles in different teams.

| Role | Scope | Description |
|------|-------|-------------|
| **Admin** | Organization-wide | Full system access. Manages teams, users, org settings. Not tied to a specific team. |
| **Manager** | Per team | Manages projects for their team, views/edits team members' time logs, accesses team reports. |
| **Member** | Per team | Logs time, views/edits own time logs, views own summary. |

### Permission Matrix

| Action | Admin | Manager | Member |
|--------|-------|---------|--------|
| Invite / remove users | Yes | No | No |
| Create / manage teams | Yes | No | No |
| Assign roles to team members | Yes | No | No |
| Create projects (with team assignment) | Yes | Yes (own managed teams) | No |
| Assign/remove teams to projects | Yes | Yes (own managed teams) | No |
| Log time | Yes | Yes | Yes |
| Edit own time logs | Yes | Yes | Yes |
| Edit team members' time logs | Yes | Yes (own team) | No |
| View reports | Yes (all) | Yes (own team) | Own summary only |
| Export reports (CSV/PDF) | Yes | Yes (own team) | No |
| Manage org settings | Yes | No | No |

### Cross-Team Access
- A user who is a **Manager** in Team A and a **Member** in Team B:
  - Can view/edit time logs of Team A members.
  - Can only view/edit their own time logs in Team B.
  - Can manage projects linked to Team A but only view projects linked to Team B.
- A user's effective permissions for a resource depend on their role in the team(s) linked to that resource.

---

## API Security
- All API endpoints require a valid JWT (except login/OAuth callback).
- Role checks are enforced at the API layer via NestJS guards.
- Team-scoped endpoints verify the user's role within the relevant team.
- Rate limiting on auth endpoints to prevent abuse.

---

## Edge Cases
- **User removed from team**: Existing time logs remain but user can no longer log new time or view that team's data.
- **Manager demoted to Member**: Loses access to team reports and ability to edit others' logs immediately.
- **User in no teams**: Can log in but has no projects or time-logging capability. Dashboard shows empty state with message to contact admin.
- **Last Admin**: System prevents removing the last Admin to avoid lockout.
