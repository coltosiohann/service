import { asc, desc, and, eq } from 'drizzle-orm';

import { db, tireStockMovements, tireStocks } from '@/db';
import { NotFoundError, ValidationError } from '@/lib/errors';

import {
  tireStockCreateSchema,
  tireStockAdjustSchema,
  tireMountSchema,
  tireUnmountSchema,
  type TireMountInput,
  type TireUnmountInput,
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

export async function listTireStock(orgId: string) {
  if (!orgId) {
    return [];
  }

  const rows = await db
    .select({
      id: tireStocks.id,
      orgId: tireStocks.orgId,
      brand: tireStocks.brand,
      model: tireStocks.model,
      dimension: tireStocks.dimension,
      dot: tireStocks.dot,
      quantity: tireStocks.quantity,
      location: tireStocks.location,
      updatedAt: tireStocks.updatedAt,
      createdAt: tireStocks.createdAt,
    })
    .from(tireStocks)
    .where(eq(tireStocks.orgId, orgId))
    .orderBy(asc(tireStocks.brand), asc(tireStocks.model));

  return rows.map((row) => ({
    ...row,
    quantity: Number(row.quantity ?? 0),
  }));
}

export async function getTireStock(stockId: string, orgId: string) {
  const stock = await db.query.tireStocks.findFirst({
    where: (fields, operators) =>
      operators.and(operators.eq(fields.id, stockId), operators.eq(fields.orgId, orgId)),
  });

  if (!stock) {
    throw new NotFoundError('Anvelopa nu a fost gasita.');
  }

  return {
    ...stock,
    quantity: Number(stock.quantity ?? 0),
  };
}

export async function createTireStock(payload: unknown) {
  const parsed = tireStockCreateSchema.safeParse(payload);

  if (!parsed.success) {
    throw new ValidationError('Date anvelopa invalide.', parsed.error.flatten());
  }

  const data = parsed.data;

  const [record] = await db
    .insert(tireStocks)
    .values({
      orgId: data.orgId,
      brand: data.brand.trim(),
      model: data.model.trim(),
      dimension: data.dimension.trim().toUpperCase(),
      dot: data.dot.trim().toUpperCase(),
      quantity: data.quantity,
      location: normalizeText(data.location),
    })
    .returning();

  if (data.quantity > 0 && record) {
    await db.insert(tireStockMovements).values({
      stockId: record.id,
      orgId: record.orgId,
      type: 'INTRARE',
      date: toISODateString(new Date()) ?? new Date().toISOString().slice(0, 10),
      notes: 'Stoc initial',
    });
  }

  return record;
}

async function changeStockQuantity(
  client: DbClient,
  {
    orgId,
    stockId,
    type,
    quantity,
    vehicleId,
    date,
    odometerKm,
    notes,
    userId,
  }: {
    orgId: string;
    stockId: string;
    type: 'INTRARE' | 'IESIRE' | 'MONTARE' | 'DEMONTARE';
    quantity: number;
    vehicleId?: string | null;
    date: Date | string;
    odometerKm?: number | null;
    notes?: string | null;
    userId?: string | null;
  },
) {
  const stock = await client.query.tireStocks.findFirst({
    where: (fields, operators) =>
      operators.and(operators.eq(fields.id, stockId), operators.eq(fields.orgId, orgId)),
  });

  if (!stock) {
    throw new NotFoundError('Anvelopa selectata nu exista in stoc.');
  }

  const currentQuantity = Number(stock.quantity ?? 0);
  let delta = 0;

  if (type === 'INTRARE' || type === 'DEMONTARE') {
    delta = quantity;
  } else if (type === 'IESIRE' || type === 'MONTARE') {
    delta = -quantity;
  }

  const newQuantity = currentQuantity + delta;

  if (newQuantity < 0) {
    throw new ValidationError(
      `Stoc insuficient pentru ${stock.brand} ${stock.model} ${stock.dimension}. Disponibil: ${currentQuantity}.`,
    );
  }

  await client
    .update(tireStocks)
    .set({
      quantity: newQuantity,
      updatedAt: new Date(),
    })
    .where(and(eq(tireStocks.id, stockId), eq(tireStocks.orgId, orgId)));

  await client.insert(tireStockMovements).values({
    stockId,
    orgId,
    vehicleId: vehicleId ?? null,
    type,
    date: toISODateString(date) ?? new Date().toISOString().slice(0, 10),
    odometerKm: odometerKm != null ? odometerKm.toString() : null,
    notes: normalizeText(notes),
    userId: userId ?? null,
  });

  return { ...stock, quantity: newQuantity };
}

export async function adjustTireStock(payload: unknown, userId?: string) {
  const parsed = tireStockAdjustSchema.safeParse(payload);

  if (!parsed.success) {
    throw new ValidationError('Date ajustare invalide.', parsed.error.flatten());
  }

  const data = parsed.data;

  const result = await db.transaction(async (tx) => {
    const updated = await changeStockQuantity(tx, {
      orgId: data.orgId,
      stockId: data.stockId,
      type: data.type,
      quantity: data.quantity,
      date: data.date,
      notes: data.notes,
      userId,
    });

    return updated;
  });

  return result;
}

export async function mountTires(payload: TireMountInput, userId?: string) {
  const parsed = tireMountSchema.safeParse(payload);

  if (!parsed.success) {
    throw new ValidationError('Date montare anvelope invalide.', parsed.error.flatten());
  }

  const data = parsed.data;

  await db.transaction(async (tx) => {
    await changeStockQuantity(tx, {
      orgId: data.orgId,
      stockId: data.stockId,
      type: 'MONTARE',
      quantity: 1,
      vehicleId: data.vehicleId,
      date: data.date,
      odometerKm: data.odometerKm,
      notes: data.notes,
      userId,
    });
  });
}

export async function unmountTires(payload: TireUnmountInput, userId?: string) {
  const parsed = tireUnmountSchema.safeParse(payload);

  if (!parsed.success) {
    throw new ValidationError('Date demontare anvelope invalide.', parsed.error.flatten());
  }

  const data = parsed.data;

  await db.transaction(async (tx) => {
    await changeStockQuantity(tx, {
      orgId: data.orgId,
      stockId: data.stockId,
      type: 'DEMONTARE',
      quantity: 1,
      vehicleId: data.vehicleId,
      date: data.date,
      odometerKm: data.odometerKm,
      notes: data.notes,
      userId,
    });
  });
}

export async function listVehicleTireMovements(vehicleId: string, orgId: string, limit = 10) {
  if (!orgId || !vehicleId) {
    return [];
  }

  const rows = await db.query.tireStockMovements.findMany({
    where: (fields, operators) =>
      operators.and(
        operators.eq(fields.vehicleId, vehicleId),
        operators.eq(fields.orgId, orgId),
      ),
    orderBy: (fields, operators) => [operators.desc(fields.date), operators.desc(fields.createdAt)],
    with: {
      stock: {
        columns: {
          brand: true,
          model: true,
          dimension: true,
          dot: true,
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
    odometerKm: row.odometerKm ? Number(row.odometerKm) : null,
    notes: row.notes,
    createdAt: row.createdAt,
    brand: row.stock?.brand ?? '',
    model: row.stock?.model ?? '',
    dimension: row.stock?.dimension ?? '',
    dot: row.stock?.dot ?? '',
  }));
}

export async function listStockMovements(stockId: string, orgId: string) {
  if (!orgId || !stockId) {
    return [];
  }

  const rows = await db.query.tireStockMovements.findMany({
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
      user: {
        columns: {
          name: true,
          email: true,
        },
      },
    },
    limit: 50,
  });

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    date: row.date,
    odometerKm: row.odometerKm ? Number(row.odometerKm) : null,
    notes: row.notes,
    createdAt: row.createdAt,
    vehicleLicensePlate: row.vehicle?.licensePlate ?? null,
    vehicleMake: row.vehicle?.make ?? null,
    vehicleModel: row.vehicle?.model ?? null,
    userName: row.user?.name ?? null,
    userEmail: row.user?.email ?? null,
  }));
}

