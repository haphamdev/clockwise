import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString, IsUUID } from "class-validator";

export class AddTeamMemberDto {
  @ApiProperty({ example: "uuid" })
  @IsString()
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: ["manager", "member"], example: "member" })
  @IsIn(["manager", "member"])
  role: "manager" | "member";
}
