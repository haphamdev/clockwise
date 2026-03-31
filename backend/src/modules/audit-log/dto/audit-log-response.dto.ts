import { ApiProperty } from '@nestjs/swagger';

export class AuditLogPerformerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class AuditLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  entityType: string;

  @ApiProperty()
  entityId: string;

  @ApiProperty()
  action: string;

  @ApiProperty({ type: AuditLogPerformerDto })
  performedBy: AuditLogPerformerDto;

  @ApiProperty()
  metadata: Record<string, unknown>;

  @ApiProperty()
  createdAt: Date;
}

export class AuditLogListResponseDto {
  @ApiProperty({ type: [AuditLogResponseDto] })
  data: AuditLogResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
