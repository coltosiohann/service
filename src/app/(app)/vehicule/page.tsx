import { VehiclesTable } from '@/features/vehicles/components/vehicles-table';

export default async function VehiclesPage() {
  // Authentication disabled - no checks needed
  return (
    <div className="space-y-6">
      <VehiclesTable />
    </div>
  );
}
