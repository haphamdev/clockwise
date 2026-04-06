import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsString, IsIn, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class ListUsersQueryDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({ required: false, description: 'Search by name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, enum: ['pending', 'active', 'deactivated'] })
  @IsOptional()
  @IsIn(['pending', 'active', 'deactivated'])
  status?: 'pending' | 'active' | 'deactivated';

  @ApiProperty({ required: false, description: 'Filter by team membership' })
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @ApiProperty({ required: false, description: 'Filter by project membership (via team chain)' })
  @IsOptional()
  @IsUUID()
  projectId?: string;
}
