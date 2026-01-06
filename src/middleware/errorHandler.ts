export class ApiError extends Error {
  fileStatusCode: number;

  constructor(fileStatusCode: number, message: string) {
    super(message);
    this.fileStatusCode = fileStatusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
