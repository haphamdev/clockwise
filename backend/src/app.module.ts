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
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { UserPreferencesModule } from './modules/user-preferences/user-preferences.module';
import { TasksModule } from './modules/tasks/tasks.module';

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
    AuditLogModule,
    ProjectsModule,
    UserPreferencesModule,
    TasksModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
