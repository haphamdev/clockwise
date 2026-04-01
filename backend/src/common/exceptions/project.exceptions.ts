import { HttpStatus } from '@nestjs/common';
import { AppException } from './app.exception';
import { ErrorCode } from './error-codes';

export class ProjectNotFoundException extends AppException {
  constructor() {
    super(ErrorCode.PROJECT.NOT_FOUND, 'Project not found', HttpStatus.NOT_FOUND);
  }
}

export class ProjectAlreadyExistsException extends AppException {
  constructor() {
    super(ErrorCode.PROJECT.ALREADY_EXISTS, 'Project name already exists', HttpStatus.CONFLICT);
  }
}

export class ProjectArchivedException extends AppException {
  constructor() {
    super(ErrorCode.PROJECT.ARCHIVED, 'Cannot modify an archived project', HttpStatus.BAD_REQUEST);
  }
}

export class ProjectNotArchivedException extends AppException {
  constructor() {
    super(ErrorCode.PROJECT.NOT_ARCHIVED, 'Project is not archived', HttpStatus.BAD_REQUEST);
  }
}

export class ProjectTeamAlreadyAssignedException extends AppException {
  constructor() {
    super(
      ErrorCode.PROJECT.TEAM_ALREADY_ASSIGNED,
      'Team is already assigned to this project',
      HttpStatus.CONFLICT,
    );
  }
}

export class ProjectTeamNotAssignedException extends AppException {
  constructor() {
    super(
      ErrorCode.PROJECT.TEAM_NOT_ASSIGNED,
      'Team is not assigned to this project',
      HttpStatus.NOT_FOUND,
    );
  }
}

export class ProjectInsufficientRoleException extends AppException {
  constructor() {
    super(
      ErrorCode.PROJECT.INSUFFICIENT_ROLE,
      'You do not have sufficient permissions for this project',
      HttpStatus.FORBIDDEN,
    );
  }
}

export class ProjectNoTeamsException extends AppException {
  constructor() {
    super(
      ErrorCode.PROJECT.NO_TEAMS,
      'At least one team must be assigned to the project',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class ProjectLastTeamException extends AppException {
  constructor() {
    super(
      ErrorCode.PROJECT.LAST_TEAM,
      'Cannot remove the last team from a project',
      HttpStatus.BAD_REQUEST,
    );
  }
}
