import { ZodError } from 'zod';

import { AppError, ValidationError } from './errors';

export function jsonResponse<T>(data: T, init?: ResponseInit) {
  return Response.json({ data }, init);
}

export function successMessage(message: string, init?: ResponseInit) {
  return Response.json({ message }, init);
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return Response.json(
      {
        message: error.message,
        ...(error instanceof ValidationError ? { details: error.details } : {}),
      },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return Response.json(
      {
        message: 'Date invalide.',
        details: error.flatten(),
      },
      { status: 422 },
    );
  }

  console.error(error);

  return Response.json({ message: 'Eroare internă neașteptată.' }, { status: 500 });
}
