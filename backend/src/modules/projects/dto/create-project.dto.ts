import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsNotEmpty, IsArray, ArrayMinSize, ArrayMaxSize, IsUUID } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Mobile App Redesign' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ required: false, example: 'Complete redesign of the mobile app' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ type: [String], example: ['team-uuid-1'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  teamIds: string[];
}
