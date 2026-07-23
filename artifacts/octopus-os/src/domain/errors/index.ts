export class AppError extends Error {
  constructor(message: string, public code: string, public status?: number) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ApiError extends AppError {
  constructor(message: string, status?: number) {
    super(message, "API_ERROR", status);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, "AUTHENTICATION_ERROR", 401);
  }
}
