import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsNotEmpty } from 'class-validator';

export class CreateTeamDto {
  @ApiProperty({ example: 'Engineering' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ required: false, example: 'Backend engineering team' })
  @IsOptional()
  @IsString()
  description?: string;
}
