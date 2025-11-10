import { asc, and, eq } from 'drizzle-orm';

import { db, oilStockMovements, oilStocks } from '@/db';
import { NotFoundError, ValidationError } from '@/lib/errors';

import {
  oilStockCreateSchema,
  oilStockUpdateSchema,
  oilStockAdjustSchema,
  oilUseSchema,
  type OilUseInput,
} from './validators';

type DbClient = Pick<typeof db, 'query' | 'insert' | 'update' | 'select'>;

function normalizeText(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function toISODateString(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value;
}

export async function listOilStock(orgId: string) {
  if (!orgId) {
    return [];
  }

  const rows = await db
    .select({
      id: oilStocks.id,
      orgId: oilStocks.orgId,
      oilType: oilStocks.oilType,
      brand: oilStocks.brand,
      quantityLiters: oilStocks.quantityLiters,
      location: oilStocks.location,
      updatedAt: oilStocks.updatedAt,
      createdAt: oilStocks.createdAt,
    })
    .from(oilStocks)
    .where(eq(oilStocks.orgId, orgId))
    .orderBy(asc(oilStocks.oilType), asc(oilStocks.brand));

  return rows.map((row) => ({
    ...row,
    quantityLiters: Number(row.quantityLiters ?? 0),
  }));
}

export async function getOilStock(stockId: string, orgId: string) {
  const stock = await db.query.oilStocks.findFirst({
    where: (fields, operators) =>
      operators.and(operators.eq(fields.id, stockId), operators.eq(fields.orgId, orgId)),
  });

  if (!stock) {
    throw new NotFoundError('Uleiul nu a fost gasit.');
  }

  return {
    ...stock,
    quantityLiters: Number(stock.quantityLiters ?? 0),
  };
}

export async function createOilStock(payload: unknown) {
  const parsed = oilStockCreateSchema.safeParse(payload);

  if (!parsed.success) {
    throw new ValidationError('Date ulei invalide.', parsed.error.flatten());
  }

  const data = parsed.data;

  const [record] = await db
    .insert(oilStocks)
    .values({
      orgId: data.orgId,
      oilType: data.oilType.trim(),
      brand: data.brand.trim(),
      quantityLiters: data.quantityLiters.toString(),
      location: normalizeText(data.location),
    })
    .returning();

  if (data.quantityLiters > 0 && record) {
    await db.insert(oilStockMovements).values({
      stockId: record.id,
      orgId: record.orgId,
      type: 'INTRARE',
      date: toISODateString(new Date()) ?? new Date().toISOString().slice(0, 10),
      quantityLiters: data.quantityLiters.toString(),
      notes: 'Stoc initial',
    });
  }

  return record;
}

export async function updateOilStock(stockId: string, orgId: string, payload: unknown) {
  const parsed = oilStockUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    throw new ValidationError('Date ulei invalide.', parsed.error.flatten());
  }

  const data = parsed.data;

  const existing = await getOilStock(stockId, orgId);

  if (!existing) {
    throw new NotFoundError('Uleiul nu a fost gasit.');
  }

  const [record] = await db
    .update(oilStocks)
    .set({
      oilType: data.oilType?.trim() ?? existing.oilType,
      brand: data.brand?.trim() ?? existing.brand,
      location: data.location !== undefined ? normalizeText(data.location) : existing.location,
      updatedAt: new Date(),
    })
    .where(and(eq(oilStocks.id, stockId), eq(oilStocks.orgId, orgId)))
    .returning();

  return record;
}

export async function deleteOilStock(stockId: string, orgId: string) {
  const stock = await getOilStock(stockId, orgId);

  if (!stock) {
    throw new NotFoundError('Uleiul nu a fost gasit.');
  }

  await db
    .delete(oilStocks)
    .where(and(eq(oilStocks.id, stockId), eq(oilStocks.orgId, orgId)));

  return stock;
}

async function changeStockQuantity(
  client: DbClient,
  {
    orgId,
    stockId,
    type,
    quantityLiters,
    vehicleId,
    serviceEventId,
    date,
    odometerKm,
    notes,
    userId,
  }: {
    orgId: string;
    stockId: string;
    type: 'INTRARE' | 'IESIRE' | 'UTILIZARE';
    quantityLiters: number;
    vehicleId?: string | null;
    serviceEventId?: string | null;
    date: Date | string;
    odometerKm?: number | null;
    notes?: string | null;
    userId?: string | null;
  },
) {
  const stock = await client.query.oilStocks.findFirst({
    where: (fields, operators) =>
      operators.and(operators.eq(fields.id, stockId), operators.eq(fields.orgId, orgId)),
  });

  if (!stock) {
    throw new NotFoundError('Uleiul selectat nu exista in stoc.');
  }

  const currentQuantity = Number(stock.quantityLiters ?? 0);
  let delta = 0;

  if (type === 'INTRARE') {
    delta = quantityLiters;
  } else if (type === 'IESIRE' || type === 'UTILIZARE') {
    delta = -quantityLiters;
  }

  const newQuantity = currentQuantity + delta;

  if (newQuantity < 0) {
    throw new ValidationError(
      `Stoc insuficient pentru ${stock.oilType} ${stock.brand}. Disponibil: ${currentQuantity.toFixed(2)} litri.`,
    );
  }

  await client
    .update(oilStocks)
    .set({
      quantityLiters: newQuantity.toString(),
      updatedAt: new Date(),
    })
    .where(and(eq(oilStocks.id, stockId), eq(oilStocks.orgId, orgId)));

  await client.insert(oilStockMovements).values({
    stockId,
    orgId,
    vehicleId: vehicleId ?? null,
    serviceEventId: serviceEventId ?? null,
    type,
    date: toISODateString(date) ?? new Date().toISOString().slice(0, 10),
    quantityLiters: quantityLiters.toString(),
    odometerKm: odometerKm != null ? odometerKm.toString() : null,
    notes: normalizeText(notes),
    userId: userId ?? null,
  });

  return { ...stock, quantityLiters: newQuantity };
}

