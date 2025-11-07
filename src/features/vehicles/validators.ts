import { z } from 'zod';

const vehicleTypeEnum = z.enum(['CAR', 'TRUCK', 'EQUIPMENT', 'TRAILER']);
const vehicleStatusEnum = z.enum(['OK', 'DUE_SOON', 'OVERDUE']);

const optionalTrimmedString = (max: number, message: string) =>
  z
    .string()
    .max(max, message)
    .optional()
    .transform((value) => {
      if (value == null) {
        return undefined;
      }
      const trimmed = value.trim();
      return trimmed.length ? trimmed : undefined;
    });

const optionalNumber = <T extends z.ZodNumber>(schema: T) =>
  z.preprocess((value) => {
    if (value === '' || value === null || typeof value === 'undefined') {
      return undefined;
    }

    if (typeof value === 'number') {
      return Number.isNaN(value) ? undefined : value;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, schema.optional());

const optionalDate = () =>
  z
    .preprocess((value) => {
      if (value === '' || value === null || typeof value === 'undefined') {
        return undefined;
      }
      return value;
    }, z.coerce.date().optional())
    .nullable();

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
    make: optionalTrimmedString(100, 'Marca poate avea cel mult 100 de caractere.'),
    model: optionalTrimmedString(100, 'Modelul poate avea cel mult 100 de caractere.'),
    year: optionalNumber(z.number().int()),
    vin: optionalTrimmedString(17, 'VIN poate avea cel mult 17 caractere.'),
    licensePlate: optionalTrimmedString(50, 'Numarul de inmatriculare poate avea cel mult 50 de caractere.'),
    currentOdometerKm: optionalNumber(z.number().nonnegative()),
    lastOilChangeDate: optionalDate(),
    lastRevisionDate: optionalDate(),
    nextRevisionAtKm: optionalNumber(z.number().positive()),
    nextRevisionDate: optionalDate(),
    insurancePolicyNumber: optionalTrimmedString(120, 'Numarul politei poate avea cel mult 120 de caractere.'),
    insuranceStartDate: optionalDate(),
    insuranceEndDate: optionalDate(),
    hasHeavyTonnageAuthorization: z.coerce.boolean().optional().nullable(),
    tachographCheckDate: optionalDate(),
    copieConformaStartDate: optionalDate(),
    status: vehicleStatusEnum.optional(),
    tireUsageReason: z
      .string()
      .max(200, 'Motivul poate avea cel mult 200 de caractere.')
      .optional()
      .nullable(),
    tiresUsage: z.array(tireUsageEntrySchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'CAR' || data.type === 'EQUIPMENT') {
      if (data.hasHeavyTonnageAuthorization != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Autorizatia de tonaj este permisa doar pentru camioane.',
          path: ['hasHeavyTonnageAuthorization'],
        });
      }
      if (data.tachographCheckDate != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Data tahograf este disponibila doar pentru camioane.',
          path: ['tachographCheckDate'],
        });
      }
      if (data.copieConformaStartDate != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Copie conforma este disponibila doar pentru camioane.',
          path: ['copieConformaStartDate'],
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
