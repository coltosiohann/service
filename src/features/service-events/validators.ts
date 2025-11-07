import { z } from 'zod';

export const serviceEventPayloadSchema = z.object({
  orgId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  type: z.enum(['OIL_CHANGE', 'REVISION', 'REPAIR', 'INSPECTION', 'OTHER']),
  date: z.coerce.date(),
  odometerKm: z.coerce.number().nonnegative().optional().nullable(),
  nextDueKm: z.coerce.number().positive().optional().nullable(),
  nextDueDate: z.coerce.date().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const serviceEventUpdateSchema = serviceEventPayloadSchema.partial({
  orgId: true,
  vehicleId: true,
  type: true,
});

