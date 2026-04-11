import { ApiProperty } from "@nestjs/swagger";
import { ImportJobStatus } from "../interfaces/import-job.interface";
import { ImportValidationErrorDto } from "./import-preview.dto";

export class ImportJobResponseDto {
  @ApiProperty()
  jobId: string;

  @ApiProperty({ enum: ["pending", "processing", "completed", "failed"] })
  status: ImportJobStatus;

  @ApiProperty()
  totalRows: number;

  @ApiProperty()
  imported: number;

  @ApiProperty()
  errorCount: number;

  @ApiProperty({ type: [ImportValidationErrorDto] })
  errors: ImportValidationErrorDto[];

  @ApiProperty({
    required: false,
    description:
      "ISO-8601 timestamp. Completed jobs are removed after 1 hour; failed jobs after 2 hours.",
  })
  completedAt?: string;
}