export async function adjustOilStock(payload: unknown, userId?: string) {
  const parsed = oilStockAdjustSchema.safeParse(payload);

  if (!parsed.success) {
    throw new ValidationError('Date ajustare invalide.', parsed.error.flatten());
  }

  const data = parsed.data;

  const result = await db.transaction(async (tx) => {
    const updated = await changeStockQuantity(tx, {
      orgId: data.orgId,
      stockId: data.stockId,
      type: data.type,
      quantityLiters: data.quantityLiters,
      date: data.date,
      notes: data.notes,
      userId,
    });

    return updated;
  });

  return result;
}

export async function recordOilUsage(payload: OilUseInput, userId?: string) {
  const parsed = oilUseSchema.safeParse(payload);

  if (!parsed.success) {
    throw new ValidationError('Date utilizare ulei invalide.', parsed.error.flatten());
  }

  const data = parsed.data;

  await db.transaction(async (tx) => {
    await changeStockQuantity(tx, {
      orgId: data.orgId,
      stockId: data.stockId,
      type: 'UTILIZARE',
      quantityLiters: data.quantityLiters,
      vehicleId: data.vehicleId,
      serviceEventId: data.serviceEventId,
      date: data.date,
      odometerKm: data.odometerKm,
      notes: data.notes,
      userId,
    });
  });
}

export async function listVehicleOilUsage(vehicleId: string, orgId: string, limit = 10) {
  if (!orgId || !vehicleId) {
    return [];
  }

  const rows = await db.query.oilStockMovements.findMany({
    where: (fields, operators) =>
      operators.and(
        operators.eq(fields.vehicleId, vehicleId),
        operators.eq(fields.orgId, orgId),
        operators.eq(fields.type, 'UTILIZARE'),
      ),
    orderBy: (fields, operators) => [operators.desc(fields.date), operators.desc(fields.createdAt)],
    with: {
      stock: {
        columns: {
          oilType: true,
          brand: true,
        },
      },
    },
    limit,
  });

  return rows.map((row) => ({
    id: row.id,
    stockId: row.stockId,
    type: row.type,
    date: row.date,
    quantityLiters: row.quantityLiters ? Number(row.quantityLiters) : 0,
    odometerKm: row.odometerKm ? Number(row.odometerKm) : null,
    notes: row.notes,
    oilType: row.stock?.oilType ?? 'N/A',
    brand: row.stock?.brand ?? 'N/A',
    createdAt: row.createdAt,
  }));
}

export async function listOilStockMovements(stockId: string, orgId: string, limit = 50) {
  if (!orgId || !stockId) {
    return [];
  }

  const rows = await db.query.oilStockMovements.findMany({
    where: (fields, operators) =>
      operators.and(operators.eq(fields.stockId, stockId), operators.eq(fields.orgId, orgId)),
    orderBy: (fields, operators) => [operators.desc(fields.date), operators.desc(fields.createdAt)],
    with: {
      vehicle: {
        columns: {
          licensePlate: true,
          make: true,
          model: true,
        },
      },
    },
    limit,
  });

  return rows.map((row) => ({
    id: row.id,
    vehicleId: row.vehicleId,
    type: row.type,
    date: row.date,
    quantityLiters: row.quantityLiters ? Number(row.quantityLiters) : 0,
    odometerKm: row.odometerKm ? Number(row.odometerKm) : null,
    notes: row.notes,
    vehicleLicensePlate: row.vehicle?.licensePlate ?? null,
    vehicleName: row.vehicle ? `${row.vehicle.make} ${row.vehicle.model}` : null,
    createdAt: row.createdAt,
  }));
}

export async function listAllOilMovements(orgId: string, limit = 100) {
  if (!orgId) {
    return [];
  }

  const rows = await db.query.oilStockMovements.findMany({
    where: (fields, operators) => operators.eq(fields.orgId, orgId),
    orderBy: (fields, operators) => [operators.desc(fields.date), operators.desc(fields.createdAt)],
    with: {
      stock: {
        columns: {
          oilType: true,
          brand: true,
        },
      },
      vehicle: {
        columns: {
          licensePlate: true,
          make: true,
          model: true,
        },
      },
    },
    limit,
  });

  return rows.map((row) => ({
    id: row.id,
    stockId: row.stockId,
    vehicleId: row.vehicleId,
    type: row.type,
    date: row.date,
    quantityLiters: row.quantityLiters ? Number(row.quantityLiters) : 0,
    odometerKm: row.odometerKm ? Number(row.odometerKm) : null,
    notes: row.notes,
    oilType: row.stock?.oilType ?? 'N/A',
    brand: row.stock?.brand ?? 'N/A',
    vehicleLicensePlate: row.vehicle?.licensePlate ?? null,
    vehicleName: row.vehicle ? `${row.vehicle.make} ${row.vehicle.model}` : null,
    createdAt: row.createdAt,
  }));
}
