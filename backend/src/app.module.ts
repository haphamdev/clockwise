import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { LoggerModule } from './logger/logger.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TeamsModule } from './modules/teams/teams.module';
import { OrgModule } from './modules/org/org.module';
import { MailModule } from './modules/mail/mail.module';
import { InvitationsModule } from './modules/invitations/invitations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    PrismaModule,
    MailModule,
    AuthModule,
    UsersModule,
    TeamsModule,
    OrgModule,
    InvitationsModule,
    // Feature modules will be added here as they are implemented:
    // ProjectsModule, TasksModule, TimeLogsModule, ReportsModule
  ],
  controllers: [AppController],
})
export class AppModule {}
