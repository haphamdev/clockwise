import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    // Feature modules will be added here as they are implemented:
    // AuthModule, UsersModule, TeamsModule, ProjectsModule,
    // TasksModule, TimeLogsModule, ReportsModule, OrgModule
  ],
  controllers: [AppController],
})
export class AppModule {}
