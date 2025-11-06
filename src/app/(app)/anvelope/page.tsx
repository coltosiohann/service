import { UpdatedTireStockManager } from '@/features/tires/components/updated-tire-stock-manager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function TireStockPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Stoc anvelope</h1>
        <p className="text-muted-foreground">
          Administrează anvelopele disponibile și urmărește consumul.
        </p>
      </div>
      <UpdatedTireStockManager />
    </div>
  );
}
