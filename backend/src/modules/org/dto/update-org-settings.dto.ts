import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class UpdateOrgSettingsDto {
  @ApiProperty({ required: false, example: "Acme Corp" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  orgName?: string;

  @ApiProperty({ required: false, example: 40 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168)
  expectedHoursPerWeek?: number;

  @ApiProperty({ required: false, example: 12 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  dailyWarningThreshold?: number;

  @ApiProperty({ required: false, example: 60 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168)
  weeklyWarningThreshold?: number;

  @ApiProperty({
    required: false,
    enum: ["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY"],
  })
  @IsOptional()
  @IsIn(["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY"])
  dateFormat?: "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY";

  @ApiProperty({ required: false, enum: ["12h", "24h"] })
  @IsOptional()
  @IsIn(["12h", "24h"])
  timeFormat?: "12h" | "24h";

  @ApiProperty({ required: false, example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10000)
  csvMaxRows?: number;

  @ApiProperty({ required: false, example: false })
  @IsOptional()
  @IsBoolean()
  trackSaturday?: boolean;

  @ApiProperty({ required: false, example: false })
  @IsOptional()
  @IsBoolean()
  trackSunday?: boolean;
}
