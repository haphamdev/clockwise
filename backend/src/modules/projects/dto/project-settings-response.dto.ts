import { ApiProperty } from '@nestjs/swagger';

export class ProjectSettingsResponseDto {
  @ApiProperty({ required: false, description: 'null = use org default' })
  dailyHourLimit: number | null;

  @ApiProperty({ required: false, description: 'null = use org default' })
  weeklyHourLimit: number | null;
}
