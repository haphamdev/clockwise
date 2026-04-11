import { ApiProperty } from "@nestjs/swagger";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class UpdateTimeLogDto {
  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(100, { each: true })
  taskLabels?: string[];

  @ApiProperty({ required: false, description: "YYYY-MM-DD" })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ required: false, minimum: 0.01, maximum: 24 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(24)
  hours?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiProperty({ description: "Reason for update (required)" })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason: string;
}
