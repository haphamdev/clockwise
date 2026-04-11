import { Body, Controller, Get, Patch } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Auth } from "../../common/decorators/auth.decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserEntity } from "../users/entities/user.entity";
import { UpdateUserPreferencesDto } from "./dto/update-user-preferences.dto";
import { UserPreferencesResponseDto } from "./dto/user-preferences-response.dto";
import { UserPreferencesService } from "./user-preferences.service";

@ApiTags("User Preferences")
@Controller("users/me/preferences")
export class UserPreferencesController {
  constructor(private readonly prefsService: UserPreferencesService) {}

  @Get()
  @Auth()
  @ApiOperation({ summary: "Get current user preferences" })
  @ApiOkResponse({ type: UserPreferencesResponseDto })
  async getPreferences(
    @CurrentUser() user: UserEntity,
  ): Promise<UserPreferencesResponseDto> {
    return this.prefsService.getPreferences(user.id);
  }

  @Patch()
  @Auth()
  @ApiOperation({ summary: "Update current user preferences" })
  @ApiOkResponse({ type: UserPreferencesResponseDto })
  async updatePreferences(
    @CurrentUser() user: UserEntity,
    @Body() dto: UpdateUserPreferencesDto,
  ): Promise<UserPreferencesResponseDto> {
    return this.prefsService.updatePreferences(user.id, dto);
  }
}
