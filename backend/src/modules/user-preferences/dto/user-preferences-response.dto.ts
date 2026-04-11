import { ApiProperty } from "@nestjs/swagger";

export class UserPreferencesResponseDto {
  @ApiProperty({ enum: ["light", "dark", "system"], example: "system" })
  theme: string;

  @ApiProperty({
    enum: ["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY"],
    nullable: true,
    example: null,
  })
  dateFormat: string | null;

  @ApiProperty({ enum: ["12h", "24h"], nullable: true, example: null })
  timeFormat: string | null;

  @ApiProperty({ example: "UTC" })
  timezone: string;

  @ApiProperty({ nullable: true, example: null })
  defaultProjectId: string | null;

  @ApiProperty({ enum: ["monday", "sunday"], example: "monday" })
  weekStartDay: string;
}
