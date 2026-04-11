import { HttpException, HttpStatus } from "@nestjs/common";

export class AppException extends HttpException {
  public readonly code: string;

  constructor(
    code: string,
    message: string | string[],
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super({ code, message, statusCode: status }, status);
    this.code = code;
  }
}
