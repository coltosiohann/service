"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApiQuery } from '@/hooks/use-api';
import { cn } from '@/lib/utils';

const tireChangeSchema = z.object({
  operation: z.enum(['MONTARE', 'DEMONTARE']),
  stockId: z.string().uuid('Selectați o anvelopă.'),
  quantity: z.number().int().positive('Cantitatea trebuie să fie cel puțin 1.'),
  date: z.date(),
  odometerKm: z.number().nonnegative().optional().nullable(),
  driverName: z.string().max(100).optional(),
});

type TireChangeFormValues = z.infer<typeof tireChangeSchema>;

interface TireChangeFormProps {
  vehicleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type TireStockItem = {
  id: string;
  brand: string;
  model: string;
  dimension: string;
  quantity: number;
  location: string | null;
};

type MountedTire = {
  stockId: string;
  brand: string;
  model: string;
  dimension: string;
  mountDate: string;
  mountOdometerKm: number | null;
};

export function TireChangeForm({
  vehicleId,
  open,
  onOpenChange,
  onSuccess,
}: TireChangeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: stockData, refetch: refetchStock } = useApiQuery<{ stock: TireStockItem[] }>(
    '/api/tires/stock',
    {},
    { key: ['tire-stock'], enabled: open },
  );

  const { data: mountedData, refetch: refetchMounted } = useApiQuery<{ mounted: MountedTire[] }>(
    `/api/vehicles/${vehicleId}/tires`,
    {},
    { key: ['vehicle-mounted-tires', vehicleId], enabled: open },
  );

  const stock = stockData?.stock ?? [];
  const mounted = mountedData?.mounted ?? [];

  const form = useForm<TireChangeFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(tireChangeSchema) as any,
    defaultValues: {
      operation: 'MONTARE',
      stockId: '',
      quantity: 1,
      date: new Date(),
      odometerKm: 0,
      driverName: '',
    },
  });

  const operation = form.watch('operation');

  useEffect(() => {
    if (open) {
      refetchStock();
      refetchMounted();
    }
  }, [open, refetchStock, refetchMounted]);

  const handleSubmit = form.handleSubmit(async (values) => {
    // Validate quantity for MONTARE operation
    if (values.operation === 'MONTARE') {
      const selectedStock = stock.find((item) => item.id === values.stockId);
      if (selectedStock && values.quantity > selectedStock.quantity) {
        toast.error(`Stoc insuficient. Disponibil: ${selectedStock.quantity} anvelope.`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const endpoint =
        values.operation === 'MONTARE'
          ? `/api/vehicles/${vehicleId}/tires/mount`
          : `/api/vehicles/${vehicleId}/tires/unmount`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stockId: values.stockId,
          quantity: values.quantity,
          date: values.date,
          odometerKm: values.odometerKm,
          driverName: values.driverName?.trim() ? values.driverName.trim() : undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? 'Operațiune invalidă.');
      }

      toast.success(
        values.operation === 'MONTARE'
          ? 'Anvelope montate cu succes.'
          : 'Anvelope demontate cu succes.',
      );
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Operațiune eșuată.');
    } finally {
      setIsSubmitting(false);
    }
  });

  const availableOptions =
    operation === 'MONTARE'
      ? stock.filter((item) => item.quantity > 0)
      : mounted;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schimb cauciucuri</DialogTitle>
          <DialogDescription>
            Selectați anvelope din stoc și le marchează ca montate/demontate.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="operation">Tip operațiune *</Label>
            <Select
              value={form.watch('operation')}
              onValueChange={(value) => {
                form.setValue('operation', value as 'MONTARE' | 'DEMONTARE');
                form.setValue('stockId', '');
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTARE">Montare</SelectItem>
                <SelectItem value="DEMONTARE">Demontare</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.operation && (
              <p className="text-xs text-destructive">{form.formState.errors.operation.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="stockId">
              {operation === 'MONTARE' ? 'Selectați anvelope din stoc' : 'Selectați anvelope montate'} *
            </Label>
            <Select value={form.watch('stockId')} onValueChange={(value) => form.setValue('stockId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Alegeți..." />
              </SelectTrigger>
              <SelectContent>
                {availableOptions.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    {operation === 'MONTARE'
                      ? 'Nu există anvelope disponibile în stoc.'
                      : 'Nu există anvelope montate pe vehicul.'}
                  </div>
                ) : (
                  availableOptions.map((item) => {
                    const itemId = 'stockId' in item ? item.stockId : 'id' in item ? (item as TireStockItem).id : '';
                    return (
                      <SelectItem key={itemId} value={itemId}>
                        {item.brand} {item.model} • {item.dimension}
                        {operation === 'MONTARE' && 'quantity' in item && ` (Disponibil: ${item.quantity})`}
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
            {form.formState.errors.stockId && (
              <p className="text-xs text-destructive">{form.formState.errors.stockId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Cantitate *</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              {...form.register('quantity', { valueAsNumber: true })}
            />
            {form.formState.errors.quantity && (
              <p className="text-xs text-destructive">{form.formState.errors.quantity.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !form.watch('date') && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {form.watch('date') ? format(form.watch('date'), 'PPP') : 'Selectați data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch('date')}
                    onSelect={(date) => date && form.setValue('date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.date && (
                <p className="text-xs text-destructive">{form.formState.errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="odometerKm">Kilometraj</Label>
              <Input
                id="odometerKm"
                type="number"
                min={0}
                {...form.register('odometerKm', { valueAsNumber: true })}
              />
              {form.formState.errors.odometerKm && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.odometerKm.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="driverName">Nume șofer</Label>
            <Input
              id="driverName"
              placeholder="Numele șoferului..."
              {...form.register('driverName')}
            />
            {form.formState.errors.driverName && (
              <p className="text-xs text-destructive">{form.formState.errors.driverName.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Anulează
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Confirmă
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
