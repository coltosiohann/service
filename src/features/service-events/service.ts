import { desc, eq } from 'drizzle-orm';

import { db, serviceEvents, vehicles } from '@/db';
import { NotFoundError, ValidationError } from '@/lib/errors';
import {
  ensureVehicleAccess,
  recalculateVehicleStatus,
  toNumber,
} from '@/features/vehicles/service';
import { serviceEventPayloadSchema, serviceEventUpdateSchema } from './validators';

function buildVehicleUpdates(params: {
  vehicle: typeof vehicles.$inferSelect;
  payload: {
    type: 'OIL_CHANGE' | 'REVISION' | 'REPAIR' | 'INSPECTION' | 'OTHER';
    date: Date;
    odometerKm?: number | null;
    nextDueKm?: number | null;
    nextDueDate?: Date | null;
  };
}) {
  const { vehicle, payload } = params;
  const updates: Record<string, unknown> = {};

  if (payload.type === 'REVISION') {
    updates.lastRevisionDate = payload.date;
  }

  if (payload.type === 'OIL_CHANGE') {
    updates.lastOilChangeDate = payload.date;
  }

  if (payload.nextDueDate) {
    updates.nextRevisionDate = payload.nextDueDate;
  }

  if (payload.nextDueKm != null) {
    updates.nextRevisionAtKm = payload.nextDueKm.toString();
  }

  if (payload.odometerKm != null) {
    const current = toNumber(vehicle.currentOdometerKm);
    if (payload.odometerKm > current) {
      updates.currentOdometerKm = payload.odometerKm.toString();
    }
  }

  return updates;
}

export async function createServiceEvent(payload: unknown, userId: string) {
  const parsed = serviceEventPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    throw new ValidationError('Date invalide.', parsed.error.flatten());
  }

  const data = parsed.data;
  const vehicle = await ensureVehicleAccess(data.orgId, data.vehicleId);

  const [event] = await db
    .insert(serviceEvents)
    .values({
      vehicleId: data.vehicleId,
      type: data.type,
      date: data.date,
      odometerKm: data.odometerKm != null ? data.odometerKm.toString() : null,
      nextDueKm: data.nextDueKm != null ? data.nextDueKm.toString() : null,
      nextDueDate: data.nextDueDate ?? null,
      notes: data.notes ?? null,
      costCurrency: data.costCurrency,
      costAmount: data.costAmount != null ? data.costAmount.toString() : null,
      createdBy: userId,
    })
    .returning();

  const updates = buildVehicleUpdates({
    vehicle,
    payload: {
      type: data.type,
      date: data.date,
      odometerKm: data.odometerKm ?? null,
      nextDueKm: data.nextDueKm ?? null,
      nextDueDate: data.nextDueDate ?? null,
    },
  });

  if (Object.keys(updates).length > 0) {
    await db
      .update(vehicles)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, data.vehicleId));
  }

  await recalculateVehicleStatus(data.vehicleId);

  return event;
}

export async function updateServiceEvent(eventId: string, payload: unknown) {
  const parsed = serviceEventUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    throw new ValidationError('Date invalide.', parsed.error.flatten());
  }

  const existing = await db.query.serviceEvents.findFirst({
    where: (fields, operators) => operators.eq(fields.id, eventId),
    with: {
      vehicle: true,
    },
  });

  if (!existing || existing.vehicle.deletedAt) {
    throw new NotFoundError('Evenimentul nu a fost găsit.');
  }

  const data = parsed.data;

  if (data.orgId && data.orgId !== existing.vehicle.orgId) {
    throw new ValidationError('Organizația nu se potrivește vehiculului.');
  }

  const updates = {
    type: data.type ?? existing.type,
    date: data.date ?? existing.date,
    odometerKm:
      data.odometerKm != null
        ? data.odometerKm.toString()
        : existing.odometerKm ?? null,
    nextDueKm:
      data.nextDueKm != null
        ? data.nextDueKm.toString()
        : existing.nextDueKm ?? null,
    nextDueDate: data.nextDueDate ?? existing.nextDueDate ?? null,
    notes: data.notes ?? existing.notes ?? null,
    costCurrency: data.costCurrency ?? existing.costCurrency ?? 'RON',
    costAmount:
      data.costAmount != null
        ? data.costAmount.toString()
        : existing.costAmount ?? null,
  };

  const [event] = await db
    .update(serviceEvents)
    .set({
      ...updates,
    })
    .where(eq(serviceEvents.id, eventId))
    .returning();

  const vehicleUpdates = buildVehicleUpdates({
    vehicle: existing.vehicle,
    payload: {
      type: updates.type,
      date: updates.date,
      odometerKm:
        data.odometerKm ?? (existing.odometerKm ? Number(existing.odometerKm) : null),
      nextDueKm:
        data.nextDueKm ?? (existing.nextDueKm ? Number(existing.nextDueKm) : null),
      nextDueDate: data.nextDueDate ?? existing.nextDueDate ?? null,
    },
  });

  if (Object.keys(vehicleUpdates).length > 0) {
    await db
      .update(vehicles)
      .set({
        ...vehicleUpdates,
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, existing.vehicleId));
  }

  await recalculateVehicleStatus(existing.vehicleId);

  return event;
}

export async function deleteServiceEvent(eventId: string) {
  const [deleted] = await db
    .delete(serviceEvents)
    .where(eq(serviceEvents.id, eventId))
    .returning();

  if (!deleted) {
    throw new NotFoundError('Evenimentul nu a fost găsit.');
  }

  await recalculateVehicleStatus(deleted.vehicleId);

  return deleted;
}

export async function listServiceEvents(vehicleId: string, orgId: string) {
  await ensureVehicleAccess(orgId, vehicleId);

  return db.query.serviceEvents.findMany({
    where: (fields, operators) => operators.eq(fields.vehicleId, vehicleId),
    orderBy: (fields) => desc(fields.date),
  });
}
