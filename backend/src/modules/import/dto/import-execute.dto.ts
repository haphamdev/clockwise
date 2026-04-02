import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength } from 'class-validator';

export class ImportExecuteDto {
  @ApiProperty({ description: 'Import type (e.g. "time-log")' })
  @IsString()
  @MaxLength(50)
  type: string;

  @ApiProperty({ description: 'Token from the preview response' })
  @IsUUID()
  previewToken: string;
}
