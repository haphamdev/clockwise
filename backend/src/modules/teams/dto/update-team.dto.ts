import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateTeamDto {
  @ApiProperty({ required: false, example: "Engineering" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @ApiProperty({ required: false, example: "Backend engineering team" })
  @IsOptional()
  @IsString()
  description?: string;
}
