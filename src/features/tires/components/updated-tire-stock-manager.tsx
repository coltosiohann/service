"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { History, Plus, RefreshCcw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useApiQuery } from '@/hooks/use-api';
import { formatDate } from '@/lib/utils';

import { tireStockCreateSchema } from '../validators';

type TireStockItem = {
  id: string;
  orgId: string;
  brand: string;
  model: string;
  dimension: string;
  quantity: number;
  location: string | null;
  updatedAt: string | null;
  createdAt: string | null;
};

type TireMovement = {
  id: string;
  type: string;
  date: string;
  quantity: number;
  vehicleId: string | null;
  odometerKm: number | null;
  notes: string | null;
  createdAt: string;
  vehicleLicensePlate: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  userName: string | null;
  userEmail: string | null;
  driverName: string | null;
};

type TireActivityItem = {
  id: string;
  type: string;
  date: string;
  quantity: number;
  brand: string;
  model: string;
  dimension: string;
  vehicleId: string | null;
  vehicleLicensePlate: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  notes: string | null;
  driverName: string | null;
};

const MOVEMENT_META: Record<
  string,
  {
    label: string;
    variant: 'secondary' | 'outline';
  }
> = {
  MONTARE: { label: 'Montare vehicul', variant: 'outline' },
  DEMONTARE: { label: 'Demontare vehicul', variant: 'secondary' },
  INTRARE: { label: 'Intrare stoc', variant: 'secondary' },
  IESIRE: { label: 'Iesire stoc', variant: 'outline' },
};

const createSchema = tireStockCreateSchema.omit({ orgId: true });

type CreateFormValues = z.infer<typeof createSchema>;
type CreateFormInput = z.input<typeof createSchema>;

