import { TireStockManager } from '@/features/tires/components/tire-stock-manager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function TireStockPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Stoc anvelope</h1>
        <p className="text-muted-foreground">
          Administrează anvelopele disponibile pentru camioane și urmărește consumul.
        </p>
      </div>
      <TireStockManager />
    </div>
  );
}
