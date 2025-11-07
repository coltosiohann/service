"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const interventionSchema = z.object({
  type: z.enum(['OIL_CHANGE', 'REVISION', 'REPAIR', 'INSPECTION', 'OTHER']),
  date: z.date(),
  odometerKm: z.number().nonnegative(),
  notes: z.string().max(2000).optional(),
  partsUsed: z.string().max(1000).optional(),
});

type InterventionFormValues = z.infer<typeof interventionSchema>;

interface InterventionFormProps {
  vehicleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const typeLabels: Record<string, string> = {
  OIL_CHANGE: 'Schimb ulei',
  REVISION: 'Revizie',
  REPAIR: 'Reparație',
  INSPECTION: 'Inspecție',
  OTHER: 'Altele',
};

export function InterventionForm({
  vehicleId,
  open,
  onOpenChange,
  onSuccess,
}: InterventionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InterventionFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(interventionSchema) as any,
    defaultValues: {
      type: 'REPAIR',
      date: new Date(),
      odometerKm: 0,
      notes: '',
      partsUsed: '',
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/service-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          notes: values.notes ? `${values.notes}${values.partsUsed ? `\n\nPiese folosite:\n${values.partsUsed}` : ''}` : values.partsUsed ? `Piese folosite:\n${values.partsUsed}` : '',
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? 'Nu s-a putut salva intervenția.');
      }

      toast.success('Intervenția a fost salvată.');
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nu s-a putut salva intervenția.');
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adaugă intervenție</DialogTitle>
          <DialogDescription>
            Înregistrează o operațiune de service la vehiculul curent.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tip intervenție *</Label>
            <Select
              value={form.watch('type')}
              onValueChange={(value) => form.setValue('type', value as 'OIL_CHANGE' | 'REVISION' | 'REPAIR' | 'INSPECTION' | 'OTHER')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selectați tipul" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.type && (
              <p className="text-xs text-destructive">{form.formState.errors.type.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data intervenției *</Label>
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
              <Label htmlFor="odometerKm">Kilometraj *</Label>
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
            <Label htmlFor="partsUsed">Piese folosite</Label>
            <Textarea
              id="partsUsed"
              rows={3}
              placeholder="Enumerați piesele schimbate..."
              {...form.register('partsUsed')}
            />
            {form.formState.errors.partsUsed && (
              <p className="text-xs text-destructive">{form.formState.errors.partsUsed.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observații</Label>
            <Textarea
              id="notes"
              rows={4}
              placeholder="Detalii suplimentare despre intervenție..."
              {...form.register('notes')}
            />
            {form.formState.errors.notes && (
              <p className="text-xs text-destructive">{form.formState.errors.notes.message}</p>
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
              Salvează
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
