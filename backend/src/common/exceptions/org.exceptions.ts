import { HttpStatus } from "@nestjs/common";
import { AppException } from "./app.exception";
import { ErrorCode } from "./error-codes";

export class OrgNotFoundException extends AppException {
  constructor() {
    super(
      ErrorCode.ORG.NOT_FOUND,
      "Organization not found",
      HttpStatus.NOT_FOUND,
    );
  }
}
