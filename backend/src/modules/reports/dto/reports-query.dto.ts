import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsDateString, IsIn, IsOptional, IsUUID } from "class-validator";

export type ReportGroupBy = "user" | "project" | "team";
export type ReportGranularity = "day" | "week" | "month" | "quarter";

export class ReportBaseQueryDto {
  @ApiProperty({ description: "YYYY-MM-DD" })
  @IsDateString()
  dateFrom: string;

  @ApiProperty({ description: "YYYY-MM-DD" })
  @IsDateString()
  dateTo: string;

  @ApiProperty({ required: false, description: "Comma-separated team UUIDs" })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.split(",").filter(Boolean) : value,
  )
  @IsUUID(4, { each: true })
  teamIds?: string[];

  @ApiProperty({ required: false, description: "Comma-separated user UUIDs" })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.split(",").filter(Boolean) : value,
  )
  @IsUUID(4, { each: true })
  userIds?: string[];

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
}

export class TimeSeriesQueryDto extends ReportBaseQueryDto {
  @ApiProperty({ enum: ["day", "week", "month", "quarter"] })
  @IsIn(["day", "week", "month", "quarter"])
  granularity: ReportGranularity;

  @ApiProperty({ enum: ["user", "project", "team"] })
  @IsIn(["user", "project", "team"])
  groupBy: ReportGroupBy;

  @ApiProperty({ required: false, enum: ["user", "project", "team"] })
  @IsOptional()
  @IsIn(["user", "project", "team"])
  stackBy?: ReportGroupBy;
}

export class WeekdayDistributionQueryDto extends ReportBaseQueryDto {
  @ApiProperty({ enum: ["user", "project", "team"] })
  @IsIn(["user", "project", "team"])
  groupBy: ReportGroupBy;
}

export class LoggingDelayQueryDto extends ReportBaseQueryDto {}

export class SummaryQueryDto extends ReportBaseQueryDto {}

export class AnomaliesQueryDto extends ReportBaseQueryDto {}

export class LoggingDelayHeatmapQueryDto extends ReportBaseQueryDto {}
