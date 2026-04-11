import { ApiProperty } from "@nestjs/swagger";

export class TimeLogTaskResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  label: string;

  @ApiProperty({ required: false })
  description: string | null;
}

export class TimeLogUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  status: string;
}

export class TimeLogProjectDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description: string | null;

  @ApiProperty()
  status: string;
}

export class WarningDto {
  @ApiProperty()
  type: "daily_limit" | "weekly_limit";

  @ApiProperty()
  message: string;

  @ApiProperty()
  currentHours: number;

  @ApiProperty()
  threshold: number;
}

export class TimeLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: TimeLogUserDto })
  user: TimeLogUserDto;

  @ApiProperty({ type: TimeLogProjectDto })
  project: TimeLogProjectDto;

  @ApiProperty({ type: [TimeLogTaskResponseDto] })
  tasks: TimeLogTaskResponseDto[];

  @ApiProperty()
  date: Date;

  @ApiProperty()
  hours: number;

  @ApiProperty({ required: false })
  notes: string | null;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class TimeLogCreateResponseDto extends TimeLogResponseDto {
  @ApiProperty({ type: [WarningDto], required: false })
  warnings?: WarningDto[];
}

export class TimeLogUpdateResponseDto extends TimeLogResponseDto {
  @ApiProperty({ type: [WarningDto], required: false })
  warnings?: WarningDto[];
}

export class TimeLogListResponseDto {
  @ApiProperty({ type: [TimeLogResponseDto] })
  data: TimeLogResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalHours: number;
}
