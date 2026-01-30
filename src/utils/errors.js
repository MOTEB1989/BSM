export class AppError extends Error {
  constructor(message, status = 500, code = "APP_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}
