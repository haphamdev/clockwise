import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, IsUUID } from 'class-validator';
import { ValidateIf } from 'class-validator';

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
  @IsString()
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
