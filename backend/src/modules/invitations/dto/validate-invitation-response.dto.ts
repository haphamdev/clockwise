import { ApiProperty } from '@nestjs/swagger';
import { InvitationTeamAssignmentResponseDto } from './invitation-response.dto';

export class ValidateInvitationResponseDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  orgName: string;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty({ type: [InvitationTeamAssignmentResponseDto] })
  teamAssignments: InvitationTeamAssignmentResponseDto[];
}
