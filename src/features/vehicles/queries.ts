import { and, asc, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm';

import { db } from '@/db';
import { documents, vehicles } from '@/db/schema';

import { computeInsuranceStatus, computeTachographStatus } from './status';

import type { InsuranceStatus, TachographStatus } from './status';

function toNumber(value: string | number | null | undefined): number | null {
  if (value == null) {
    return null;
  }

  const asNumber = typeof value === 'number' ? value : Number(value);
  return Number.isNaN(asNumber) ? null : asNumber;
}

export type VehicleListFilters = {
  orgId: string;
  type?: 'CAR' | 'TRUCK';
  status?: 'OK' | 'DUE_SOON' | 'OVERDUE';
  insurance?: InsuranceStatus;
  search?: string;
  truck?: {
    tonajMare?: 'true' | 'false';
    tahograf?: TachographStatus;
  };
};

export async function listVehicles(filters: VehicleListFilters) {
  const { orgId, type, status, search, truck } = filters;
  const conditions = [eq(vehicles.orgId, orgId), isNull(vehicles.deletedAt)];

  if (type) {
    conditions.push(eq(vehicles.type, type));
  }

  if (status) {
    conditions.push(eq(vehicles.status, status));
  }

  if (search) {
    const pattern = `%${search.trim()}%`;
    const searchCondition = or(
      ilike(vehicles.licensePlate, pattern),
      ilike(vehicles.vin, pattern),
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  const rows = await db
    .select({
      id: vehicles.id,
      orgId: vehicles.orgId,
      type: vehicles.type,
      make: vehicles.make,
      model: vehicles.model,
      year: vehicles.year,
      vin: vehicles.vin,
      licensePlate: vehicles.licensePlate,
      currentOdometerKm: vehicles.currentOdometerKm,
      lastOilChangeDate: vehicles.lastOilChangeDate,
      lastRevisionDate: vehicles.lastRevisionDate,
      nextRevisionAtKm: vehicles.nextRevisionAtKm,
      nextRevisionDate: vehicles.nextRevisionDate,
      insuranceProvider: vehicles.insuranceProvider,
      insurancePolicyNumber: vehicles.insurancePolicyNumber,
      insuranceEndDate: vehicles.insuranceEndDate,
      hasHeavyTonnageAuthorization: vehicles.hasHeavyTonnageAuthorization,
      tachographCheckDate: vehicles.tachographCheckDate,
      status: vehicles.status,
      updatedAt: vehicles.updatedAt,
      createdAt: vehicles.createdAt,
    })
    .from(vehicles)
    .where(and(...conditions))
    .orderBy(asc(vehicles.type), asc(vehicles.make), asc(vehicles.model));

  const enriched = rows
    .map((row) => {
      const insuranceStatus = computeInsuranceStatus(row.insuranceEndDate ?? null);
      const tachographStatus =
        row.type === 'TRUCK' ? computeTachographStatus(row.tachographCheckDate ?? null) : null;

      const hasTonaj = Boolean(row.hasHeavyTonnageAuthorization);

      return {
        ...row,
        currentOdometerKm: toNumber(row.currentOdometerKm) ?? 0,
        nextRevisionAtKm: toNumber(row.nextRevisionAtKm),
        insuranceStatus,
        tachographStatus,
        hasTonaj,
      };
    })
    .filter((row) => {
      if (filters.insurance && row.insuranceStatus !== filters.insurance) {
        return false;
      }

      if (truck?.tonajMare && row.type === 'TRUCK') {
        const expected = truck.tonajMare === 'true';
        if (row.hasTonaj !== expected) {
          return false;
        }
      }

      if (truck?.tahograf && row.type === 'TRUCK') {
        if (row.tachographStatus !== truck.tahograf) {
          return false;
        }
      }

      return true;
    });

  const ids = enriched.map((item) => item.id);
  const documentMap = new Map<string, number>();

  if (ids.length > 0) {
    const counts = await db
      .select({
        vehicleId: documents.vehicleId,
        total: sql<number>`count(*)`,
      })
      .from(documents)
      .where(inArray(documents.vehicleId, ids))
      .groupBy(documents.vehicleId);

    counts.forEach((row) => {
      documentMap.set(row.vehicleId, Number(row.total));
    });
  }

  return enriched.map((row) => ({
    ...row,
    documentCount: documentMap.get(row.id) ?? 0,
  }));
}
