import { VehicleForm } from '@/features/vehicles/components/vehicle-form';

export default async function CreateVehiclePage() {
  // Authentication disabled - no checks needed
  return (
    <div className="max-w-4xl space-y-6">
      <VehicleForm />
    </div>
  );
}
