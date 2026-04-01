import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsIn,
  IsUUID,
  ValidateIf,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

function IsTimezone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isTimezone',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false;
          try {
            Intl.DateTimeFormat(undefined, { timeZone: value });
            return true;
          } catch {
            return false;
          }
        },
        defaultMessage() {
          return '$property must be a valid IANA timezone';
        },
      },
    });
  };
}

export class UpdateUserPreferencesDto {
  @ApiProperty({ required: false, enum: ['light', 'dark', 'system'] })
  @IsOptional()
  @IsIn(['light', 'dark', 'system'])
  theme?: 'light' | 'dark' | 'system';

  @ApiProperty({
    required: false,
    enum: ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'],
    nullable: true,
    description: 'null = use org default',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsIn(['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'])
  dateFormat?: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | null;

  @ApiProperty({
    required: false,
    enum: ['12h', '24h'],
    nullable: true,
    description: 'null = use org default',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsIn(['12h', '24h'])
  timeFormat?: '12h' | '24h' | null;

  @ApiProperty({ required: false, example: 'America/New_York' })
  @IsOptional()
  @IsTimezone({ message: 'timezone must be a valid IANA timezone' })
  timezone?: string;

  @ApiProperty({ required: false, nullable: true, description: 'null to clear' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  defaultProjectId?: string | null;

  @ApiProperty({ required: false, enum: ['monday', 'sunday'] })
  @IsOptional()
  @IsIn(['monday', 'sunday'])
  weekStartDay?: 'monday' | 'sunday';
}
