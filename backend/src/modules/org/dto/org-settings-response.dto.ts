import { ApiProperty } from '@nestjs/swagger';

export class OrgSettingsResponseDto {
  @ApiProperty({ example: 'Acme Corp' })
  orgName: string;

  @ApiProperty({ example: 40 })
  expectedHoursPerWeek: number;

  @ApiProperty({ example: 12 })
  dailyWarningThreshold: number;

  @ApiProperty({ example: 60 })
  weeklyWarningThreshold: number;

  @ApiProperty({ enum: ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'], example: 'YYYY-MM-DD' })
  dateFormat: string;

  @ApiProperty({ enum: ['12h', '24h'], example: '12h' })
  timeFormat: string;

  @ApiProperty({ example: 500 })
  csvMaxRows: number;
}
