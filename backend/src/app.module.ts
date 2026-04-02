import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
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
import { TimeLogsModule } from './modules/time-logs/time-logs.module';
import { ImportModule } from './modules/import/import.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD'),
        },
      }),
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
    TimeLogsModule,
    ImportModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
