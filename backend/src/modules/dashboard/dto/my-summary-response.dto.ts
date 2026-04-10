import { ApiProperty } from '@nestjs/swagger';

class MyHoursDto {
  @ApiProperty() today: number;
  @ApiProperty() thisWeek: number;
  @ApiProperty() lastWeek: number;
  @ApiProperty({ nullable: true }) weekOverWeekPct: number | null;
  @ApiProperty() thisMonth: number;
  @ApiProperty() lastMonth: number;
  @ApiProperty({ nullable: true }) monthOverMonthPct: number | null;
}

class GapDto {
  @ApiProperty() date: string;
  @ApiProperty() hours: number;
}

class RecentLogDto {
  @ApiProperty() id: string;
  @ApiProperty() date: string;
  @ApiProperty() projectName: string;
  @ApiProperty({ type: [String] }) taskLabels: string[];
  @ApiProperty() hours: number;
}

class ProjectSummaryDto {
  @ApiProperty() projectId: string;
  @ApiProperty() projectName: string;
  @ApiProperty() hoursThisWeek: number;
  @ApiProperty() entriesThisWeek: number;
}

export class MySummaryResponseDto {
  @ApiProperty({ type: MyHoursDto }) myHours: MyHoursDto;
  @ApiProperty({ type: [GapDto] }) gaps: GapDto[];
  @ApiProperty({ type: [RecentLogDto] }) recentLogs: RecentLogDto[];
  @ApiProperty({ type: [ProjectSummaryDto] }) projectSummaries: ProjectSummaryDto[];
}
