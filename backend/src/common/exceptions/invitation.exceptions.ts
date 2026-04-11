import { HttpStatus } from "@nestjs/common";
import { AppException } from "./app.exception";
import { ErrorCode } from "./error-codes";

export class InvitationNotFoundException extends AppException {
  constructor() {
    super(
      ErrorCode.INVITATION.NOT_FOUND,
      "Invitation not found",
      HttpStatus.NOT_FOUND,
    );
  }
}

export class InvitationAlreadyAcceptedException extends AppException {
  constructor() {
    super(
      ErrorCode.INVITATION.ALREADY_ACCEPTED,
      "Invitation has already been accepted",
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class InvitationAlreadyRevokedException extends AppException {
  constructor() {
    super(
      ErrorCode.INVITATION.ALREADY_REVOKED,
      "Invitation has already been revoked",
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class InvitationExpiredException extends AppException {
  constructor() {
    super(
      ErrorCode.INVITATION.EXPIRED,
      "Invitation has expired",
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class InvitationEmailAlreadyInvitedException extends AppException {
  constructor() {
    super(
      ErrorCode.INVITATION.EMAIL_ALREADY_INVITED,
      "An active invitation already exists for this email",
      HttpStatus.CONFLICT,
    );
  }
}

export class InvitationEmailAlreadyRegisteredException extends AppException {
  constructor() {
    super(
      ErrorCode.INVITATION.EMAIL_ALREADY_REGISTERED,
      "An active user with this email already exists",
      HttpStatus.CONFLICT,
    );
  }
}

export class InvitationInvalidTeamAssignmentException extends AppException {
  constructor() {
    super(
      ErrorCode.INVITATION.INVALID_TEAM_ASSIGNMENT,
      "One or more team assignments are invalid",
      HttpStatus.BAD_REQUEST,
    );
  }
}
