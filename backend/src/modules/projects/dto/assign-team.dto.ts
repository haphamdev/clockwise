import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignTeamDto {
  @ApiProperty({ example: 'team-uuid' })
  @IsUUID('4')
  teamId: string;
}
