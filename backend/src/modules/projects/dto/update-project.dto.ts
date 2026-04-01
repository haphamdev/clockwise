import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsNotEmpty } from 'class-validator';

export class UpdateProjectDto {
  @ApiProperty({ required: false, example: 'Mobile App Redesign v2' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @ApiProperty({ required: false, example: 'Updated description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
