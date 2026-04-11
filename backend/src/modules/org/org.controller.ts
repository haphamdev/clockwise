import { Body, Controller, Get, Patch } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminOnly } from "../../common/decorators/auth.decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserEntity } from "../users/entities/user.entity";
import { OrgSettingsResponseDto } from "./dto/org-settings-response.dto";
import { UpdateOrgSettingsDto } from "./dto/update-org-settings.dto";
import { OrgService } from "./org.service";

@ApiTags("Organization")
@Controller("org")
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @Get("settings")
  @AdminOnly()
  @ApiOperation({ summary: "Get organization settings" })
  @ApiOkResponse({ type: OrgSettingsResponseDto })
  async getSettings(
    @CurrentUser() user: UserEntity,
  ): Promise<OrgSettingsResponseDto> {
    return this.orgService.getSettings(user.orgId);
  }

  @Patch("settings")
  @AdminOnly()
  @ApiOperation({ summary: "Update organization settings" })
  @ApiOkResponse({ type: OrgSettingsResponseDto })
  async updateSettings(
    @CurrentUser() user: UserEntity,
    @Body() dto: UpdateOrgSettingsDto,
  ): Promise<OrgSettingsResponseDto> {
    return this.orgService.updateSettings(user.orgId, dto);
  }
}
