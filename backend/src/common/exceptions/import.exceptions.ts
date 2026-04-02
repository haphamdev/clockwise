import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';
import { ErrorCode } from './error-codes';

export class ImportUnsupportedTypeException extends AppException {
  constructor(type: string) {
    super(
      ErrorCode.IMPORT.UNSUPPORTED_TYPE,
      `Unsupported import type: ${type}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class ImportJobNotFoundException extends AppException {
  constructor() {
    super(ErrorCode.IMPORT.JOB_NOT_FOUND, 'Import job not found', HttpStatus.NOT_FOUND);
  }
}

export class ImportNoValidRowsException extends AppException {
  constructor() {
    super(
      ErrorCode.IMPORT.NO_VALID_ROWS,
      'No valid rows to import',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class ImportFileTooLargeException extends AppException {
  constructor() {
    super(
      ErrorCode.IMPORT.FILE_TOO_LARGE,
      'CSV file exceeds maximum size of 5MB',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class ImportParseException extends AppException {
  constructor(message: string) {
    super(ErrorCode.IMPORT.PARSE_ERROR, message, HttpStatus.BAD_REQUEST);
  }
}

export class ImportPreviewExpiredException extends AppException {
  constructor() {
    super(
      ErrorCode.IMPORT.PREVIEW_EXPIRED,
      'Import preview has expired or is invalid. Please re-upload the CSV.',
      HttpStatus.BAD_REQUEST,
    );
  }
}
