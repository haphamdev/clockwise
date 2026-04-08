import { IsDateString, IsOptional, IsUUID, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class WarningsQueryDto {
  @ApiProperty({ required: false, description: 'Target user ID (for checking warnings on behalf of another user)' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ description: 'Date to check (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({ required: false, description: 'Project ID for project-specific limits' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({ required: false, description: 'Additional hours to include in the check', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(24)
  hours?: number;
}
