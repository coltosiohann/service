import { z } from 'zod';

export const documentKindEnum = z.enum(['INSURANCE', 'ITP', 'REGISTRATION', 'PHOTO', 'OTHER']);

export const uploadDocumentSchema = z.object({
  orgId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  kind: documentKindEnum,
  expiresAt: z.coerce.date().optional().nullable(),
});
