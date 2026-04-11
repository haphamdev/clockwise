import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, ValidateNested } from "class-validator";
import { TeamAssignmentDto } from "./create-invitation.dto";

export class UpdateInvitationTeamAssignmentsDto {
  @ApiProperty({ type: [TeamAssignmentDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TeamAssignmentDto)
  teamAssignments: TeamAssignmentDto[];
}
