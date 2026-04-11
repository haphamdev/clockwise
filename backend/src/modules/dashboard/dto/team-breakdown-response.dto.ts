import { ApiProperty } from "@nestjs/swagger";

class NotLoggedUserDto {
  @ApiProperty() userId: string;
  @ApiProperty() userName: string;
}

class ThresholdBreachesDto {
  @ApiProperty() dailyCount: number;
  @ApiProperty() weeklyCount: number;
}

class TeamProjectDto {
  @ApiProperty() projectId: string;
  @ApiProperty() projectName: string;
}

class TeamBreakdownItemDto {
  @ApiProperty() teamId: string;
  @ApiProperty() teamName: string;
  @ApiProperty() memberCount: number;
  @ApiProperty() hoursThisWeek: number;
  @ApiProperty({ nullable: true }) weekOverWeekPct: number | null;
  @ApiProperty() hoursThisMonth: number;
  @ApiProperty({ nullable: true }) monthOverMonthPct: number | null;
  @ApiProperty({ type: [NotLoggedUserDto] })
  notLoggedThisWeek: NotLoggedUserDto[];
  @ApiProperty({ type: ThresholdBreachesDto })
  thresholdBreaches: ThresholdBreachesDto;
  @ApiProperty({ type: [TeamProjectDto] }) activeProjects: TeamProjectDto[];
  @ApiProperty() activeProjectCount: number;
}

export class TeamBreakdownResponseDto {
  @ApiProperty({ type: [TeamBreakdownItemDto] }) teams: TeamBreakdownItemDto[];
}
