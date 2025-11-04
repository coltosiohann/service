import { z } from 'zod';

const vehicleTypeEnum = z.enum(['CAR', 'TRUCK']);
const vehicleStatusEnum = z.enum(['OK', 'DUE_SOON', 'OVERDUE']);

const tireUsageEntrySchema = z.object({
  stockId: z.string().uuid(),
  quantity: z.coerce.number().int().positive('Cantitatea trebuie sa fie pozitiva.'),
  reason: z
    .string()
    .max(200, 'Motivul poate avea cel mult 200 de caractere.')
    .optional()
    .nullable(),
});

export const vehiclePayloadSchema = z
  .object({
    orgId: z.string().uuid(),
    type: vehicleTypeEnum,
    make: z.string().min(1, 'Marca este obligatorie.'),
    model: z.string().min(1, 'Modelul este obligatoriu.'),
    year: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 1),
    vin: z
      .string()
      .min(11)
      .max(17)
      .regex(/^[A-HJ-NPR-Z0-9]+$/i, 'VIN invalid.')
      .optional()
      .nullable(),
    licensePlate: z.string().min(3, 'Numărul de înmatriculare este obligatoriu.'),
    currentOdometerKm: z.coerce.number().nonnegative(),
    lastOilChangeDate: z.coerce.date().optional().nullable(),
    lastRevisionDate: z.coerce.date().optional().nullable(),
    nextRevisionAtKm: z.coerce.number().positive().optional().nullable(),
    nextRevisionDate: z.coerce.date().optional().nullable(),
    insuranceProvider: z.string().min(1, 'Asiguratorul este obligatoriu.'),
    insurancePolicyNumber: z.string().min(1, 'Numărul poliței este obligatoriu.'),
    insuranceEndDate: z.coerce.date().optional().nullable(),
    hasHeavyTonnageAuthorization: z.coerce.boolean().optional().nullable(),
    tachographCheckDate: z.coerce.date().optional().nullable(),
    status: vehicleStatusEnum.optional(),
    tireUsageReason: z
      .string()
      .max(200, 'Motivul poate avea cel mult 200 de caractere.')
      .optional()
      .nullable(),
    tiresUsage: z.array(tireUsageEntrySchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'CAR') {
      if (data.hasHeavyTonnageAuthorization != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'AutorizaE>ia de tonaj este permis?? doar pentru camioane.',
          path: ['hasHeavyTonnageAuthorization'],
        });
      }
      if (data.tachographCheckDate != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Data tahograf este disponibil?? doar pentru camioane.',
          path: ['tachographCheckDate'],
        });
      }
      if (data.tiresUsage && data.tiresUsage.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Consum anvelope disponibil doar pentru camioane.',
          path: ['tiresUsage'],
        });
      }
    }
  });
export const vehicleUpdateSchema = vehiclePayloadSchema.partial({
  orgId: true,
  type: true,
});

export const vehicleQuerySchema = z.object({
  orgId: z.string().uuid(),
  type: vehicleTypeEnum.optional(),
  status: vehicleStatusEnum.optional(),
  insurance: z.enum(['active', 'expiring', 'expired']).optional(),
  search: z.string().optional(),
  truck: z
    .object({
      tonajMare: z.enum(['true', 'false']).optional(),
      tahograf: z.enum(['ok', 'soon', 'overdue', 'missing']).optional(),
    })
    .optional(),
});

export const bulkActionSchema = z.object({
  orgId: z.string().uuid(),
  vehicleIds: z.array(z.string().uuid()).min(1),
});
