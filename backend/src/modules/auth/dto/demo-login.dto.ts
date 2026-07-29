import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";

export const DEMO_ROLES = ["member", "manager", "admin"] as const;
export type DemoRole = (typeof DEMO_ROLES)[number];

export class DemoLoginDto {
  @ApiProperty({ enum: DEMO_ROLES })
  @IsIn(DEMO_ROLES)
  role: DemoRole;
}

export class DemoConfigResponseDto {
  @ApiProperty()
  enabled: boolean;
}
