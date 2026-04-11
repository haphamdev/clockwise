import { ApiProperty } from "@nestjs/swagger";

class CountDto {
  @ApiProperty() active: number;
  @ApiProperty() deactivated: number;
}

class CountWithArchivedDto {
  @ApiProperty() active: number;
  @ApiProperty() archived: number;
}

export class OrgOverviewResponseDto {
  @ApiProperty({ type: CountDto }) users: CountDto;
  @ApiProperty({ type: CountWithArchivedDto }) teams: CountWithArchivedDto;
  @ApiProperty({ type: CountWithArchivedDto }) projects: CountWithArchivedDto;
}
