import { Module, forwardRef } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { TeamsRepository } from './teams.repository';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';

@Module({
  imports: [forwardRef(() => UsersModule)],
  controllers: [TeamsController],
  providers: [TeamsRepository, TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
