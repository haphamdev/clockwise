import { ApiProperty } from '@nestjs/swagger';

export class UserTeamMembershipDto {
  @ApiProperty()
  teamId: string;

  @ApiProperty()
  teamName: string;

  @ApiProperty({ enum: ['manager', 'member'] })
  role: string;
}

export class UserResponseDto {
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

  @ApiProperty({ enum: ['pending', 'active', 'deactivated'] })
  status: string;

  @ApiProperty({ required: false })
  lastLoginAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: [UserTeamMembershipDto] })
  teamMemberships: UserTeamMembershipDto[];
}

export class UserListResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  data: UserResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
