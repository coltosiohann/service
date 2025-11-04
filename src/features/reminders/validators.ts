import { z } from 'zod';

export const reminderQuerySchema = z.object({
  orgId: z.string().uuid(),
  status: z.enum(['PENDING', 'SENT', 'DISMISSED']).optional(),
  kind: z.enum(['DATE', 'ODOMETER']).optional(),
  view: z.enum(['all', 'overdue', 'soon', 'done']).optional(),
  vehicleId: z.string().uuid().optional(),
});

export const reminderUpdateSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  status: z.enum(['PENDING', 'SENT', 'DISMISSED']).optional(),
  lastNotifiedAt: z.coerce.date().optional(),
});

