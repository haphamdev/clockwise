import { HttpStatus } from "@nestjs/common";
import { AppException } from "./app.exception";
import { ErrorCode } from "./error-codes";

export class NoInvitationException extends AppException {
  constructor() {
    super(
      ErrorCode.AUTH.NO_INVITATION,
      "No invitation found for this email. Contact your admin to get access.",
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class AccountDeactivatedException extends AppException {
  constructor() {
    super(
      ErrorCode.AUTH.ACCOUNT_DEACTIVATED,
      "Your account has been deactivated. Contact your admin.",
      HttpStatus.FORBIDDEN,
    );
  }
}

export class AccountNotActiveException extends AppException {
  constructor() {
    super(
      ErrorCode.AUTH.ACCOUNT_NOT_ACTIVE,
      "Account is not active",
      HttpStatus.FORBIDDEN,
    );
  }
}

export class InvalidRefreshTokenException extends AppException {
  constructor() {
    super(
      ErrorCode.AUTH.INVALID_REFRESH_TOKEN,
      "Invalid refresh token",
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class NoRefreshTokenException extends AppException {
  constructor() {
    super(
      ErrorCode.AUTH.NO_REFRESH_TOKEN,
      "No refresh token provided",
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class UserNotFoundException extends AppException {
  constructor() {
    super(
      ErrorCode.AUTH.USER_NOT_FOUND,
      "User not found",
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class NotAuthenticatedException extends AppException {
  constructor() {
    super(
      ErrorCode.AUTH.NOT_AUTHENTICATED,
      "Not authenticated",
      HttpStatus.FORBIDDEN,
    );
  }
}

export class DemoLoginDisabledException extends AppException {
  constructor() {
    super(
      ErrorCode.AUTH.DEMO_LOGIN_DISABLED,
      "Demo login is disabled",
      HttpStatus.FORBIDDEN,
    );
  }
}

export class DemoUserNotAvailableException extends AppException {
  constructor() {
    super(
      ErrorCode.AUTH.DEMO_USER_NOT_AVAILABLE,
      "Demo account is not available. Re-run the demo seed.",
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