export function UpdatedTireStockManager() {
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<TireStockItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'INTRARE' | 'IESIRE'>('INTRARE');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0);
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    refetch,
    isFetching,
  } = useApiQuery<{ stock: TireStockItem[] }>('/api/tires/stock', {}, { key: ['tire-stock'] });

  const {
    data: movementsData,
    refetch: refetchMovements,
  } = useApiQuery<{ movements: TireMovement[] }>(
    selectedStock ? `/api/tires/stock/${selectedStock.id}/movements` : '',
    {},
    { key: ['tire-movements', selectedStock?.id], enabled: !!selectedStock },
  );

  const stock = useMemo(() => data?.stock ?? [], [data]);
  const movements = movementsData?.movements ?? [];

  const {
    data: activityData,
    isLoading: isActivityLoading,
    isFetching: isActivityFetching,
    refetch: refetchActivity,
  } = useApiQuery<{ movements: TireActivityItem[] }>('/api/tires/movements', {}, { key: ['tire-activity'] });

  const recentMovements = activityData?.movements ?? [];

  const form = useForm<CreateFormInput, unknown, CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      brand: '',
      model: '',
      dimension: '',
      quantity: 0,
      location: '',
    },
  });

  const handleCreate = form.handleSubmit(async (values) => {
    try {
      const response = await fetch('/api/tires/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? 'Nu am putut adăuga anvelopa.');
      }

      toast.success('Anvelopă adăugată în stoc.');
      form.reset();
      await refetch();
      await refetchActivity();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nu am putut adăuga anvelopa.');
    }
  });

  const openAdjustmentDialog = (item: TireStockItem, type: 'INTRARE' | 'IESIRE') => {
    setSelectedStock(item);
    setAdjustmentType(type);
    setAdjustmentQuantity(0);
    setAdjustmentNotes('');
    setAdjustmentDialogOpen(true);
  };

  const handleAdjustment = async () => {
    if (!selectedStock || adjustmentQuantity <= 0) {
      toast.error('Introduceți o cantitate pozitivă.');
      return;
    }

    setIsAdjusting(true);

    try {
      const response = await fetch(`/api/tires/stock/${selectedStock.id}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: adjustmentType,
          quantity: adjustmentQuantity,
          date: new Date(),
          notes: adjustmentNotes,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? 'Ajustarea stocului a eșuat.');
      }

      toast.success('Stoc actualizat.');
      setAdjustmentDialogOpen(false);
      await refetch();
      await refetchActivity();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ajustarea stocului a eșuat.');
    } finally {
      setIsAdjusting(false);
    }
  };

  const openHistoryDialog = async (item: TireStockItem) => {
    setSelectedStock(item);
    setHistoryDialogOpen(true);
    await refetchMovements();
  };

  const handleDelete = async (stockId: string, label: string) => {
    const confirmed = window.confirm(`Ștergeți anvelopa ${label}?`);
    if (!confirmed) {
      return;
    }

    setDeletingId(stockId);

    try {
      const response = await fetch(`/api/tires/stock/${stockId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? 'Nu s-a putut șterge anvelopa.');
      }

      toast.success('Anvelopa a fost ștearsă.');
      await refetch();
      await refetchActivity();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nu s-a putut șterge anvelopa.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Adaugă anvelopă în stoc</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="brand">Marcă (opțional)</Label>
              <Input id="brand" placeholder="Ex: Michelin" {...form.register('brand')} />
              {form.formState.errors.brand && (
                <p className="text-xs text-destructive">{form.formState.errors.brand.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model (opțional)</Label>
              <Input id="model" placeholder="Ex: X Multi Z" {...form.register('model')} />
              {form.formState.errors.model && (
                <p className="text-xs text-destructive">{form.formState.errors.model.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dimension">Dimensiune (opțional)</Label>
              <Input id="dimension" placeholder="Ex: 315/70 R22.5" {...form.register('dimension')} />
              {form.formState.errors.dimension && (
                <p className="text-xs text-destructive">{form.formState.errors.dimension.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantitate inițială</Label>
              <Input
                id="quantity"
                type="number"
                min={0}
                {...form.register('quantity', { valueAsNumber: true })}
              />
              {form.formState.errors.quantity && (
                <p className="text-xs text-destructive">{form.formState.errors.quantity.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Locație</Label>
              <Input id="location" placeholder="Ex: Depozit A" {...form.register('location')} />
              {form.formState.errors.location && (
                <p className="text-xs text-destructive">{form.formState.errors.location.message}</p>
              )}
            </div>
            <div className="flex justify-end lg:col-span-2">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                <Plus className="mr-2 size-4" />
                Adaugă în stoc
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Stoc anvelope</CardTitle>
            <p className="text-sm text-muted-foreground">
              Gestiune centralizată pentru anvelope.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className="mr-2 size-4" />
            Actualizează
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-2xl" />
              ))}
            </div>
          ) : stock.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nu există anvelope înregistrate în stoc.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Marcă</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Dimensiune</TableHead>
                    <TableHead>Stoc curent</TableHead>
                    <TableHead>Locație</TableHead>
                    <TableHead className="text-right">Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stock.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.brand}</TableCell>
                      <TableCell>{item.model}</TableCell>
                      <TableCell>{item.dimension}</TableCell>
                      <TableCell>
                        <Badge variant={item.quantity > 0 ? 'secondary' : 'outline'}>
                          {item.quantity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.location || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAdjustmentDialog(item, 'INTRARE')}
                          >
                            + Intrare
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAdjustmentDialog(item, 'IESIRE')}
                          >
                            - Ieșire
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openHistoryDialog(item)}
                          >
                            <History className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id, `${item.brand} ${item.model}`)}
                            disabled={deletingId === item.id}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Activitate recenta</CardTitle>
            <p className="text-sm text-muted-foreground">
              Urmareste ultimele montari si demontari legate de vehicule.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchActivity()}
            disabled={isActivityLoading || isActivityFetching}
          >
            <RefreshCcw className="mr-2 size-4" />
            Reimprospateaza
          </Button>
        </CardHeader>
        <CardContent>
          {isActivityLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          ) : recentMovements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nu exista inca miscari de anvelope inregistrate.
            </p>
          ) : (
            <div className="space-y-3">
              {recentMovements.slice(0, 10).map((movement) => {
                const meta = MOVEMENT_META[movement.type] ?? { label: movement.type, variant: 'outline' as const };
                return (
                  <div key={movement.id} className="rounded-2xl border border-border px-4 py-3 text-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold">
                          {movement.quantity} x {movement.brand} {movement.model}
                        </p>
                        <p className="text-xs text-muted-foreground">
                        {movement.dimension}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(movement.date)}</p>
                      </div>
                    </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {movement.vehicleLicensePlate ? (
                    <>
                      Vehicul:{' '}
                      {movement.vehicleId ? (
                        <Link
                          href={`/vehicule/${movement.vehicleId}`}
                          className="font-medium text-primary underline-offset-2 hover:underline"
                        >
                          {movement.vehicleLicensePlate}
                        </Link>
                      ) : (
                        <span className="font-medium">{movement.vehicleLicensePlate}</span>
                      )}{' '}
                      {movement.vehicleMake} {movement.vehicleModel}
                      {movement.driverName && ` · Șofer: ${movement.driverName}`}
                    </>
                  ) : (
                    'Operatiune direct in stoc'
                  )}
                </div>
                    {movement.notes && <p className="mt-2 text-sm">{movement.notes}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjustmentType === 'INTRARE' ? 'Intrare stoc' : 'Ieșire stoc'}
            </DialogTitle>
          </DialogHeader>
          {selectedStock && (
            <div className="space-y-4">
              <div className="text-sm">
                <p className="font-medium">
                  {selectedStock.brand} {selectedStock.model} • {selectedStock.dimension}
                </p>
                <p className="text-muted-foreground">
                  Stoc curent: {selectedStock.quantity}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adjustQuantity">Cantitate</Label>
                <Input
                  id="adjustQuantity"
                  type="number"
                  min={1}
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adjustNotes">Observații</Label>
                <Textarea
                  id="adjustNotes"
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAdjustmentDialogOpen(false)}
                  disabled={isAdjusting}
                >
                  Anulează
                </Button>
                <Button onClick={handleAdjustment} disabled={isAdjusting}>
                  Confirmă
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Istoric mișcări</DialogTitle>
          </DialogHeader>
          {selectedStock && (
            <div className="space-y-4">
              <div className="text-sm">
                <p className="font-medium">
                  {selectedStock.brand} {selectedStock.model} • {selectedStock.dimension}
                </p>
              </div>
              {movements.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nu există mișcări înregistrate.</p>
              ) : (
                <div className="space-y-2">
                  {movements.map((movement) => {
                    const meta = MOVEMENT_META[movement.type] ?? { label: movement.type, variant: 'outline' as const };
                    return (
                      <div key={movement.id} className="rounded-2xl border border-border px-4 py-3 text-sm">
                        <div className="flex items-center justify-between">
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                          <span className="text-xs text-muted-foreground">{formatDate(movement.date)}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Cantitate: {movement.quantity}
                        </p>
                        {movement.vehicleLicensePlate && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Vehicul:{' '}
                            {movement.vehicleId ? (
                              <Link
                                href={`/vehicule/${movement.vehicleId}`}
                                className="font-medium text-primary underline-offset-2 hover:underline"
                              >
                                {movement.vehicleLicensePlate}
                              </Link>
                            ) : (
                              <span className="font-medium">{movement.vehicleLicensePlate}</span>
                            )}{' '}
                            {movement.vehicleMake} {movement.vehicleModel}
                          </p>
                        )}
                    {movement.odometerKm && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Kilometraj: {movement.odometerKm.toLocaleString('ro-RO')} km
                      </p>
                    )}
                    {movement.driverName && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Șofer: {movement.driverName}
                      </p>
                    )}
                    {movement.notes && (
                      <p className="mt-1 text-sm">{movement.notes}</p>
                    )}
                        {movement.userName && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Utilizator: {movement.userName}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
