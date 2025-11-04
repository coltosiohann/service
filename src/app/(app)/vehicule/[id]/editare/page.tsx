import { notFound } from 'next/navigation';

import { VehicleEditForm } from '@/features/vehicles/components/vehicle-edit-form';
import { getVehicleDetail } from '@/features/vehicles/detail';
import { getDefaultOrg } from '@/lib/default-org';

type PageProps = {
  params: { id: string };
};

export default async function EditVehiclePage({ params }: PageProps) {
  // Authentication disabled - get default organization
  const defaultOrg = await getDefaultOrg();

  const detail = await getVehicleDetail(defaultOrg.id, params.id).catch(() => null);

  if (!detail) {
    notFound();
  }

  const parseDate = (value: Date | string | null | undefined) =>
    value ? new Date(value) : null;

  const formVehicle = {
    ...detail.vehicle,
    lastOilChangeDate: parseDate(detail.vehicle.lastOilChangeDate),
    lastRevisionDate: parseDate(detail.vehicle.lastRevisionDate),
    nextRevisionDate: parseDate(detail.vehicle.nextRevisionDate),
    insuranceEndDate: parseDate(detail.vehicle.insuranceEndDate),
    tachographCheckDate: parseDate(detail.vehicle.tachographCheckDate),
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Editare vehicul</h1>
        <p className="text-muted-foreground">
          {detail.vehicle.make} {detail.vehicle.model} - {detail.vehicle.licensePlate}
        </p>
      </div>
      <VehicleEditForm vehicle={formVehicle} />
    </div>
  );
}
