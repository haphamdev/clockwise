import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';
import { ErrorCode } from './error-codes';

export class ReportInvalidDateRangeException extends AppException {
  constructor() {
    super(
      ErrorCode.REPORT.INVALID_DATE_RANGE,
      'dateFrom must be before or equal to dateTo',
      HttpStatus.BAD_REQUEST,
    );
  }
}
