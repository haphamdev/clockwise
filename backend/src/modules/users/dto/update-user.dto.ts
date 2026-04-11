import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator";

export class TeamAssignmentDto {
  @ApiProperty()
  @IsString()
  @IsUUID()
  teamId: string;

  @ApiProperty({ enum: ["manager", "member"] })
  @IsIn(["manager", "member"])
  role: "manager" | "member";
}

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;

  @ApiProperty({ required: false, type: [TeamAssignmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamAssignmentDto)
  teamAssignments?: TeamAssignmentDto[];
}
