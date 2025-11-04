export class AppError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Autentificare necesară.') {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Nu aveți permisiunea pentru această acțiune.') {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resursa nu a fost găsită.') {
    super(404, message);
  }
}

export class ValidationError extends AppError {
  details?: unknown;

  constructor(message = 'Date invalide.', details?: unknown) {
    super(422, message);
    this.details = details;
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Prea multe cereri. Încercați din nou mai târziu.') {
    super(429, message);
  }
}
