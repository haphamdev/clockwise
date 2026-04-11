import { Module } from "@nestjs/common";
import { ProjectsRepository } from "../projects/projects.repository";
import { UsersController } from "./users.controller";
import { UsersRepository } from "./users.repository";
import { UsersService } from "./users.service";

@Module({
  controllers: [UsersController],
  // ProjectsRepository provided directly (not via ProjectsModule) to avoid
  // circular module dependency. It only depends on global PrismaService.
  providers: [UsersRepository, UsersService, ProjectsRepository],
  exports: [UsersService],
})
export class UsersModule {}
