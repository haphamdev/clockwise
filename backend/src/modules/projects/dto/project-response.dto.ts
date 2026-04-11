import { ApiProperty } from "@nestjs/swagger";

export class ProjectTeamResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  teamId: string;

  @ApiProperty()
  teamName: string;

  @ApiProperty()
  memberCount: number;

  @ApiProperty()
  isArchived: boolean;

  @ApiProperty()
  createdAt: Date;
}

export class ProjectResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description: string | null;

  @ApiProperty({ enum: ["active", "archived"] })
  status: string;

  @ApiProperty()
  teamCount: number;

  @ApiProperty({ type: [String] })
  teamIds: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ProjectDetailResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description: string | null;

  @ApiProperty({ enum: ["active", "archived"] })
  status: string;

  @ApiProperty({ type: [ProjectTeamResponseDto] })
  teams: ProjectTeamResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ProjectListResponseDto {
  @ApiProperty({ type: [ProjectResponseDto] })
  data: ProjectResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
