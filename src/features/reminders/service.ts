import { and, desc, eq } from 'drizzle-orm';

import { db, reminders, vehicles } from '@/db';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { toNumber } from '@/features/vehicles/service';
import { reminderQuerySchema, reminderUpdateSchema } from './validators';

export async function listReminders(query: unknown) {
  const parsed = reminderQuerySchema.safeParse(query);

  if (!parsed.success) {
    throw new ValidationError('Filtru invalid.', parsed.error.flatten());
  }

  const data = parsed.data;
  const conditions = [eq(vehicles.orgId, data.orgId)];

  if (data.status) {
    conditions.push(eq(reminders.status, data.status));
  }

  if (data.kind) {
    conditions.push(eq(reminders.kind, data.kind));
  }

  if (data.vehicleId) {
    conditions.push(eq(reminders.vehicleId, data.vehicleId));
  }

  const rows = await db
    .select({
      reminder: reminders,
      vehicleId: vehicles.id,
      licensePlate: vehicles.licensePlate,
      make: vehicles.make,
      model: vehicles.model,
      currentOdometerKm: vehicles.currentOdometerKm,
    })
    .from(reminders)
    .innerJoin(vehicles, eq(reminders.vehicleId, vehicles.id))
    .where(and(...conditions))
    .orderBy(desc(reminders.dueDate), desc(reminders.dueKm));

  const now = new Date();

  const enriched = rows.map((row) => {
    const dueDate = row.reminder.dueDate ?? null;
    const dueKm = row.reminder.dueKm != null ? Number(row.reminder.dueKm) : null;
    const currentKm = toNumber(row.currentOdometerKm);

    const overdueByDate = dueDate ? dueDate < now : false;
    const overdueByKm = dueKm != null ? dueKm <= currentKm : false;

    const soonByDate =
      dueDate && !overdueByDate
        ? (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= row.reminder.leadDays
        : false;

    const soonByKm =
      dueKm != null && !overdueByKm
        ? dueKm - currentKm <= (row.reminder.leadKm ?? 1000)
        : false;

    const statusTag = overdueByDate || overdueByKm ? 'overdue' : soonByDate || soonByKm ? 'soon' : 'ok';

    return {
      ...row.reminder,
      vehicleId: row.vehicleId,
      licensePlate: row.licensePlate,
      vehicleLabel: `${row.make ?? ''} ${row.model ?? ''}`.trim(),
      statusTag,
      overdue: overdueByDate || overdueByKm,
      dueSoon: statusTag === 'soon',
    };
  });

  switch (data.view) {
    case 'done':
      return enriched.filter((item) => item.status !== 'PENDING');
    case 'overdue':
      return enriched.filter((item) => item.overdue);
    case 'soon':
      return enriched.filter((item) => item.status === 'PENDING' && item.dueSoon);
    default:
      return enriched;
  }
}

export async function updateReminder(reminderId: string, payload: unknown) {
  const parsed = reminderUpdateSchema.safeParse({ ...payload, id: reminderId });

  if (!parsed.success) {
    throw new ValidationError('Date reminder invalide.', parsed.error.flatten());
  }

  const data = parsed.data;

  const existing = await db.query.reminders.findFirst({
    where: (fields, operators) => operators.eq(fields.id, reminderId),
    with: {
      vehicle: true,
    },
  });

  if (!existing || existing.vehicle.deletedAt) {
    throw new NotFoundError('Reminderul nu a fost găsit.');
  }

  if (existing.vehicle.orgId !== data.orgId) {
    throw new NotFoundError('Reminderul nu aparține organizației selectate.');
  }

  const [reminder] = await db
    .update(reminders)
    .set({
      status: data.status ?? existing.status,
      lastNotifiedAt: data.lastNotifiedAt ?? existing.lastNotifiedAt,
    })
    .where(eq(reminders.id, reminderId))
    .returning();

  return reminder;
}
