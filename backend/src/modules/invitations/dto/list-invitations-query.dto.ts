import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

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

  @ApiProperty({
    required: false,
    enum: ["initiated", "sending", "sent", "accepted", "revoked", "failed"],
  })
  @IsOptional()
  @IsIn(["initiated", "sending", "sent", "accepted", "revoked", "failed"])
  status?: "initiated" | "sending" | "sent" | "accepted" | "revoked" | "failed";
}
