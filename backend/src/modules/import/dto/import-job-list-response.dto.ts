import { ApiProperty } from '@nestjs/swagger';
import { ImportJobStatus } from '@prisma/client';

export class ImportJobListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty({ enum: ['pending', 'processing', 'completed', 'failed'] })
  status: ImportJobStatus;

  @ApiProperty()
  totalRows: number;

  @ApiProperty()
  imported: number;

  @ApiProperty()
  errorCount: number;

  @ApiProperty()
  createdAt: string;

  @ApiProperty({ required: false })
  completedAt: string | null;
}

export class ImportJobListResponseDto {
  @ApiProperty({ type: [ImportJobListItemDto] })
  data: ImportJobListItemDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
