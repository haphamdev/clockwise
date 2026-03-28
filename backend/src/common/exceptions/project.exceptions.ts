import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';
import { ErrorCode } from './error-codes';

export class ProjectNotFoundException extends AppException {
  constructor() {
    super(ErrorCode.PROJECT.NOT_FOUND, 'Project not found', HttpStatus.NOT_FOUND);
  }
}

export class ProjectContextRequiredException extends AppException {
  constructor() {
    super(
      ErrorCode.PROJECT.CONTEXT_REQUIRED,
      'Project context required for this endpoint',
      HttpStatus.FORBIDDEN,
    );
  }
}

export class ProjectNotOwnerException extends AppException {
  constructor() {
    super(
      ErrorCode.PROJECT.NOT_OWNER,
      'Only the project owner can perform this action',
      HttpStatus.FORBIDDEN,
    );
  }
}
