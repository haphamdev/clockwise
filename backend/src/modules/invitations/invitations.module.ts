import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { UsersModule } from '../users/users.module';
import { TeamsModule } from '../teams/teams.module';
import { OrgModule } from '../org/org.module';
import { InvitationsRepository } from './invitations.repository';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { InvitationEmailProcessor } from './invitation-email.processor';
import { INVITATION_EMAIL_QUEUE } from './invitation-email.constants';

@Module({
  imports: [
    BullModule.registerQueue({ name: INVITATION_EMAIL_QUEUE }),
    UsersModule,
    TeamsModule,
    OrgModule,
  ],
  controllers: [InvitationsController],
  providers: [InvitationsRepository, InvitationsService, InvitationEmailProcessor],
  exports: [InvitationsService],
})
export class InvitationsModule {}
