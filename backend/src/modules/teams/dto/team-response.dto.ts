import { ApiProperty } from "@nestjs/swagger";

export class TeamMemberResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  userName: string;

  @ApiProperty()
  userEmail: string;

  @ApiProperty({ enum: ["pending", "active", "deactivated"] })
  userStatus: string;

  @ApiProperty({ enum: ["manager", "member"] })
  role: string;

  @ApiProperty()
  createdAt: Date;
}

export class TeamResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description: string | null;

  @ApiProperty()
  isArchived: boolean;

  @ApiProperty()
  memberCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class TeamDetailResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description: string | null;

  @ApiProperty()
  isArchived: boolean;

  @ApiProperty({ type: [TeamMemberResponseDto] })
  members: TeamMemberResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class TeamListResponseDto {
  @ApiProperty({ type: [TeamResponseDto] })
  data: TeamResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
