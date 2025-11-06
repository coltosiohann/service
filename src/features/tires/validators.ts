import { z } from 'zod';

export const tireStockCreateSchema = z.object({
  orgId: z.string().uuid(),
  brand: z.string().min(1, 'Marca este obligatorie.').max(100),
  model: z.string().min(1, 'Modelul este obligatoriu.').max(100),
  dimension: z.string().min(3, 'Dimensiunea este obligatorie.').max(50),
  dot: z.string().min(4, 'DOT este obligatoriu.').max(20),
  quantity: z.coerce.number().int().min(0, 'Cantitatea trebuie sa fie pozitiva.').default(0),
  location: z
    .string()
    .max(100, 'Locatia poate avea cel mult 100 de caractere.')
    .optional()
    .nullable(),
});

export const tireMovementCreateSchema = z.object({
  orgId: z.string().uuid(),
  stockId: z.string().uuid(),
  vehicleId: z.string().uuid().optional().nullable(),
  type: z.enum(['INTRARE', 'IESIRE', 'MONTARE', 'DEMONTARE']),
  date: z.coerce.date(),
  odometerKm: z.coerce.number().nonnegative().optional().nullable(),
  notes: z.string().max(500, 'Observatiile pot avea cel mult 500 de caractere.').optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
});

export const tireMountSchema = z.object({
  orgId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  stockId: z.string().uuid(),
  date: z.coerce.date(),
  odometerKm: z.coerce.number().nonnegative().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const tireUnmountSchema = z.object({
  orgId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  stockId: z.string().uuid(),
  date: z.coerce.date(),
  odometerKm: z.coerce.number().nonnegative().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const tireStockAdjustSchema = z.object({
  orgId: z.string().uuid(),
  stockId: z.string().uuid(),
  type: z.enum(['INTRARE', 'IESIRE']),
  quantity: z.coerce.number().int().positive('Cantitatea trebuie sa fie pozitiva.'),
  date: z.coerce.date(),
  notes: z.string().max(500).optional().nullable(),
});

export type TireStockCreate = z.infer<typeof tireStockCreateSchema>;
export type TireMovementCreate = z.infer<typeof tireMovementCreateSchema>;
export type TireMountInput = z.infer<typeof tireMountSchema>;
export type TireUnmountInput = z.infer<typeof tireUnmountSchema>;
export type TireStockAdjust = z.infer<typeof tireStockAdjustSchema>;
