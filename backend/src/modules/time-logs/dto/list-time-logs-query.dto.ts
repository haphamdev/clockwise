import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from "class-validator";

export class ListTimeLogsQueryDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({ required: false, description: "YYYY-MM-DD" })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({ required: false, description: "YYYY-MM-DD" })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiProperty({
    required: false,
    description: "Comma-separated project UUIDs",
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.split(",").filter(Boolean) : value,
  )
  @IsUUID(4, { each: true })
  projectIds?: string[];

  @ApiProperty({
    required: false,
    description: "Comma-separated user UUIDs (manager/admin only)",
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.split(",").filter(Boolean) : value,
  )
  @IsUUID(4, { each: true })
  userIds?: string[];

  @ApiProperty({
    required: false,
    description: "Comma-separated team UUIDs (manager/admin only)",
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.split(",").filter(Boolean) : value,
  )
  @IsUUID(4, { each: true })
  teamIds?: string[];

  @ApiProperty({
    required: false,
    description: "Include archived time logs",
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  includeArchived?: boolean;
}
