import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength } from "class-validator";

export class ImportPreviewDto {
  @ApiProperty({ description: 'Import type (e.g. "time-log")' })
  @IsString()
  @MaxLength(50)
  type: string;

  @ApiProperty({ description: "CSV file content" })
  @IsString()
  @MaxLength(5 * 1024 * 1024)
  csvContent: string;
}

export class ImportValidationErrorDto {
  @ApiProperty()
  row: number;

  @ApiProperty()
  field: string;

  @ApiProperty()
  message: string;

  @ApiProperty({
    required: false,
    description: "Original row data (when available)",
  })
  data?: Record<string, string>;
}

export class ImportRowDto {
  @ApiProperty()
  rowNumber: number;

  @ApiProperty()
  data: Record<string, string>;
}

export class ImportPreviewResponseDto {
  @ApiProperty({ type: [ImportRowDto] })
  validRows: ImportRowDto[];

  @ApiProperty({ type: [ImportValidationErrorDto] })
  errors: ImportValidationErrorDto[];

  @ApiProperty()
  totalRows: number;

  @ApiProperty({
    required: false,
    description:
      "Token to pass to the execute endpoint. Only present when there are valid rows.",
  })
  previewToken?: string;

  @ApiProperty({
    required: false,
    description:
      "Seconds until the preview expires. Only present when previewToken is set.",
  })
  expiresInSeconds?: number;
}
