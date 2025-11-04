import { and, eq } from 'drizzle-orm';

import { db, vehicles } from '@/db';
import type { VehicleStatus } from '@/db/schema';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { consumeTiresWithClient } from '@/features/tires/service';
import { computeVehicleStatus } from './status';
import { vehiclePayloadSchema, vehicleUpdateSchema } from './validators';

function normalizeNumeric(value: number | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  return value.toString();
}

export function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

type TireUsageItem = {
  stockId: string;
  quantity: number;
  reason?: string | null;
};

function sanitizeTireUsage(
  vehicleType: string,
  usage: TireUsageItem[] | undefined,
): TireUsageItem[] {
  if (vehicleType !== 'TRUCK' || !Array.isArray(usage)) {
    return [];
  }

  return usage
    .map((item) => ({
      stockId: item.stockId,
      quantity: Math.trunc(Math.abs(Number(item.quantity))),
      reason: item.reason ?? null,
    }))
    .filter((item) => Boolean(item.stockId) && Number(item.quantity) > 0);
}

export async function ensureVehicleAccess(orgId: string, vehicleId: string) {
  const vehicle = await db.query.vehicles.findFirst({
    where: (fields, operators) =>
      and(operators.eq(fields.id, vehicleId), operators.isNull(fields.deletedAt)),
  });

  if (!vehicle) {
    throw new NotFoundError('Vehiculul nu a fost găsit sau a fost arhivat.');
  }

  if (vehicle.orgId !== orgId) {
    throw new NotFoundError('Vehiculul nu aparține acestei organizații.');
  }

  return vehicle;
}

export async function createVehicle(payload: unknown) {
  const data = vehiclePayloadSchema.safeParse(payload);

  if (!data.success) {
    throw new ValidationError('Date vehicul invalide.', data.error.flatten());
  }

  const { tiresUsage = [], tireUsageReason, ...vehicle } = data.data;
  const sanitizedUsage = sanitizeTireUsage(vehicle.type, tiresUsage);

  const computedStatus: VehicleStatus =
    vehicle.status ??
    computeVehicleStatus({
      currentOdometerKm: vehicle.currentOdometerKm,
      nextRevisionAtKm: vehicle.nextRevisionAtKm ?? null,
      nextRevisionDate: vehicle.nextRevisionDate ?? null,
    });

  const record = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(vehicles)
      .values({
        orgId: vehicle.orgId,
        type: vehicle.type,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        vin: vehicle.vin ?? null,
        licensePlate: vehicle.licensePlate,
        currentOdometerKm: vehicle.currentOdometerKm.toString(),
        lastOilChangeDate: vehicle.lastOilChangeDate ?? null,
        lastRevisionDate: vehicle.lastRevisionDate ?? null,
        nextRevisionAtKm: normalizeNumeric(vehicle.nextRevisionAtKm ?? null),
        nextRevisionDate: vehicle.nextRevisionDate ?? null,
        insuranceProvider: vehicle.insuranceProvider,
        insurancePolicyNumber: vehicle.insurancePolicyNumber,
        insuranceEndDate: vehicle.insuranceEndDate ?? null,
        hasHeavyTonnageAuthorization:
          vehicle.type === 'TRUCK' ? Boolean(vehicle.hasHeavyTonnageAuthorization) : null,
        tachographCheckDate: vehicle.type === 'TRUCK' ? vehicle.tachographCheckDate ?? null : null,
        status: computedStatus,
      })
      .returning();

    if (created && sanitizedUsage.length > 0) {
      await consumeTiresWithClient(tx as typeof db, {
        orgId: created.orgId,
        vehicleId: created.id,
        reason: tireUsageReason ?? null,
        items: sanitizedUsage,
      });
    }

    return created;
  });

  return record;
}

