import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Response } from "express";
import { Auth } from "../../common/decorators/auth.decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ImportUnsupportedTypeException } from "../../common/exceptions/import.exceptions";
import { UserEntity } from "../users/entities/user.entity";
import { ImportExecuteDto } from "./dto/import-execute.dto";
import { ImportJobListResponseDto } from "./dto/import-job-list-response.dto";
import { ImportJobResponseDto } from "./dto/import-job-response.dto";
import {
  ImportPreviewDto,
  ImportPreviewResponseDto,
} from "./dto/import-preview.dto";
import { ListImportJobsQueryDto } from "./dto/list-import-jobs-query.dto";
import { ImportService } from "./import.service";
import { CSV_TEMPLATES } from "./import-templates";

@ApiTags("Import")
@Controller("import")
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post("preview")
  @HttpCode(200)
  @Auth()
  @ApiOperation({ summary: "Upload CSV and preview valid/invalid rows" })
  @ApiOkResponse({ type: ImportPreviewResponseDto })
  async preview(
    @CurrentUser() user: UserEntity,
    @Body() dto: ImportPreviewDto,
  ): Promise<ImportPreviewResponseDto> {
    return this.importService.preview(dto.type, dto.csvContent, {
      userId: user.id,
      orgId: user.orgId,
      isAdmin: user.isAdmin,
    });
  }

  @Post("execute")
  @Auth()
  @ApiOperation({ summary: "Confirm import — queues a background job" })
  @ApiCreatedResponse({ type: ImportJobResponseDto })
  async execute(
    @CurrentUser() user: UserEntity,
    @Body() dto: ImportExecuteDto,
  ): Promise<ImportJobResponseDto> {
    const { jobId, totalRows } = await this.importService.execute(
      dto.type,
      dto.previewToken,
      {
        userId: user.id,
        orgId: user.orgId,
        isAdmin: user.isAdmin,
      },
    );

    return {
      jobId,
      status: "pending",
      totalRows,
      imported: 0,
      errorCount: 0,
      errors: [],
    };
  }

  @Get("jobs")
  @Auth()
  @ApiOperation({ summary: "List import job history" })
  @ApiOkResponse({ type: ImportJobListResponseDto })
  async listJobs(
    @CurrentUser() user: UserEntity,
    @Query() query: ListImportJobsQueryDto,
  ): Promise<ImportJobListResponseDto> {
    const result = await this.importService.listJobs(
      user.id,
      user.orgId,
      user.isAdmin,
      query,
    );
    return {
      ...result,
      data: result.data.map((job) => ({
        id: job.id,
        type: job.type,
        status: job.status,
        totalRows: job.totalRows,
        imported: job.imported,
        errorCount: job.errorCount,
        createdAt: job.createdAt.toISOString(),
        completedAt: job.completedAt?.toISOString() ?? null,
      })),
    };
  }

  @Get("jobs/:id")
  @Auth()
  @ApiOperation({ summary: "Poll import job status" })
  @ApiOkResponse({ type: ImportJobResponseDto })
  async getJobStatus(
    @Param("id") id: string,
    @CurrentUser() user: UserEntity,
  ): Promise<ImportJobResponseDto> {
    return this.importService.getJobStatus(id, user.id, user.isAdmin);
  }

  @Get("template/:type")
  @Auth()
  @ApiOperation({ summary: "Download CSV template for a given import type" })
  async getTemplate(
    @Param("type") type: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    const template = CSV_TEMPLATES[type];
    if (!template) {
      throw new ImportUnsupportedTypeException(type);
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${template.filename}"`,
    );
    return template.content;
  }
}
