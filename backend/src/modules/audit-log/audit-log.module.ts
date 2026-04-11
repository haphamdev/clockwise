import { Global, Module } from "@nestjs/common";
import { AuditLogController } from "./audit-log.controller";
import { AuditLogRepository } from "./audit-log.repository";
import { AuditLogService } from "./audit-log.service";

@Global()
@Module({
  controllers: [AuditLogController],
  providers: [AuditLogRepository, AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
