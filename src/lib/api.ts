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

  // Handle database errors (check both direct error and nested cause)
  const dbError = (error && typeof error === 'object' && 'cause' in error
    ? error.cause
    : error) as { code?: string; detail?: string; constraint?: string };

  if (dbError && 'code' in dbError) {
    // PostgreSQL unique constraint violation
    if (dbError.code === '23505') {
      let message = 'Există deja un vehicul cu aceste date.';

      if (dbError.constraint === 'vehicles_vin_unique') {
        message = 'Există deja un vehicul cu acest VIN.';
      } else if (dbError.constraint === 'vehicles_org_license_plate_unique') {
        message = 'Există deja un vehicul cu acest număr de înmatriculare.';
      }

      return Response.json({ message }, { status: 409 });
    }

    // PostgreSQL check constraint violation
    if (dbError.code === '23514') {
      let message = 'Datele introduse nu respectă restricțiile.';

      if (dbError.constraint === 'vehicles_truck_copie_conforma_check') {
        message = 'Copie Conformă poate fi setată doar pentru camioane.';
      } else if (dbError.constraint === 'vehicles_truck_authorization_check') {
        message = 'Autorizația de tonaj poate fi setată doar pentru camioane.';
      } else if (dbError.constraint === 'vehicles_truck_tachograph_check') {
        message = 'Tahograful poate fi setat doar pentru camioane.';
      }

      return Response.json({ message }, { status: 422 });
    }
  }

  console.error('Unexpected error:', error);

  return Response.json({ message: 'Eroare internă neașteptată.' }, { status: 500 });
}
