import { and, eq } from 'drizzle-orm';

import { db, vehicles } from '@/db';
// import { consumeTiresWithClient } from '@/features/tires/service'; // Deprecated
import { NotFoundError, ValidationError } from '@/lib/errors';

import { computeVehicleStatus } from './status';
import { vehiclePayloadSchema, vehicleUpdateSchema } from './validators';

import type { VehicleStatus } from '@/db/schema';

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

function toISODate(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value;
}

function computeCopieConformaExpiry(
  value: Date | string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  const base = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(base.getTime())) {
    return null;
  }

  const expiry = new Date(base);
  expiry.setFullYear(expiry.getFullYear() + 1);
  return expiry.toISOString().slice(0, 10);
}

function fallbackText(value: string | null | undefined, fallback = 'N/A') {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return fallback;
}

function fallbackUpperText(value: string | null | undefined, fallback = 'N/A') {
  return fallbackText(value, fallback).toUpperCase();
}

function fallbackNumber(value: number | null | undefined, fallback: number) {
  return typeof value === 'number' && !Number.isNaN(value) ? value : fallback;
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
  if (!Array.isArray(usage)) {
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

  const { tiresUsage = [], ...vehicle } = data.data;
  const sanitizedUsage = sanitizeTireUsage(vehicle.type, tiresUsage);

  const makeValue = fallbackText(vehicle.make);
  const modelValue = fallbackText(vehicle.model);
  const yearValue = fallbackNumber(vehicle.year ?? null, new Date().getFullYear());
  const licensePlateValue = fallbackUpperText(vehicle.licensePlate);
  const currentOdometerValue = toNumber(vehicle.currentOdometerKm ?? 0);
  const insuranceNumberValue = fallbackText(vehicle.insurancePolicyNumber);

  const computedStatus: VehicleStatus =
    vehicle.status ??
    computeVehicleStatus({
      currentOdometerKm: currentOdometerValue,
      nextRevisionAtKm: vehicle.nextRevisionAtKm ?? null,
      nextRevisionDate: vehicle.nextRevisionDate ?? null,
    });

  const record = await db.transaction(async (tx) => {
    const copieConformaStart =
      vehicle.type === 'TRUCK' ? toISODate(vehicle.copieConformaStartDate) : null;
    const copieConformaExpiry =
      vehicle.type === 'TRUCK'
        ? computeCopieConformaExpiry(vehicle.copieConformaStartDate)
        : null;

    const [created] = await tx
      .insert(vehicles)
      .values({
        orgId: vehicle.orgId,
        type: vehicle.type,
        make: makeValue,
        model: modelValue,
        year: yearValue,
        vin: vehicle.vin ? vehicle.vin.toUpperCase() : null,
        licensePlate: licensePlateValue,
        currentOdometerKm: currentOdometerValue.toString(),
        lastOilChangeDate: toISODate(vehicle.lastOilChangeDate),
        lastRevisionDate: toISODate(vehicle.lastRevisionDate),
        nextRevisionAtKm: normalizeNumeric(vehicle.nextRevisionAtKm ?? null),
        nextRevisionDate: toISODate(vehicle.nextRevisionDate),
        insurancePolicyNumber: insuranceNumberValue,
        insuranceStartDate: toISODate(vehicle.insuranceStartDate),
        insuranceEndDate: toISODate(vehicle.insuranceEndDate),
        copieConformaStartDate: copieConformaStart,
        copieConformaExpiryDate: copieConformaExpiry,
        hasHeavyTonnageAuthorization:
          vehicle.type === 'TRUCK' ? Boolean(vehicle.hasHeavyTonnageAuthorization) : null,
        tachographCheckDate: vehicle.type === 'TRUCK' ? toISODate(vehicle.tachographCheckDate) : null,
        status: computedStatus,
      })
      .returning();

    if (created && sanitizedUsage.length > 0) {
      // Tire consumption is now handled separately via /api/vehicles/[id]/tires/mount endpoint
      // await consumeTiresWithClient(tx, {
      //   orgId: created.orgId,
      //   vehicleId: created.id,
      //   reason: tireUsageReason ?? null,
      //   items: sanitizedUsage,
      // });
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

  const { tiresUsage, ...updateData } = parsed.data;

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

    const lastOilChangeDate =
      updateData.lastOilChangeDate !== undefined
        ? toISODate(updateData.lastOilChangeDate)
        : existing.lastOilChangeDate ?? null;
    const lastRevisionDate =
      updateData.lastRevisionDate !== undefined
        ? toISODate(updateData.lastRevisionDate)
        : existing.lastRevisionDate ?? null;
    const nextRevisionDateValue =
      updateData.nextRevisionDate !== undefined
        ? toISODate(updateData.nextRevisionDate)
        : existing.nextRevisionDate ?? null;
    const insuranceStartDate =
      updateData.insuranceStartDate !== undefined
        ? toISODate(updateData.insuranceStartDate)
        : existing.insuranceStartDate ?? null;
    const insuranceEndDate =
      updateData.insuranceEndDate !== undefined
        ? toISODate(updateData.insuranceEndDate)
        : existing.insuranceEndDate ?? null;
    const rawCopieConformaStart =
      merged.type === 'TRUCK'
        ? (updateData.copieConformaStartDate !== undefined
            ? updateData.copieConformaStartDate
            : existing.copieConformaStartDate ?? null)
        : null;
    const copieConformaStartDate =
      merged.type === 'TRUCK' ? toISODate(rawCopieConformaStart) : null;
    const copieConformaExpiryDate =
      merged.type === 'TRUCK' ? computeCopieConformaExpiry(rawCopieConformaStart) : null;
    const tachographCheckDate =
      merged.type === 'TRUCK'
        ? updateData.tachographCheckDate !== undefined
          ? toISODate(updateData.tachographCheckDate)
          : existing.tachographCheckDate ?? null
        : null;
    const sanitizedMake = fallbackText(merged.make);
    const sanitizedModel = fallbackText(merged.model);
    const sanitizedLicensePlate = fallbackUpperText(merged.licensePlate);
    const sanitizedYear = fallbackNumber(
      typeof merged.year === 'number' ? merged.year : Number(merged.year ?? NaN),
      new Date().getFullYear(),
    );
    const sanitizedInsuranceNumber = fallbackText(merged.insurancePolicyNumber);

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
        make: sanitizedMake,
        model: sanitizedModel,
        year: sanitizedYear,
        vin: merged.vin ? merged.vin.toUpperCase() : null,
        licensePlate: sanitizedLicensePlate,
        currentOdometerKm: toNumber(merged.currentOdometerKm).toString(),
        lastOilChangeDate,
        lastRevisionDate,
        nextRevisionAtKm: normalizeNumeric(merged.nextRevisionAtKm),
        nextRevisionDate: nextRevisionDateValue,
        insurancePolicyNumber: sanitizedInsuranceNumber,
        insuranceStartDate,
        insuranceEndDate,
        copieConformaStartDate,
        copieConformaExpiryDate,
        hasHeavyTonnageAuthorization:
          merged.type === 'TRUCK' ? Boolean(merged.hasHeavyTonnageAuthorization) : null,
        tachographCheckDate,
        status: computedStatus,
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, vehicleId))
      .returning();

    const usage = sanitizeTireUsage(updateData.type ?? existing.type, tiresUsage);

    if (updated && usage.length > 0) {
      // Tire consumption is now handled separately via /api/vehicles/[id]/tires/mount endpoint
      // await consumeTiresWithClient(tx, {
      //   orgId: existing.orgId,
      //   vehicleId,
      //   reason: tireUsageReason ?? null,
      //   items: usage,
      // });
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
