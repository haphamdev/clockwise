import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';
import { ErrorCode } from './error-codes';

export class TimeLogNotFoundException extends AppException {
  constructor() {
    super(ErrorCode.TIME_LOG.NOT_FOUND, 'Time log not found', HttpStatus.NOT_FOUND);
  }
}

export class TimeLogArchivedException extends AppException {
  constructor() {
    super(ErrorCode.TIME_LOG.ARCHIVED, 'Time log is archived', HttpStatus.CONFLICT);
  }
}

export class TimeLogNotArchivedException extends AppException {
  constructor() {
    super(ErrorCode.TIME_LOG.NOT_ARCHIVED, 'Time log is not archived', HttpStatus.CONFLICT);
  }
}

export class TimeLogInsufficientPermissionException extends AppException {
  constructor() {
    super(
      ErrorCode.TIME_LOG.INSUFFICIENT_PERMISSION,
      'Insufficient permission to access this time log',
      HttpStatus.FORBIDDEN,
    );
  }
}

export class TimeLogFutureDateException extends AppException {
  constructor() {
    super(
      ErrorCode.TIME_LOG.FUTURE_DATE,
      'Cannot log time for a future date',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class TimeLogCannotLogOnBehalfException extends AppException {
  constructor() {
    super(
      ErrorCode.TIME_LOG.CANNOT_LOG_ON_BEHALF,
      'You do not have permission to log time on behalf of this user',
      HttpStatus.FORBIDDEN,
    );
  }
}
