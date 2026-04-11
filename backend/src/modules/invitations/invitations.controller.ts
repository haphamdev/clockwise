import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { AdminOnly } from "../../common/decorators/auth.decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserEntity } from "../users/entities/user.entity";
import { CreateInvitationDto } from "./dto/create-invitation.dto";
import {
  InvitationListResponseDto,
  InvitationResponseDto,
} from "./dto/invitation-response.dto";
import { ListInvitationsQueryDto } from "./dto/list-invitations-query.dto";
import { UpdateInvitationTeamAssignmentsDto } from "./dto/update-invitation-team-assignments.dto";
import { ValidateInvitationResponseDto } from "./dto/validate-invitation-response.dto";
import { InvitationEntity } from "./entities/invitation.entity";
import { InvitationsService } from "./invitations.service";

@ApiTags("Invitations")
@Controller("invitations")
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get("validate/:token")
  @ApiOperation({ summary: "Validate an invitation token (public, no auth)" })
  @ApiOkResponse({ type: ValidateInvitationResponseDto })
  async validateToken(
    @Param("token") token: string,
  ): Promise<ValidateInvitationResponseDto> {
    const { invitation, orgName } =
      await this.invitationsService.validateTokenWithOrgName(token);
    return {
      email: invitation.email,
      orgName,
      expiresAt: invitation.expiresAt,
      teamAssignments: invitation.teamAssignments.map((ta) => ({
        teamId: ta.teamId,
        teamName: ta.teamName,
        role: ta.role,
      })),
    };
  }

  @Post()
  @AdminOnly()
  @ApiOperation({ summary: "Send an invitation" })
  @ApiCreatedResponse({ type: InvitationResponseDto })
  async create(
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateInvitationDto,
  ): Promise<InvitationResponseDto> {
    const invitation = await this.invitationsService.create(
      user.orgId,
      user.id,
      dto,
    );
    return this.toResponse(invitation);
  }

  @Get()
  @AdminOnly()
  @ApiOperation({ summary: "List invitations" })
  @ApiOkResponse({ type: InvitationListResponseDto })
  async list(
    @CurrentUser() user: UserEntity,
    @Query() query: ListInvitationsQueryDto,
  ): Promise<InvitationListResponseDto> {
    const { data, total } = await this.invitationsService.findAll(user.orgId, {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      status: query.status,
    });

    return {
      data: data.map((i) => this.toResponse(i)),
      total,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
  }

  @Patch(":id/team-assignments")
  @AdminOnly()
  @ApiOperation({ summary: "Update team assignments for an invitation" })
  @ApiOkResponse({ type: InvitationResponseDto })
  async updateTeamAssignments(
    @Param("id") id: string,
    @CurrentUser() user: UserEntity,
    @Body() dto: UpdateInvitationTeamAssignmentsDto,
  ): Promise<InvitationResponseDto> {
    const invitation = await this.invitationsService.updateTeamAssignments(
      id,
      user.orgId,
      dto.teamAssignments,
    );
    return this.toResponse(invitation);
  }

  @Delete(":id")
  @AdminOnly()
  @ApiOperation({ summary: "Revoke an invitation" })
  async revoke(
    @Param("id") id: string,
    @CurrentUser() user: UserEntity,
  ): Promise<{ message: string }> {
    await this.invitationsService.revoke(id, user.orgId);
    return { message: "Invitation revoked" };
  }

  @Post(":id/resend")
  @AdminOnly()
  @ApiOperation({ summary: "Resend an invitation" })
  @ApiOkResponse({ type: InvitationResponseDto })
  async resend(
    @Param("id") id: string,
    @CurrentUser() user: UserEntity,
  ): Promise<InvitationResponseDto> {
    const invitation = await this.invitationsService.resend(id, user.orgId);
    return this.toResponse(invitation);
  }

  private toResponse(invitation: InvitationEntity): InvitationResponseDto {
    return {
      id: invitation.id,
      email: invitation.email,
      invitedByName: invitation.invitedByName,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      isExpired:
        !["accepted", "revoked"].includes(invitation.status) &&
        new Date() > invitation.expiresAt,
      createdAt: invitation.createdAt,
      teamAssignments: invitation.teamAssignments.map((ta) => ({
        teamId: ta.teamId,
        teamName: ta.teamName,
        role: ta.role,
      })),
    };
  }
}
