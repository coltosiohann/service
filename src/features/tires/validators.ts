import { z } from 'zod';

export const tireStockCreateSchema = z.object({
  orgId: z.string().uuid(),
  size: z.string().min(3, 'Dimensiunea este obligatorie.').max(100),
  brand: z
    .string()
    .max(60, 'Marca poate avea cel mult 60 de caractere.')
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(200, 'NotiEle pot avea cel mult 200 de caractere.')
    .optional()
    .nullable(),
  quantity: z.coerce.number().int().min(0, 'Cantitatea trebuie sa fie pozitiva.').default(0),
  minQuantity: z
    .coerce.number()
    .int()
    .min(0, 'Stocul minim trebuie sa fie pozitiv.')
    .optional()
    .nullable(),
});

export const tireStockAdjustSchema = z.object({
  orgId: z.string().uuid(),
  stockId: z.string().uuid(),
  change: z.coerce.number().int(),
  reason: z.string().max(200, 'Motivul poate avea cel mult 200 de caractere.').optional().nullable(),
  vehicleId: z.string().uuid().optional().nullable(),
});

export const tireConsumptionSchema = z.object({
  orgId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  reason: z
    .string()
    .max(200, 'Motivul poate avea cel mult 200 de caractere.')
    .optional()
    .nullable(),
  items: z
    .array(
      z.object({
        stockId: z.string().uuid(),
        quantity: z.coerce.number().int().positive('Cantitatea trebuie sa fie pozitiva.'),
        reason: z
          .string()
          .max(200, 'Motivul poate avea cel mult 200 de caractere.')
          .optional()
          .nullable(),
      }),
    )
    .min(1, 'Selectati cel putin un tip de anvelopa.'),
});

export type TireConsumptionInput = z.infer<typeof tireConsumptionSchema>;
