import { z } from 'zod';

export const oilStockCreateSchema = z.object({
  orgId: z.string().uuid(),
  oilType: z.string().min(1, 'Tipul de ulei este obligatoriu.').max(100, 'Tipul de ulei poate avea cel mult 100 de caractere.'),
  brand: z.string().min(1, 'Marca este obligatorie.').max(100, 'Marca poate avea cel mult 100 de caractere.'),
  quantityLiters: z.coerce.number().min(0, 'Cantitatea trebuie sa fie pozitiva.').default(0),
  location: z
    .string()
    .max(100, 'Locatia poate avea cel mult 100 de caractere.')
    .optional()
    .nullable(),
});

export const oilStockUpdateSchema = oilStockCreateSchema.partial({
  orgId: true,
});

export const oilMovementCreateSchema = z.object({
  orgId: z.string().uuid(),
  stockId: z.string().uuid(),
  vehicleId: z.string().uuid().optional().nullable(),
  serviceEventId: z.string().uuid().optional().nullable(),
  type: z.enum(['INTRARE', 'IESIRE', 'UTILIZARE']),
  date: z.coerce.date(),
  quantityLiters: z.coerce.number().positive('Cantitatea trebuie sa fie pozitiva.'),
  odometerKm: z.coerce.number().nonnegative().optional().nullable(),
  notes: z.string().max(500, 'Observatiile pot avea cel mult 500 de caractere.').optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
});

export const oilUseSchema = z.object({
  orgId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  serviceEventId: z.string().uuid().optional().nullable(),
  stockId: z.string().uuid(),
  quantityLiters: z.coerce.number().positive('Cantitatea trebuie sa fie mai mare de 0 litri.'),
  date: z.coerce.date(),
  odometerKm: z.coerce.number().nonnegative().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const oilStockAdjustSchema = z.object({
  orgId: z.string().uuid(),
  stockId: z.string().uuid(),
  type: z.enum(['INTRARE', 'IESIRE']),
  quantityLiters: z.coerce.number().positive('Cantitatea trebuie sa fie pozitiva.'),
  date: z.coerce.date(),
  notes: z.string().max(500).optional().nullable(),
});

export type OilStockCreate = z.infer<typeof oilStockCreateSchema>;
export type OilStockUpdate = z.infer<typeof oilStockUpdateSchema>;
export type OilMovementCreate = z.infer<typeof oilMovementCreateSchema>;
export type OilUseInput = z.infer<typeof oilUseSchema>;
export type OilStockAdjust = z.infer<typeof oilStockAdjustSchema>;
