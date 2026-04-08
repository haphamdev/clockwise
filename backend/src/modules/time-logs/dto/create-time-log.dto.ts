import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ArrayMinSize,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsDateString,
  IsUUID,
} from 'class-validator';

export class CreateTimeLogDto {
  @ApiProperty({ required: false, description: 'Target user ID (for logging on behalf of another user)' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty()
  @IsUUID()
  projectId: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(100, { each: true })
  taskLabels: string[];

  @ApiProperty({ description: 'YYYY-MM-DD' })
  @IsDateString()
  date: string;

  @ApiProperty({ minimum: 0.01, maximum: 24 })
  @IsNumber()
  @Min(0.01)
  @Max(24)
  hours: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
