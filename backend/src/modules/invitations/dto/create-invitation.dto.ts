import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator";

export class TeamAssignmentDto {
  @ApiProperty({ example: "uuid" })
  @IsString()
  @IsUUID()
  teamId: string;

  @ApiProperty({ enum: ["manager", "member"], example: "member" })
  @IsIn(["manager", "member"])
  role: "manager" | "member";
}

export class CreateInvitationDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ type: [TeamAssignmentDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TeamAssignmentDto)
  teamAssignments: TeamAssignmentDto[];
}
