import { forwardRef, Module } from "@nestjs/common";
import { ProjectsModule } from "../projects/projects.module";
import { UsersController } from "./users.controller";
import { UsersRepository } from "./users.repository";
import { UsersService } from "./users.service";

@Module({
  imports: [forwardRef(() => ProjectsModule)],
  controllers: [UsersController],
  providers: [UsersRepository, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
