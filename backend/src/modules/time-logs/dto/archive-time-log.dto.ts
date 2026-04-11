import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class ArchiveTimeLogDto {
  @ApiProperty({ description: "Reason for archiving (required)" })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason: string;
}

export class UnarchiveTimeLogDto {
  @ApiProperty({ description: "Reason for unarchiving (required)" })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason: string;
}