export async function updateVehicle(vehicleId: string, payload: unknown) {
  const parsed = vehicleUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    throw new ValidationError('Date vehicul invalide.', parsed.error.flatten());
  }

  const { tiresUsage, tireUsageReason, ...updateData } = parsed.data;

  const record = await db.transaction(async (tx) => {
    const existing = await tx.query.vehicles.findFirst({
      where: (fields, operators) =>
        and(operators.eq(fields.id, vehicleId), operators.isNull(fields.deletedAt)),
    });

    if (!existing) {
      throw new NotFoundError('Vehiculul nu a fost g??sit.');
    }

    const merged = {
      ...existing,
      ...updateData,
      currentOdometerKm:
        updateData.currentOdometerKm ?? toNumber(existing.currentOdometerKm ?? 0),
      nextRevisionAtKm:
        updateData.nextRevisionAtKm ??
        (existing.nextRevisionAtKm != null ? toNumber(existing.nextRevisionAtKm) : null),
      nextRevisionDate: updateData.nextRevisionDate ?? existing.nextRevisionDate ?? null,
    };

    const computedStatus: VehicleStatus =
      updateData.status ??
      computeVehicleStatus({
        currentOdometerKm: merged.currentOdometerKm ?? 0,
        nextRevisionAtKm: merged.nextRevisionAtKm,
        nextRevisionDate: merged.nextRevisionDate,
      });

    const [updated] = await tx
      .update(vehicles)
      .set({
        make: merged.make,
        model: merged.model,
        year: merged.year,
        vin: merged.vin ?? null,
        licensePlate: merged.licensePlate,
        currentOdometerKm: toNumber(merged.currentOdometerKm).toString(),
        lastOilChangeDate: merged.lastOilChangeDate ?? null,
        lastRevisionDate: merged.lastRevisionDate ?? null,
        nextRevisionAtKm: normalizeNumeric(merged.nextRevisionAtKm),
        nextRevisionDate: merged.nextRevisionDate ?? null,
        insuranceProvider: merged.insuranceProvider,
        insurancePolicyNumber: merged.insurancePolicyNumber,
        insuranceEndDate: merged.insuranceEndDate ?? null,
        hasHeavyTonnageAuthorization:
          merged.type === 'TRUCK' ? Boolean(merged.hasHeavyTonnageAuthorization) : null,
        tachographCheckDate: merged.type === 'TRUCK' ? merged.tachographCheckDate ?? null : null,
        status: computedStatus,
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, vehicleId))
      .returning();

    const usage = sanitizeTireUsage(updateData.type ?? existing.type, tiresUsage);

    if (updated && usage.length > 0) {
      await consumeTiresWithClient(tx as typeof db, {
        orgId: existing.orgId,
        vehicleId,
        reason: tireUsageReason ?? null,
        items: usage,
      });
    }

    return updated;
  });

  return record;
}

export async function softDeleteVehicle(vehicleId: string) {
  const [record] = await db
    .update(vehicles)
    .set({ deletedAt: new Date() })
    .where(eq(vehicles.id, vehicleId))
    .returning();

  if (!record) {
    throw new NotFoundError('Vehiculul nu a fost găsit.');
  }

  return record;
}

export async function getVehicleById(vehicleId: string) {
  const vehicle = await db.query.vehicles.findFirst({
    where: (fields, operators) =>
      and(operators.eq(fields.id, vehicleId), operators.isNull(fields.deletedAt)),
  });

  if (!vehicle) {
    throw new NotFoundError('Vehiculul nu a fost găsit.');
  }

  return vehicle;
}

export async function recalculateVehicleStatus(vehicleId: string) {
  const vehicle = await db.query.vehicles.findFirst({
    where: (fields, operators) =>
      and(operators.eq(fields.id, vehicleId), operators.isNull(fields.deletedAt)),
  });

  if (!vehicle) {
    return null;
  }

  const status = computeVehicleStatus({
    currentOdometerKm: toNumber(vehicle.currentOdometerKm ?? 0),
    nextRevisionAtKm:
      vehicle.nextRevisionAtKm != null ? toNumber(vehicle.nextRevisionAtKm) : null,
    nextRevisionDate: vehicle.nextRevisionDate ?? null,
  });

  await db
    .update(vehicles)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(vehicles.id, vehicleId));

  return status;
}