export async function deleteTireStock(stockId: string, orgId: string) {
  const stock = await getTireStock(stockId, orgId);

  if (stock.quantity > 0) {
    throw new ValidationError(
      'Nu puteti sterge o anvelopa cu stoc disponibil. Reduceti mai intai stocul la 0.',
    );
  }

  const [deleted] = await db
    .delete(tireStocks)
    .where(and(eq(tireStocks.id, stockId), eq(tireStocks.orgId, orgId)))
    .returning();

  if (!deleted) {
    throw new NotFoundError('Anvelopa nu a fost gasita.');
  }

  return deleted;
}

export async function getMountedTires(vehicleId: string, orgId: string) {
  if (!orgId || !vehicleId) {
    return [];
  }

  const movements = await db
    .select({
      stockId: tireStockMovements.stockId,
      type: tireStockMovements.type,
      date: tireStockMovements.date,
      odometerKm: tireStockMovements.odometerKm,
      brand: tireStocks.brand,
      model: tireStocks.model,
      dimension: tireStocks.dimension,
      dot: tireStocks.dot,
    })
    .from(tireStockMovements)
    .innerJoin(tireStocks, eq(tireStockMovements.stockId, tireStocks.id))
    .where(
      and(
        eq(tireStockMovements.vehicleId, vehicleId),
        eq(tireStockMovements.orgId, orgId),
      ),
    )
    .orderBy(desc(tireStockMovements.date), desc(tireStockMovements.createdAt));

  const mountedMap = new Map<
    string,
    {
      stockId: string;
      brand: string;
      model: string;
      dimension: string;
      dot: string;
      mountDate: string;
      mountOdometerKm: number | null;
    }
  >();

  for (const movement of movements) {
    if (!mountedMap.has(movement.stockId)) {
      if (movement.type === 'MONTARE') {
        mountedMap.set(movement.stockId, {
          stockId: movement.stockId,
          brand: movement.brand,
          model: movement.model,
          dimension: movement.dimension,
          dot: movement.dot,
          mountDate: movement.date,
          mountOdometerKm: movement.odometerKm ? Number(movement.odometerKm) : null,
        });
      }
    } else if (movement.type === 'DEMONTARE') {
      mountedMap.delete(movement.stockId);
    }
  }

  return Array.from(mountedMap.values());
}
