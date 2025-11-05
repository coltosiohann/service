import { differenceInCalendarDays } from 'date-fns';
import { and, desc, eq, gt, isNotNull, isNull, lte, sql } from 'drizzle-orm';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db, reminders, serviceEvents, vehicles } from '@/db';
import { toNumber } from '@/features/vehicles/service';
import { computeCopieConformaStatus, computeInsuranceStatus, computeTachographStatus } from '@/features/vehicles/status';
import { getDefaultOrgId } from '@/lib/default-org';
import { cn, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getDashboardData(orgId: string) {
  const orgActiveCondition = and(eq(vehicles.orgId, orgId), isNull(vehicles.deletedAt));

  const [totalVehicles] = await db
    .select({ count: sql<number>`count(*)` })
    .from(vehicles)
    .where(orgActiveCondition);

  const [overdueVehicles] = await db
    .select({ count: sql<number>`count(*)` })
    .from(vehicles)
    .where(and(orgActiveCondition, eq(vehicles.status, 'OVERDUE')));

  const [dueSoonVehicles] = await db
    .select({ count: sql<number>`count(*)` })
    .from(vehicles)
    .where(and(orgActiveCondition, eq(vehicles.status, 'DUE_SOON')));

  const today = new Date();
  const inThirtyDays = new Date(today);
  inThirtyDays.setDate(inThirtyDays.getDate() + 30);
  const todayString = today.toISOString().slice(0, 10);
  const inThirtyDaysString = inThirtyDays.toISOString().slice(0, 10);

  const [insuranceExpiring] = await db
    .select({ count: sql<number>`count(*)` })
    .from(vehicles)
    .where(
      and(
        orgActiveCondition,
        isNotNull(vehicles.insuranceEndDate),
        lte(vehicles.insuranceEndDate, inThirtyDaysString),
        gt(vehicles.insuranceEndDate, todayString),
      ),
    );

  const [copieConformaExpiring] = await db
    .select({ count: sql<number>`count(*)` })
    .from(vehicles)
    .where(
      and(
        orgActiveCondition,
        eq(vehicles.type, 'TRUCK'),
        isNotNull(vehicles.copieConformaExpiryDate),
        lte(vehicles.copieConformaExpiryDate, inThirtyDaysString),
        gt(vehicles.copieConformaExpiryDate, todayString),
      ),
    );

  const upcomingReminders = await db
    .select({
      id: reminders.id,
      kind: reminders.kind,
      dueDate: reminders.dueDate,
      dueKm: reminders.dueKm,
      leadKm: reminders.leadKm,
      leadDays: reminders.leadDays,
      status: reminders.status,
      vehicleId: vehicles.id,
      licensePlate: vehicles.licensePlate,
      make: vehicles.make,
      model: vehicles.model,
      currentOdometerKm: vehicles.currentOdometerKm,
    })
    .from(reminders)
    .innerJoin(vehicles, eq(reminders.vehicleId, vehicles.id))
    .where(
      and(
        orgActiveCondition,
        eq(reminders.status, 'PENDING'),
        isNotNull(reminders.dueDate),
        lte(reminders.dueDate, inThirtyDaysString),
      ),
    )
    .orderBy(reminders.dueDate)
    .limit(8);

  const recentEvents = await db
    .select({
      id: serviceEvents.id,
      type: serviceEvents.type,
      date: serviceEvents.date,
      notes: serviceEvents.notes,
      vehicleId: vehicles.id,
      licensePlate: vehicles.licensePlate,
      make: vehicles.make,
      model: vehicles.model,
    })
    .from(serviceEvents)
    .innerJoin(vehicles, eq(serviceEvents.vehicleId, vehicles.id))
    .where(orgActiveCondition)
    .orderBy(desc(serviceEvents.date))
    .limit(5);

  const vehiclesList = await db
    .select({
      id: vehicles.id,
      licensePlate: vehicles.licensePlate,
      make: vehicles.make,
      model: vehicles.model,
      type: vehicles.type,
      currentOdometerKm: vehicles.currentOdometerKm,
      nextRevisionDate: vehicles.nextRevisionDate,
      nextRevisionAtKm: vehicles.nextRevisionAtKm,
      insuranceStartDate: vehicles.insuranceStartDate,
      insuranceEndDate: vehicles.insuranceEndDate,
      tachographCheckDate: vehicles.tachographCheckDate,
      copieConformaStartDate: vehicles.copieConformaStartDate,
      copieConformaExpiryDate: vehicles.copieConformaExpiryDate,
      hasHeavyTonnageAuthorization: vehicles.hasHeavyTonnageAuthorization,
      status: vehicles.status,
    })
    .from(vehicles)
    .where(orgActiveCondition)
    .orderBy(desc(vehicles.updatedAt))
    .limit(6);

  return {
    totalVehicles: Number(totalVehicles?.count ?? 0),
    overdueVehicles: Number(overdueVehicles?.count ?? 0),
    dueSoonVehicles: Number(dueSoonVehicles?.count ?? 0),
    insuranceExpiring: Number(insuranceExpiring?.count ?? 0),
    copieConformaExpiring: Number(copieConformaExpiring?.count ?? 0),
    upcomingReminders,
    recentEvents,
    vehiclesList,
  };
}

export default async function DashboardPage() {
  // Authentication disabled - get default organization
  const defaultOrgId = await getDefaultOrgId();

  const data = await getDashboardData(defaultOrgId);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard title="Total vehicule" value={data.totalVehicles} trend="Panorama completa a flotei" />
        <KpiCard title="Revizii intarziate" value={data.overdueVehicles} tone="danger" trend="Actiuni urgente" />
        <KpiCard title="In curand" value={data.dueSoonVehicles} tone="warning" trend="Planificati interventiile" />
        <KpiCard title="Asigurari care expira" value={data.insuranceExpiring} tone="warning" trend="Verificati documentele" />
        <KpiCard title="Copie Conforma expira" value={data.copieConformaExpiring} tone="warning" trend="Camioane cu documente" />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Aceasta saptamana</CardTitle>
            <CardDescription>Evenimente si remindere cu impact rapid.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.upcomingReminders.length === 0 ? (
                <EmptyState message="Nu exista remindere pentru aceasta saptamana." />
              ) : (
                data.upcomingReminders.map((reminder) => {
                  const daysRemaining = reminder.dueDate
                    ? differenceInCalendarDays(reminder.dueDate, new Date())
                    : null;

                  return (
                    <div
                      key={reminder.id}
                      className="flex items-center justify-between rounded-2xl border border-border bg-white px-4 py-3 shadow-sm"
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          {reminder.licensePlate}  {reminder.make} {reminder.model}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {reminder.kind === 'DATE'
                            ? `Scadenta in ${daysRemaining ?? 0} zile`
                            : `Scadenta la ${reminder.dueKm} km`}
                        </p>
                      </div>
                      <Badge variant={reminder.kind === 'DATE' ? 'warning' : 'secondary'}>
                        {reminder.kind === 'DATE' ? 'Termen calendaristic' : 'Kilometraj'}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activitate recenta</CardTitle>
            <CardDescription>Ultimele operatiuni inregistrate.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentEvents.length === 0 ? (
                <EmptyState message="Nu exista evenimente inregistrate." />
              ) : (
                data.recentEvents.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-border bg-white px-4 py-3 shadow-sm">
                    <p className="text-sm font-semibold">
                      {event.licensePlate}  {event.make} {event.model}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {event.type}  {formatDate(event.date)}
                    </p>
                    {event.notes && <p className="mt-2 text-sm">{event.notes}</p>}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Stare vehicule</CardTitle>
            <CardDescription>Monitorizare rapida a prioritatilor.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.vehiclesList.map((vehicle) => {
                const insurance = computeInsuranceStatus(vehicle.insuranceEndDate ?? null);
                const tachograph =
                  vehicle.type === 'TRUCK'
                    ? computeTachographStatus(vehicle.tachographCheckDate ?? null)
                    : null;
                const copieConforma =
                  vehicle.type === 'TRUCK'
                    ? computeCopieConformaStatus(vehicle.copieConformaExpiryDate ?? null)
                    : null;

                return (
                  <div key={vehicle.id} className="rounded-3xl border border-border bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{vehicle.licensePlate}</p>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.make} {vehicle.model}
                        </p>
                      </div>
                      <Badge variant={vehicle.status === 'OVERDUE' ? 'danger' : vehicle.status === 'DUE_SOON' ? 'warning' : 'success'}>
                        {vehicle.status === 'OVERDUE'
                          ? 'Depasit'
                          : vehicle.status === 'DUE_SOON'
                            ? 'In curand'
                            : 'OK'}
                      </Badge>
                    </div>
                    <dl className="mt-4 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Kilometraj actual</dt>
                        <dd>{toNumber(vehicle.currentOdometerKm ?? 0).toLocaleString('ro-RO')} km</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Urmatoarea revizie</dt>
                        <dd>
                          {formatDate(vehicle.nextRevisionDate)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Asigurare</dt>
                        <dd>
                          {insurance === 'expired'
                            ? 'Expirata'
                            : insurance === 'expiring'
                              ? 'In curand'
                              : 'Activa'}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Incepand cu</dt>
                        <dd>{formatDate(vehicle.insuranceStartDate)}</dd>
                      </div>
                      {vehicle.type === 'TRUCK' && (
                        <>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Tahograf</dt>
                            <dd>
                              {tachograph === 'overdue'
                                ? 'Depasit'
                                : tachograph === 'soon'
                                  ? 'In curand'
                                  : tachograph === 'missing'
                                    ? 'Nespecificat'
                                    : 'OK'}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Copie Conforma</dt>
                            <dd>
                              {copieConforma === 'overdue'
                                ? 'Depasit'
                                : copieConforma === 'soon'
                                  ? 'In curand'
                                  : copieConforma === 'missing'
                                    ? 'Nespecificat'
                                    : 'OK'}
                            </dd>
                          </div>
                        </>
                      )}
                    </dl>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function KpiCard({
  title,
  value,
  trend,
  tone = 'default',
}: {
  title: string;
  value: number;
  trend: string;
  tone?: 'default' | 'warning' | 'danger';
}) {
  const toneClasses =
    tone === 'danger'
      ? 'bg-red-500/10 text-red-600 border-red-100'
      : tone === 'warning'
        ? 'bg-amber-500/10 text-amber-600 border-amber-100'
        : 'bg-primary/5 text-primary border-primary/20';

  return (
    <Card className={cn('rounded-3xl bg-white shadow-sm', toneClasses)}>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
        <p className="mt-2 text-sm">{trend}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-muted p-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}





