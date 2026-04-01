import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { IsAdminGuard } from '../guards/is-admin.guard';
import { RolesGuard } from '../guards/roles.guard';
import { TeamMemberGuard } from '../guards/team-member.guard';
import { Roles } from './roles.decorator';

/**
 * Requires a valid JWT access token.
 * Populates req.user with the authenticated user.
 */
export const Auth = () =>
  applyDecorators(UseGuards(JwtAuthGuard), ApiBearerAuth());

/**
 * Requires the user to be an admin.
 * Includes JWT authentication.
 */
export const AdminOnly = () =>
  applyDecorators(UseGuards(JwtAuthGuard, IsAdminGuard), ApiBearerAuth());

/**
 * Requires the user to have one of the specified roles within the team
 * identified by the `:teamId` route parameter. Admins bypass this check.
 * Includes JWT authentication.
 */
export const TeamRole = (...roles: Array<'manager' | 'member'>) =>
  applyDecorators(
    Roles(...roles),
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiBearerAuth(),
  );

/**
 * Requires the user to be a member of the team identified by `:teamId`.
 * Does not check specific roles — any team member passes.
 * Admins bypass this check. Includes JWT authentication.
 */
export const TeamMember = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard, TeamMemberGuard),
    ApiBearerAuth(),
  );
