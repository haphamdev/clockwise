import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";

export class UpdateTeamMemberDto {
  @ApiProperty({ enum: ["manager", "member"], example: "manager" })
  @IsIn(["manager", "member"])
  role: "manager" | "member";
}
