import { HttpStatus } from "@nestjs/common";
import { AppException } from "./app.exception";
import { ErrorCode } from "./error-codes";

export class TeamNotFoundException extends AppException {
  constructor() {
    super(ErrorCode.TEAM.NOT_FOUND, "Team not found", HttpStatus.NOT_FOUND);
  }
}

export class TeamAlreadyExistsException extends AppException {
  constructor() {
    super(
      ErrorCode.TEAM.ALREADY_EXISTS,
      "Team name already exists",
      HttpStatus.CONFLICT,
    );
  }
}

export class TeamArchivedException extends AppException {
  constructor() {
    super(
      ErrorCode.TEAM.ARCHIVED,
      "Cannot modify an archived team",
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class TeamNotArchivedException extends AppException {
  constructor() {
    super(
      ErrorCode.TEAM.NOT_ARCHIVED,
      "Team is not archived",
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class TeamLastManagerException extends AppException {
  constructor() {
    super(
      ErrorCode.TEAM.LAST_MANAGER,
      "Team must have at least one manager",
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class TeamMemberAlreadyExistsException extends AppException {
  constructor() {
    super(
      ErrorCode.TEAM.MEMBER_ALREADY_EXISTS,
      "User is already a member of this team",
      HttpStatus.CONFLICT,
    );
  }
}

export class TeamMemberNotFoundException extends AppException {
  constructor() {
    super(
      ErrorCode.TEAM.MEMBER_NOT_FOUND,
      "User is not a member of this team",
      HttpStatus.NOT_FOUND,
    );
  }
}

export class TeamUserNotFoundException extends AppException {
  constructor() {
    super(
      ErrorCode.TEAM.USER_NOT_FOUND,
      "User not found or not active in this organization",
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class TeamContextRequiredException extends AppException {
  constructor() {
    super(
      ErrorCode.TEAM.CONTEXT_REQUIRED,
      "Team context required for this endpoint",
      HttpStatus.FORBIDDEN,
    );
  }
}

export class TeamNotAMemberException extends AppException {
  constructor() {
    super(
      ErrorCode.TEAM.NOT_A_MEMBER,
      "You are not a member of this team",
      HttpStatus.FORBIDDEN,
    );
  }
}

export class TeamInsufficientRoleException extends AppException {
  constructor() {
    super(
      ErrorCode.TEAM.INSUFFICIENT_ROLE,
      "You do not have the required role in this team",
      HttpStatus.FORBIDDEN,
    );
  }
}
