import { ApiProperty } from '@nestjs/swagger';

export class InvitationTeamAssignmentResponseDto {
  @ApiProperty()
  teamId: string;

  @ApiProperty()
  teamName: string;

  @ApiProperty({ enum: ['manager', 'member'] })
  role: string;
}

export class InvitationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  invitedByName: string;

  @ApiProperty({ enum: ['pending', 'accepted', 'revoked'] })
  status: string;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: [InvitationTeamAssignmentResponseDto] })
  teamAssignments: InvitationTeamAssignmentResponseDto[];
}

export class InvitationListResponseDto {
  @ApiProperty({ type: [InvitationResponseDto] })
  data: InvitationResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
