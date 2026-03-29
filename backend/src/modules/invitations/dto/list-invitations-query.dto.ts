import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class ListInvitationsQueryDto {
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

  @ApiProperty({ required: false, enum: ['pending', 'accepted', 'revoked'] })
  @IsOptional()
  @IsIn(['pending', 'accepted', 'revoked'])
  status?: 'pending' | 'accepted' | 'revoked';
}
