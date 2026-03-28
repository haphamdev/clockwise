import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    // Feature modules will be added here as they are implemented:
    // TeamsModule, ProjectsModule, TasksModule, TimeLogsModule,
    // ReportsModule, OrgModule
  ],
  controllers: [AppController],
})
export class AppModule {}
