import { Module } from "@nestjs/common";
import { OrgController } from "./org.controller";
import { OrgRepository } from "./org.repository";
import { OrgService } from "./org.service";

@Module({
  controllers: [OrgController],
  providers: [OrgRepository, OrgService],
  exports: [OrgService],
})
export class OrgModule {}
