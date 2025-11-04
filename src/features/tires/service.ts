import { asc, and, eq } from 'drizzle-orm';

import { db, tireStockMovements, tireStocks } from '@/db';
import { NotFoundError, ValidationError } from '@/lib/errors';

import {
  tireConsumptionSchema,
  type TireConsumptionInput,
  tireStockAdjustSchema,
  tireStockCreateSchema,
} from './validators';

type DbClient = Pick<typeof db, 'query' | 'insert' | 'update'>;

type ChangeStockParams = {
  orgId: string;
  stockId: string;
  delta: number;
  vehicleId?: string | null;
  reason?: string | null;
};

function normalizeText(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

async function changeStockQuantity(
  client: DbClient,
  { orgId, stockId, delta, vehicleId, reason }: ChangeStockParams,
) {
  const stock = await client.query.tireStocks.findFirst({
    where: (fields, operators) =>
      operators.and(operators.eq(fields.id, stockId), operators.eq(fields.orgId, orgId)),
  });

  if (!stock) {
    throw new NotFoundError('Anvelopa selectata nu exista in stoc.');
  }

  const currentQuantity = Number(stock.quantity ?? 0);
  const newQuantity = currentQuantity + delta;

  if (newQuantity < 0) {
    throw new ValidationError(
      `Stoc insuficient pentru ${stock.size}. Disponibil: ${currentQuantity}.`,
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
    change: delta,
    reason: normalizeText(reason),
  });

  return { ...stock, quantity: newQuantity };
}

export async function listTireStock(orgId: string) {
  if (!orgId) {
    return [];
  }

  const rows = await db
    .select({
      id: tireStocks.id,
      orgId: tireStocks.orgId,
      size: tireStocks.size,
      brand: tireStocks.brand,
      notes: tireStocks.notes,
      quantity: tireStocks.quantity,
      minQuantity: tireStocks.minQuantity,
      updatedAt: tireStocks.updatedAt,
      createdAt: tireStocks.createdAt,
    })
    .from(tireStocks)
    .where(eq(tireStocks.orgId, orgId))
    .orderBy(asc(tireStocks.size));

  return rows.map((row) => ({
    ...row,
    quantity: Number(row.quantity ?? 0),
    minQuantity: row.minQuantity ?? 0,
  }));
}

export async function createTireStock(payload: unknown) {
  const parsed = tireStockCreateSchema.safeParse(payload);

  if (!parsed.success) {
    throw new ValidationError('Date anvelopa invalide.', parsed.error.flatten());
  }

  const data = parsed.data;
  const cleanedData = {
    orgId: data.orgId,
    size: data.size.trim().toUpperCase(),
    brand: normalizeText(data.brand),
    notes: normalizeText(data.notes),
    quantity: data.quantity,
    minQuantity: data.minQuantity ?? null,
  };

  const result = await db.transaction(async (tx) => {
    const [record] = await tx
      .insert(tireStocks)
      .values({
        orgId: cleanedData.orgId,
        size: cleanedData.size,
        brand: cleanedData.brand,
        notes: cleanedData.notes,
        quantity: cleanedData.quantity,
        minQuantity: cleanedData.minQuantity,
      })
      .returning();

    if (cleanedData.quantity > 0 && record) {
      await tx.insert(tireStockMovements).values({
        stockId: record.id,
        orgId: record.orgId,
        change: cleanedData.quantity,
        reason: 'Stoc initial',
      });
    }

    return record;
  });

  return result;
}

export async function adjustTireStock(payload: unknown) {
  const parsed = tireStockAdjustSchema.safeParse(payload);

  if (!parsed.success) {
    throw new ValidationError('Date ajustare invalide.', parsed.error.flatten());
  }

  const data = parsed.data;

  const result = await db.transaction(async (tx) => {
    const updated = await changeStockQuantity(tx, {
      orgId: data.orgId,
      stockId: data.stockId,
      delta: data.change,
      vehicleId: data.vehicleId ?? null,
      reason: data.reason,
    });

    return updated;
  });

  return result;
}

async function applyTireConsumption(
  client: DbClient,
  { orgId, vehicleId, items, reason }: TireConsumptionInput,
) {
  for (const item of items) {
    await changeStockQuantity(client, {
      orgId,
      stockId: item.stockId,
      delta: -item.quantity,
      vehicleId,
      reason: normalizeText(item.reason) ?? normalizeText(reason) ?? 'Consum anvelope',
    });
  }
}

export async function consumeTires(payload: unknown) {
  const parsed = tireConsumptionSchema.safeParse(payload);

  if (!parsed.success) {
    throw new ValidationError('Date consum anvelope invalide.', parsed.error.flatten());
  }

  await db.transaction(async (tx) => {
    await applyTireConsumption(tx, parsed.data);
  });
}

export async function consumeTiresWithClient(client: DbClient, params: TireConsumptionInput) {
  await applyTireConsumption(client, params);
}

export async function deleteTireStock(stockId: string, orgId: string) {
  const [deleted] = await db
    .delete(tireStocks)
    .where(and(eq(tireStocks.id, stockId), eq(tireStocks.orgId, orgId)))
    .returning();

  if (!deleted) {
    throw new NotFoundError('Anvelopa nu a fost gasita.');
  }

  return deleted;
}
