import { HttpException, HttpStatus } from '@nestjs/common';

export class EmailAlreadyExistsException extends HttpException {
  constructor(email: string) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message: `The email '${email}' is already in use.`,
        errorCode: 'EMAIL_ALREADY_EXISTS',
      },
      HttpStatus.CONFLICT,
    );
  }
}
