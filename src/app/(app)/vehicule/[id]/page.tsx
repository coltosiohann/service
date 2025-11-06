import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CopieConformaBadge } from '@/features/vehicles/components/copie-conforma-badge';
import { InsuranceBadge } from '@/features/vehicles/components/insurance-badge';
import { StatusPill } from '@/features/vehicles/components/status-pill';
import { TachographBadge } from '@/features/vehicles/components/tachograph-badge';
import { VehicleDetailActions } from '@/features/vehicles/components/vehicle-detail-actions';
import { getVehicleDetail } from '@/features/vehicles/detail';
import { getDefaultOrg } from '@/lib/default-org';
import { formatCurrency, formatDate } from '@/lib/utils';

type PageProps = {
  params: { id: string };
};

export default async function VehicleDetailPage({ params }: PageProps) {
  // Authentication disabled - get default organization
  const defaultOrg = await getDefaultOrg();

  const detail = await getVehicleDetail(defaultOrg.id, params.id).catch(() => null);

  if (!detail) {
    notFound();
  }

  const { vehicle, serviceEvents, odometerLogs, documents, reminders, tireMovements, mountedTires } = detail;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Detalii vehicul</h1>
          <p className="text-muted-foreground">Informatii complete despre vehicul</p>
        </div>
        <div className="flex gap-2">
          <VehicleDetailActions vehicleId={params.id} />
          <Link href={`/vehicule/${params.id}/editare`}>
            <Button variant="secondary">
              <Pencil className="mr-2 size-4" />
              Editeaza
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
              {vehicle.licensePlate}
            </span>
            <StatusPill status={vehicle.status} />
          </div>
          <h1 className="text-2xl font-semibold">
            {vehicle.make} {vehicle.model} - {vehicle.year}
          </h1>
          <p className="text-sm text-muted-foreground">
            {vehicle.type === 'TRUCK' ? 'Camion' : vehicle.type === 'EQUIPMENT' ? 'Utilaje' : 'Masina'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>Kilometraj actual:</span>
          <Badge variant="secondary">
            {vehicle.currentOdometerKm.toLocaleString('ro-RO')} km
          </Badge>
          {vehicle.nextRevisionDate && (
            <>
              <span>Urmatoarea revizie:</span>
              <Badge variant="outline">{formatDate(vehicle.nextRevisionDate)}</Badge>
            </>
          )}
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Asigurare</CardTitle>
            <CardDescription>Detalii valabilitate polita</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Nr. polita</span>
              <span className="font-medium">{vehicle.insurancePolicyNumber ?? '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Valabila de la</span>
              <span className="font-medium">{formatDate(vehicle.insuranceStartDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Valabila pana la</span>
              <span className="font-medium">{formatDate(vehicle.insuranceEndDate)}</span>
            </div>
            <InsuranceBadge state={vehicle.insuranceStatus} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revizie</CardTitle>
            <CardDescription>Monitorizati pragurile urmatoare.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Urmatoarea revizie (km)</span>
              <span className="font-medium">
                {vehicle.nextRevisionAtKm
                  ? vehicle.nextRevisionAtKm.toLocaleString('ro-RO')
                  : ''}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Urmatoarea revizie (data)</span>
              <span className="font-medium">{formatDate(vehicle.nextRevisionDate)}</span>
            </div>
          </CardContent>
        </Card>

        {vehicle.type === 'TRUCK' && (
          <Card>
            <CardHeader>
              <CardTitle>Conformitate camion</CardTitle>
              <CardDescription>Status tahograf, copie conforma si tonaj.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Autorizatie tonaj mare</span>
                <Badge variant={vehicle.hasHeavyTonnageAuthorization ? 'secondary' : 'outline'}>
                  {vehicle.hasHeavyTonnageAuthorization ? 'Activa' : 'Nu'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Data verificare tahograf</span>
                <span className="font-medium">{formatDate(vehicle.tachographCheckDate)}</span>
              </div>
              <TachographBadge state={vehicle.tachographStatus} />
              <div className="flex items-center justify-between text-sm">
                <span>Copie conforma - de la</span>
                <span className="font-medium">{formatDate(vehicle.copieConformaStartDate)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Copie conforma - expira la</span>
                <span className="font-medium">{formatDate(vehicle.copieConformaExpiryDate)}</span>
              </div>
              <CopieConformaBadge state={vehicle.copieConformaStatus} />
            </CardContent>
          </Card>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Istoric service</CardTitle>
            <CardDescription>Ultimele operatiuni inregistrate.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {serviceEvents.length === 0 ? (
              <EmptyState message="Nu exista evenimente service." />
            ) : (
              serviceEvents.map((event) => (
                <div key={event.id} className="rounded-2xl border border-border px-4 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{event.type}</span>
                    <span className="text-muted-foreground">{formatDate(event.date)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{event.odometerKm ? `${Number(event.odometerKm).toLocaleString('ro-RO')} km` : ''}</span>
                    <span>
                      {event.costAmount
                        ? formatCurrency(Number(event.costAmount), 'ro-RO', event.costCurrency ?? 'RON')
                        : ''}
                    </span>
                  </div>
                  {event.notes && <p className="mt-2 text-sm">{event.notes}</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kilometraj</CardTitle>
            <CardDescription>Ultimele inregistrari manuale.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {odometerLogs.length === 0 ? (
              <EmptyState message="Nu exista inregistrari de kilometraj." />
            ) : (
              odometerLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm">
                  <span>{formatDate(log.date)}</span>
                  <span className="font-medium">{Number(log.valueKm).toLocaleString('ro-RO')} km</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anvelope</CardTitle>
            <CardDescription>Anvelope montate si istoric schimbari.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mountedTires.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Anvelope montate actualmente</h4>
                {mountedTires.map((tire) => (
                  <div key={tire.stockId} className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{tire.brand} {tire.model}</span>
                      <Badge variant="secondary">Montat</Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {tire.dimension} • DOT: {tire.dot}
                    </div>
                    {tire.mountDate && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Montat la: {formatDate(tire.mountDate)}
                        {tire.mountOdometerKm && ` • ${tire.mountOdometerKm.toLocaleString('ro-RO')} km`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Istoric miscarile de anvelope</h4>
              {tireMovements.length === 0 ? (
                <EmptyState message="Nu exista miscari de anvelope." />
              ) : (
                tireMovements.slice(0, 5).map((movement) => (
                  <div key={movement.id} className="rounded-2xl border border-border px-4 py-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{movement.brand} {movement.model}</span>
                      <span className="text-muted-foreground">{formatDate(movement.date)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{movement.dimension} • DOT: {movement.dot}</span>
                      <Badge variant={movement.type === 'MONTARE' || movement.type === 'INTRARE' ? 'secondary' : 'outline'}>
                        {movement.type}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Cantitate: {movement.quantity}</p>
                    {movement.notes && <p className="mt-2 text-sm text-muted-foreground">{movement.notes}</p>}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Documente</CardTitle>
            <CardDescription>Fisiere asociate vehiculului.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {documents.length === 0 ? (
              <EmptyState message="Nu exista documente incarcate." />
            ) : (
              documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.fileUrl ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm hover:bg-muted/60"
                >
                  <span className="font-medium">{doc.fileName}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(doc.expiresAt)}</span>
                </a>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Remindere</CardTitle>
            <CardDescription>Statusul notificarilor active.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {reminders.length === 0 ? (
              <EmptyState message="Nu exista remindere configurate." />
            ) : (
              reminders.map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {reminder.kind === 'DATE'
                        ? `Termen: ${formatDate(reminder.dueDate)}`
                        : `Prag: ${Number(reminder.dueKm ?? 0).toLocaleString('ro-RO')} km`}
                    </p>
                    <p className="text-xs text-muted-foreground">Canal: {reminder.channel}</p>
                  </div>
                  <Badge variant={reminder.status === 'PENDING' ? 'warning' : 'secondary'}>
                    {reminder.status === 'PENDING' ? 'In asteptare' : reminder.status === 'SENT' ? 'Trimis' : 'Dezactivat'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-muted p-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

