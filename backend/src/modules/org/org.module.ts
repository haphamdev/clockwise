import { Module } from '@nestjs/common';
import { OrgRepository } from './org.repository';
import { OrgService } from './org.service';
import { OrgController } from './org.controller';

@Module({
  controllers: [OrgController],
  providers: [OrgRepository, OrgService],
  exports: [OrgService],
})
export class OrgModule {}
