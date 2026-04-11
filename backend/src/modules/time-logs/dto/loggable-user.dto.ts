import { ApiProperty } from "@nestjs/swagger";

export class LoggableUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;
}
