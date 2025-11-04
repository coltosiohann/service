import { z } from 'zod';

export const odometerLogSchema = z.object({
  orgId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  date: z.coerce.date(),
  valueKm: z.coerce.number().nonnegative(),
  source: z.enum(['MANUAL', 'IMPORT']).optional().default('MANUAL'),
});

