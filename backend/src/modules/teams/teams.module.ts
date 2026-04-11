import { forwardRef, Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { TeamsController } from "./teams.controller";
import { TeamsRepository } from "./teams.repository";
import { TeamsService } from "./teams.service";

@Module({
  imports: [forwardRef(() => UsersModule)],
  controllers: [TeamsController],
  providers: [TeamsRepository, TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
