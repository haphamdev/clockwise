import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';
import { ErrorCode } from './error-codes';

export class TaskNotFoundException extends AppException {
  constructor() {
    super(ErrorCode.TASK.NOT_FOUND, 'Task not found', HttpStatus.NOT_FOUND);
  }
}

export class TaskAlreadyExistsException extends AppException {
  constructor() {
    super(
      ErrorCode.TASK.ALREADY_EXISTS,
      'A task with this label already exists in the project',
      HttpStatus.CONFLICT,
    );
  }
}
