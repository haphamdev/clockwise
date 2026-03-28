import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const logDir = config.get<string>('LOG_DIR', './logs');
        const logLevel = config.get<string>('LOG_LEVEL', 'info');
        const maxSize = config.get<string>('LOG_MAX_SIZE', '20m');
        const maxFiles = config.get<string>('LOG_MAX_FILES', '14d');
        const isProduction = config.get<string>('NODE_ENV') === 'production';

        const fileDefaults = {
          dirname: logDir,
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize,
          maxFiles,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        };

        return {
          level: logLevel,
          transports: [
            // Console: pretty in dev, JSON in prod
            new winston.transports.Console({
              format: isProduction
                ? winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json(),
                  )
                : winston.format.combine(
                    winston.format.timestamp({ format: 'HH:mm:ss' }),
                    winston.format.colorize({ all: true }),
                    winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
                      const ctx = context ? `[${context}]` : '';
                      const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                      return `${timestamp} ${level} ${ctx} ${message}${extra}`;
                    }),
                  ),
            }),

            // All logs
            new winston.transports.DailyRotateFile({
              ...fileDefaults,
              filename: 'app-%DATE%.log',
            }),

            // Errors only
            new winston.transports.DailyRotateFile({
              ...fileDefaults,
              filename: 'error-%DATE%.log',
              level: 'error',
            }),
          ],
        };
      },
    }),
  ],
})
export class LoggerModule {}
