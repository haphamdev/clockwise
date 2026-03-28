import { ApiProperty } from '@nestjs/swagger';

export class TeamMembershipDto {
  @ApiProperty()
  teamId: string;

  @ApiProperty()
  teamName: string;

  @ApiProperty({ enum: ['manager', 'member'] })
  role: string;
}

export class UserProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  avatarUrl: string | null;

  @ApiProperty()
  isAdmin: boolean;

  @ApiProperty({ type: [TeamMembershipDto] })
  teams: TeamMembershipDto[];
}

export class AccessTokenResponseDto {
  @ApiProperty()
  accessToken: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ type: UserProfileDto })
  user: UserProfileDto;
}
