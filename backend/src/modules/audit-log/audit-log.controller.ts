import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AdminOnly } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../users/entities/user.entity';
import { AuditLogService } from './audit-log.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { AuditLogListResponseDto } from './dto/audit-log-response.dto';

@ApiTags('Audit Logs')
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @AdminOnly()
  @ApiOperation({ summary: 'List audit log entries for an entity' })
  @ApiOkResponse({ type: AuditLogListResponseDto })
  async list(
    @CurrentUser() user: UserEntity,
    @Query() query: AuditLogQueryDto,
  ): Promise<AuditLogListResponseDto> {
    const { data, total } = await this.auditLogService.findByEntity(
      user.orgId,
      query.entityType,
      query.entityId,
      { page: query.page ?? 1, limit: query.limit ?? 20 },
    );

    return {
      data: data.map((entry) => ({
        id: entry.id,
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        performedBy: entry.performedBy,
        metadata: entry.metadata,
        createdAt: entry.createdAt,
      })),
      total,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
  }
}
