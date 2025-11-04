import { desc, eq } from 'drizzle-orm';

import { db, odometerLogs, vehicles } from '@/db';
import { ValidationError } from '@/lib/errors';
import {
  ensureVehicleAccess,
  recalculateVehicleStatus,
  toNumber,
} from '@/features/vehicles/service';
import { odometerLogSchema } from './validators';

export async function createOdometerLog(payload: unknown) {
  const parsed = odometerLogSchema.safeParse(payload);

  if (!parsed.success) {
    throw new ValidationError('Date invalid.', parsed.error.flatten());
  }

  const data = parsed.data;
  const vehicle = await ensureVehicleAccess(data.orgId, data.vehicleId);

  const [log] = await db
    .insert(odometerLogs)
    .values({
      vehicleId: data.vehicleId,
      date: data.date,
      valueKm: data.valueKm.toString(),
      source: data.source,
    })
    .returning();

  const current = toNumber(vehicle.currentOdometerKm ?? 0);
  if (data.valueKm > current) {
    await db
      .update(vehicles)
      .set({ currentOdometerKm: data.valueKm.toString(), updatedAt: new Date() })
      .where(eq(vehicles.id, data.vehicleId));

    await recalculateVehicleStatus(data.vehicleId);
  }

  return log;
}

export async function listOdometerLogs(vehicleId: string, orgId: string) {
  await ensureVehicleAccess(orgId, vehicleId);

  return db.query.odometerLogs.findMany({
    where: (fields, operators) => operators.eq(fields.vehicleId, vehicleId),
    orderBy: (fields) => desc(fields.date),
    limit: 120,
  });
}
