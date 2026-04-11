import { HttpStatus } from "@nestjs/common";
import { ValidationError } from "class-validator";
import { AppException } from "./app.exception";
import { ErrorCode } from "./error-codes";

function flattenErrors(errors: ValidationError[]): string[] {
  const messages: string[] = [];
  for (const err of errors) {
    if (err.constraints) {
      messages.push(...Object.values(err.constraints));
    }
    if (err.children?.length) {
      messages.push(...flattenErrors(err.children));
    }
  }
  return messages;
}

export class ValidationException extends AppException {
  constructor(errors: ValidationError[]) {
    super(
      ErrorCode.COMMON.VALIDATION_ERROR,
      flattenErrors(errors),
      HttpStatus.BAD_REQUEST,
    );
  }
}
