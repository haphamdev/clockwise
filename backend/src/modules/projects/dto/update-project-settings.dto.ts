import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, Max, Min } from "class-validator";

export class UpdateProjectSettingsDto {
  @ApiProperty({
    required: false,
    description: "null to clear (use org default)",
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(24)
  dailyHourLimit?: number | null;

  @ApiProperty({
    required: false,
    description: "null to clear (use org default)",
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(168)
  weeklyHourLimit?: number | null;
}
