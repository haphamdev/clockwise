import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';
import { ErrorCode } from './error-codes';

export class UserNotFoundException extends AppException {
  constructor() {
    super(ErrorCode.USER.NOT_FOUND, 'User not found', HttpStatus.NOT_FOUND);
  }
}

export class UserAlreadyDeactivatedException extends AppException {
  constructor() {
    super(
      ErrorCode.USER.ALREADY_DEACTIVATED,
      'User is already deactivated',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class UserAlreadyActiveException extends AppException {
  constructor() {
    super(ErrorCode.USER.ALREADY_ACTIVE, 'User is already active', HttpStatus.BAD_REQUEST);
  }
}

export class UserLastAdminException extends AppException {
  constructor() {
    super(
      ErrorCode.USER.LAST_ADMIN,
      'Cannot deactivate the last admin',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class UserCannotModifySelfException extends AppException {
  constructor() {
    super(
      ErrorCode.USER.CANNOT_MODIFY_SELF,
      'Cannot modify your own account',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class UserInvalidTeamAssignmentException extends AppException {
  constructor() {
    super(
      ErrorCode.USER.INVALID_TEAM_ASSIGNMENT,
      'One or more team assignments are invalid',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class UserWouldOrphanTeamException extends AppException {
  constructor() {
    super(
      ErrorCode.USER.WOULD_ORPHAN_TEAM,
      'Cannot remove user from a team where they are the only manager',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class UserNotDeactivatedException extends AppException {
  constructor() {
    super(
      ErrorCode.USER.NOT_DEACTIVATED,
      'Only deactivated users can be reactivated',
      HttpStatus.BAD_REQUEST,
    );
  }
}
