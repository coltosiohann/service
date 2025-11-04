"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, RefreshCcw, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useOrg } from '@/components/providers/org-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useApiQuery } from '@/hooks/use-api';

import { tireStockCreateSchema } from '../validators';

type TireStockItem = {
  id: string;
  orgId: string;
  size: string;
  brand: string | null;
  notes: string | null;
  quantity: number;
  minQuantity: number;
  updatedAt: string | null;
  createdAt: string | null;
};

const createSchema = tireStockCreateSchema.omit({ orgId: true });

type CreateFormValues = z.infer<typeof createSchema>;
type CreateFormInput = z.input<typeof createSchema>;

type AdjustmentState = {
  quantity: number;
  reason: string;
};

export function TireStockManager() {
  const { orgId } = useOrg();
  const [adjustments, setAdjustments] = useState<Record<string, AdjustmentState>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    refetch,
    isFetching,
  } = useApiQuery<{ stock: TireStockItem[] }>('/api/tires/stock', {}, { key: ['tire-stock'] });

  const stock = useMemo(() => data?.stock ?? [], [data]);

  const form = useForm<CreateFormInput, unknown, CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      size: '',
      brand: '',
      notes: '',
      quantity: 0,
      minQuantity: 0,
    },
  });

  const handleCreate = form.handleSubmit(async (values) => {
    if (!orgId) {
      toast.error('Selectați o organizație activă înainte de a adăuga stoc.');
      return;
    }

    try {
      const response = await fetch('/api/tires/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          orgId,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? 'Nu am putut adăuga anvelopa.');
      }

      toast.success('Anvelopă adăugată în stoc.');
      form.reset({
        size: '',
        brand: '',
        notes: '',
        quantity: 0,
        minQuantity: 0,
      });
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nu am putut adăuga anvelopa.');
    }
  });

  const handleAdjustment = async (stockId: string, direction: 'add' | 'remove') => {
    if (!orgId) {
      toast.error('Selectați o organizație activă.');
      return;
    }

    const current = adjustments[stockId] ?? { quantity: 0, reason: '' };
    const amount = Number(current.quantity ?? 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Introduceți o cantitate pozitivă.');
      return;
    }

    const change = direction === 'add' ? amount : -amount;

    try {
      const response = await fetch(`/api/tires/stock/${stockId}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId,
          change,
          reason: current.reason,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? 'Ajustarea stocului a eșuat.');
      }

      toast.success('Stoc actualizat.');
      setAdjustments((prev) => ({
        ...prev,
        [stockId]: { quantity: 0, reason: '' },
      }));
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ajustarea stocului a eșuat.');
    }
  };

  const handleDelete = async (stockId: string, label: string) => {
    if (!orgId) {
      toast.error('Selectati o organizatie activa.');
      return;
    }

    const confirmed = window.confirm(`Stergeti anvelopa ${label}?`);
    if (!confirmed) {
      return;
    }

    setDeletingId(stockId);

    try {
      const response = await fetch(`/api/tires/stock/${stockId}?orgId=${orgId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? 'Nu s-a putut sterge anvelopa.');
      }

      toast.success('Anvelopa a fost stearsa.');
      setAdjustments((prev) => {
        const nextState = { ...prev };
        delete nextState[stockId];
        return nextState;
      });
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nu s-a putut sterge anvelopa.');
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
              <Label htmlFor="size">Dimensiune</Label>
              <Input id="size" placeholder="Ex: 315/70 R22.5" {...form.register('size')} />
              {form.formState.errors.size && (
                <p className="text-xs text-destructive">{form.formState.errors.size.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Marcă</Label>
              <Input id="brand" placeholder="Ex: Michelin" {...form.register('brand')} />
              {form.formState.errors.brand && (
                <p className="text-xs text-destructive">{form.formState.errors.brand.message}</p>
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
              <Label htmlFor="minQuantity">Stoc minim</Label>
              <Input
                id="minQuantity"
                type="number"
                min={0}
               {...form.register('minQuantity', { valueAsNumber: true })}
              />
              {form.formState.errors.minQuantity && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.minQuantity.message}
                </p>
              )}
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="notes">Observații</Label>
              <Textarea id="notes" rows={2} {...form.register('notes')} />
              {form.formState.errors.notes && (
                <p className="text-xs text-destructive">{form.formState.errors.notes.message}</p>
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
              Gestiune centralizată pentru anvelopele de camion.
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dimensiune</TableHead>
                  <TableHead>Marcă</TableHead>
                  <TableHead>Stoc curent</TableHead>
                  <TableHead>Stoc minim</TableHead>
                  <TableHead>Observații</TableHead>
                  <TableHead className="text-right">Ajustări</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock.map((item) => {
                  const adjustment = adjustments[item.id] ?? { quantity: 0, reason: '' };
                  const isLow = item.minQuantity > 0 && item.quantity <= item.minQuantity;

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-semibold">{item.size}</TableCell>
                      <TableCell>{item.brand ?? <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{item.quantity}</span>
                          {isLow && <Badge variant="danger">Stoc scăzut</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>{item.minQuantity ?? 0}</TableCell>
                      <TableCell className="max-w-xs text-sm text-muted-foreground">
                        {item.notes ?? '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              min={0}
                              value={adjustment.quantity ?? 0}
                              onChange={(event) =>
                                setAdjustments((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    quantity: Number(event.target.value),
                                    reason: prev[item.id]?.reason ?? '',
                                  },
                                }))
                              }
                              className="h-10 w-24"
                            />
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleAdjustment(item.id, 'add')}
                            >
                              + Stoc
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAdjustment(item.id, 'remove')}
                            >
                              - Stoc
                            </Button>
                          </div>
                          <Input
                            placeholder="Motiv ajustare"
                            value={adjustment.reason ?? ''}
                            onChange={(event) =>
                              setAdjustments((prev) => ({
                                ...prev,
                                [item.id]: {
                                  quantity: prev[item.id]?.quantity ?? 0,
                                  reason: event.target.value,
                                },
                              }))
                            }
                          />
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id, item.size)}
                              disabled={deletingId === item.id}
                            >
                              <Trash2 className="mr-2 size-4" />
                              Sterge
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
