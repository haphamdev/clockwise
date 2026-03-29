import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { TeamsModule } from '../teams/teams.module';
import { InvitationsRepository } from './invitations.repository';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';

@Module({
  imports: [UsersModule, TeamsModule],
  controllers: [InvitationsController],
  providers: [InvitationsRepository, InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
