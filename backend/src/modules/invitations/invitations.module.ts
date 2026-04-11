import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { OrgModule } from "../org/org.module";
import { TeamsModule } from "../teams/teams.module";
import { UsersModule } from "../users/users.module";
import { INVITATION_EMAIL_QUEUE } from "./invitation-email.constants";
import { InvitationEmailProcessor } from "./invitation-email.processor";
import { InvitationsController } from "./invitations.controller";
import { InvitationsRepository } from "./invitations.repository";
import { InvitationsService } from "./invitations.service";

@Module({
  imports: [
    BullModule.registerQueue({ name: INVITATION_EMAIL_QUEUE }),
    UsersModule,
    TeamsModule,
    OrgModule,
  ],
  controllers: [InvitationsController],
  providers: [
    InvitationsRepository,
    InvitationsService,
    InvitationEmailProcessor,
  ],
  exports: [InvitationsService],
})
export class InvitationsModule {}
