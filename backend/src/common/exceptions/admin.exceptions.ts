import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';
import { ErrorCode } from './error-codes';

export class AdminAccessRequiredException extends AppException {
  constructor() {
    super(ErrorCode.ADMIN.ACCESS_REQUIRED, 'Admin access required', HttpStatus.FORBIDDEN);
  }
}
