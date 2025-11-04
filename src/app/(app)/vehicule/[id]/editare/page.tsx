import { notFound } from 'next/navigation';

import { getDefaultOrg } from '@/lib/default-org';
import { getVehicleDetail } from '@/features/vehicles/detail';
import { VehicleEditForm } from '@/features/vehicles/components/vehicle-edit-form';

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

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Editare vehicul</h1>
        <p className="text-muted-foreground">
          {detail.vehicle.make} {detail.vehicle.model} - {detail.vehicle.licensePlate}
        </p>
      </div>
      <VehicleEditForm vehicle={detail.vehicle} />
    </div>
  );
}
