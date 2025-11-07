import { desc, eq } from 'drizzle-orm';

import { db, serviceEvents, vehicles } from '@/db';
import {
  ensureVehicleAccess,
  recalculateVehicleStatus,
  toNumber,
} from '@/features/vehicles/service';
import { NotFoundError, ValidationError } from '@/lib/errors';

import { serviceEventPayloadSchema, serviceEventUpdateSchema } from './validators';

function toISODateString(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeUserId(userId: string | undefined): string | null {
  if (!userId) {
    return null;
  }

  return UUID_REGEX.test(userId) ? userId : null;
}

function buildVehicleUpdates(params: {
  vehicle: typeof vehicles.$inferSelect;
  payload: {
    type: 'OIL_CHANGE' | 'REVISION' | 'REPAIR' | 'INSPECTION' | 'OTHER';
    date: Date | string;
    odometerKm?: number | null;
    nextDueKm?: number | null;
    nextDueDate?: Date | string | null;
  };
}) {
  const { vehicle, payload } = params;
  const updates: Record<string, unknown> = {};
  const eventDate = toISODateString(payload.date);

  if (payload.type === 'REVISION' && eventDate) {
    updates.lastRevisionDate = eventDate;
  }

  if (payload.type === 'OIL_CHANGE' && eventDate) {
    updates.lastOilChangeDate = eventDate;
  }

  if (payload.nextDueDate) {
    updates.nextRevisionDate = toISODateString(payload.nextDueDate);
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
  const eventDate = toISODateString(data.date);

  if (!eventDate) {
    throw new ValidationError('Data eveniment lipseste.');
  }

  const nextDueDate = toISODateString(data.nextDueDate ?? null);

  const createdBy = normalizeUserId(userId);

  const [event] = await db
    .insert(serviceEvents)
    .values({
      vehicleId: data.vehicleId,
      type: data.type,
      date: eventDate,
      odometerKm: data.odometerKm != null ? data.odometerKm.toString() : null,
      nextDueKm: data.nextDueKm != null ? data.nextDueKm.toString() : null,
      nextDueDate,
      notes: data.notes ?? null,
      createdBy,
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
    date: data.date ? toISODateString(data.date) ?? existing.date : existing.date,
    odometerKm:
      data.odometerKm != null
        ? data.odometerKm.toString()
        : existing.odometerKm ?? null,
    nextDueKm:
      data.nextDueKm != null
        ? data.nextDueKm.toString()
        : existing.nextDueKm ?? null,
    nextDueDate:
      data.nextDueDate !== undefined
        ? toISODateString(data.nextDueDate) ?? null
        : existing.nextDueDate ?? null,
    notes: data.notes ?? existing.notes ?? null,
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
      date: data.date ?? existing.date,
      odometerKm:
        data.odometerKm ?? (existing.odometerKm ? Number(existing.odometerKm) : null),
      nextDueKm:
        data.nextDueKm ?? (existing.nextDueKm ? Number(existing.nextDueKm) : null),
      nextDueDate:
        data.nextDueDate !== undefined ? data.nextDueDate ?? null : existing.nextDueDate ?? null,
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
