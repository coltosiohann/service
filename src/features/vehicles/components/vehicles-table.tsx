"use client";

import { Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApiQuery } from '@/hooks/use-api';

import { InsuranceBadge } from './insurance-badge';
import { StatusPill } from './status-pill';
import { TachographBadge } from './tachograph-badge';

type VehicleListItem = {
  id: string;
  orgId: string;
  type: 'CAR' | 'TRUCK';
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  status: 'OK' | 'DUE_SOON' | 'OVERDUE';
  insuranceStatus: 'active' | 'expiring' | 'expired';
  tachographStatus: 'ok' | 'soon' | 'overdue' | 'missing' | null;
  hasTonaj: boolean;
  currentOdometerKm: number;
  nextRevisionDate: Date | null;
  insuranceEndDate: Date | null;
};

const typeFilters = [
  { value: 'ALL', label: 'Toate' },
  { value: 'CAR', label: 'Masini' },
  { value: 'TRUCK', label: 'Camioane' },
] as const;

const statusFilters = [
  { value: 'ALL', label: 'Status' },
  { value: 'OK', label: 'OK' },
  { value: 'DUE_SOON', label: 'In curand' },
  { value: 'OVERDUE', label: 'Depasit' },
] as const;

const insuranceFilters = [
  { value: 'ALL', label: 'Asigurare' },
  { value: 'active', label: 'Activa' },
  { value: 'expiring', label: 'In curand' },
  { value: 'expired', label: 'Expirata' },
] as const;

const tonajFilters = [
  { value: 'ALL', label: 'Tonaj' },
  { value: 'true', label: 'Tonaj mare' },
  { value: 'false', label: 'Fara tonaj' },
] as const;

const tachographFilters = [
  { value: 'ALL', label: 'Tahograf' },
  { value: 'ok', label: 'OK' },
  { value: 'soon', label: 'In curand' },
  { value: 'overdue', label: 'Depasit' },
  { value: 'missing', label: 'Nespecificat' },
] as const;

export function VehiclesTable() {
  const router = useRouter();
  const [type, setType] = useState<'ALL' | 'CAR' | 'TRUCK'>('ALL');
  const [status, setStatus] = useState<'ALL' | 'OK' | 'DUE_SOON' | 'OVERDUE'>('ALL');
  const [insurance, setInsurance] = useState<'ALL' | 'active' | 'expiring' | 'expired'>('ALL');
  const [truckTonaj, setTruckTonaj] = useState<'ALL' | 'true' | 'false'>('ALL');
  const [truckTachograph, setTruckTachograph] = useState<'ALL' | 'ok' | 'soon' | 'overdue' | 'missing'>('ALL');
  const [query, setQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    if (type !== 'TRUCK') {
      setTruckTonaj('ALL');
      setTruckTachograph('ALL');
    }
  }, [type]);

  const params = useMemo(
    () => ({
      type: type !== 'ALL' ? type : undefined,
      status: status !== 'ALL' ? status : undefined,
      insurance: insurance !== 'ALL' ? insurance : undefined,
      search: deferredQuery || undefined,
      'truck.tonajMare': truckTonaj !== 'ALL' ? truckTonaj : undefined,
      'truck.tahograf': truckTachograph !== 'ALL' ? truckTachograph : undefined,
    }),
    [type, status, insurance, deferredQuery, truckTonaj, truckTachograph],
  );

  const { data, isLoading, refetch } = useApiQuery<{ vehicles: VehicleListItem[] }>('/api/vehicles', params, {
    key: ['vehicles', params],
  });

  const vehicles = data?.vehicles ?? [];

  const handleDelete = async (vehicleId: string, licensePlate: string) => {
    if (!confirm(`Sigur doriti sa stergeti vehiculul ${licensePlate}?`)) {
      return;
    }

    setDeletingId(vehicleId);

    try {
      await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'DELETE',
      });

      toast.success('Vehiculul a fost sters.');
      refetch();
    } catch (error) {
      toast.error('Nu s-a putut sterge vehiculul.');
      console.error('Delete error:', error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-xl font-semibold">Autovehicule</CardTitle>
        <Button asChild>
          <Link href="/vehicule/creare">
            <Plus className="mr-2 size-4" />
            Adauga vehicul
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {typeFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={type === filter.value ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setType(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={status === filter.value ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setStatus(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
            {insuranceFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={insurance === filter.value ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setInsurance(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
          <div className="relative max-w-sm flex-1 lg:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cautati dupa numar sau VIN..."
              className="pl-9"
            />
          </div>
        </div>

        {type === 'TRUCK' && (
          <div className="flex flex-wrap gap-2">
            {tonajFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={truckTonaj === filter.value ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTruckTonaj(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
            {tachographFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={truckTachograph === filter.value ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTruckTachograph(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        )}

        <ScrollArea className="rounded-3xl border border-border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numar</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Asigurare</TableHead>
                <TableHead>Kilometraj</TableHead>
                <TableHead>Tahograf</TableHead>
                <TableHead className="text-right">Actiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-10 w-full rounded-2xl" />
                    </TableCell>
                  </TableRow>
                ))
              ) : vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Nu exista vehicule pentru filtrele selectate.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map((vehicle) => (
                  <TableRow
                    key={vehicle.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/vehicule/${vehicle.id}`)}
                    onKeyDown={(event) => {
                      if (event.currentTarget !== event.target) {
                        return;
                      }
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        router.push(`/vehicule/${vehicle.id}`);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                  >
                    <TableCell className="font-semibold">
                      <Link href={`/vehicule/${vehicle.id}`} className="hover:underline">
                        {vehicle.licensePlate}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {vehicle.make} {vehicle.model}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {vehicle.type === 'TRUCK' ? 'Camion' : 'Masina'}  -  {vehicle.year}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusPill status={vehicle.status} />
                    </TableCell>
                    <TableCell>
                      <InsuranceBadge state={vehicle.insuranceStatus} />
                    </TableCell>
                    <TableCell>{vehicle.currentOdometerKm.toLocaleString('ro-RO')} km</TableCell>
                    <TableCell>
                      {vehicle.type === 'TRUCK' ? (
                        <div className="flex items-center gap-2">
                          <TachographBadge state={vehicle.tachographStatus} />
                          {vehicle.hasTonaj ? <Badge variant="secondary">Tonaj mare</Badge> : null}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(vehicle.id, vehicle.licensePlate);
                        }}
                        disabled={deletingId === vehicle.id}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
