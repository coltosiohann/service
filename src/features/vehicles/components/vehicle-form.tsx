"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApiMutation, useApiQuery } from '@/hooks/use-api';

const vehicleSchema = z.object({
  type: z.enum(['CAR', 'TRUCK', 'EQUIPMENT']),
  make: z.string().min(1, 'Marca este obligatorie.'),
  model: z.string().min(1, 'Modelul este obligatoriu.'),
  year: z.coerce.number().int().min(1980, 'An invalid.').max(new Date().getFullYear() + 1),
  vin: z
    .string()
    .min(11, 'VIN trebuie sa contina minim 11 caractere.')
    .max(17, 'VIN trebuie sa contina maxim 17 caractere.')
    .optional()
    .or(z.literal('')),
  licensePlate: z.string().min(3, 'Numarul de inmatriculare este obligatoriu.'),
  currentOdometerKm: z.coerce.number().nonnegative('Kilometrajul trebuie sa fie pozitiv.'),
  nextRevisionDate: z.string().optional(),
  nextRevisionAtKm: z.string().optional(),
  insurancePolicyNumber: z.string().min(1, 'Numarul politei este obligatoriu.'),
  insuranceStartDate: z.string().optional(),
  insuranceEndDate: z.string().optional(),
  hasHeavyTonnageAuthorization: z.union([z.literal('on'), z.boolean()]).optional(),
  tachographCheckDate: z.string().optional(),
  copieConformaStartDate: z.string().optional(),
  tireStockId: z.string().optional(),
  tireQuantity: z.coerce.number().int().optional(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;
type VehicleFormInput = z.input<typeof vehicleSchema>;

type TireStock = {
  id: string;
  size: string;
  brand: string | null;
  quantity: number;
  minQuantity: number;
};

export function VehicleForm() {
  const router = useRouter();

  const form = useForm<VehicleFormInput, unknown, VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      type: 'CAR',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      licensePlate: '',
      currentOdometerKm: 0,
      insurancePolicyNumber: '',
      insuranceStartDate: '',
      insuranceEndDate: '',
      hasHeavyTonnageAuthorization: false,
      copieConformaStartDate: '',
      tireStockId: '',
      tireQuantity: 0,
    },
  });

  const mutation = useApiMutation<{ vehicle: { id: string } }, Record<string, unknown>>('/api/vehicles', 'POST');

  // Fetch tire stock
  const { data: tireStockData } = useApiQuery<{ stock: TireStock[] }>('/api/tires/stock');

  const onSubmit = async (values: VehicleFormValues) => {
    console.log('Form submitted!', { values });

    // Build tire usage array if tire is selected
    const tiresUsage =
      values.tireStockId && values.tireQuantity && values.tireQuantity > 0
        ? [{ stockId: values.tireStockId, quantity: values.tireQuantity }]
        : undefined;

    const payload = {
      type: values.type,
      make: values.make,
      model: values.model,
      year: values.year,
      vin: values.vin ? values.vin.toUpperCase() : undefined,
      licensePlate: values.licensePlate.toUpperCase(),
      currentOdometerKm: values.currentOdometerKm,
      nextRevisionDate: values.nextRevisionDate ? new Date(values.nextRevisionDate) : null,
      nextRevisionAtKm: values.nextRevisionAtKm ? Number(values.nextRevisionAtKm) : null,
      insurancePolicyNumber: values.insurancePolicyNumber,
      insuranceStartDate: values.insuranceStartDate ? new Date(values.insuranceStartDate) : null,
      insuranceEndDate: values.insuranceEndDate ? new Date(values.insuranceEndDate) : null,
      hasHeavyTonnageAuthorization:
        values.type === 'TRUCK'
          ? Boolean(values.hasHeavyTonnageAuthorization === 'on' || values.hasHeavyTonnageAuthorization === true)
          : undefined,
      tachographCheckDate:
        values.type === 'TRUCK' && values.tachographCheckDate
          ? new Date(values.tachographCheckDate)
          : null,
      copieConformaStartDate:
        values.type === 'TRUCK' && values.copieConformaStartDate
          ? new Date(values.copieConformaStartDate)
          : null,
      tiresUsage,
      tireUsageReason: tiresUsage ? 'Anvelope montate la creare vehicul' : undefined,
    };

    console.log('Sending payload:', payload);

    try {
      const result = await mutation.mutateAsync(payload);
      console.log('Success!', result);
      toast.success('Vehiculul a fost adaugat.');
      router.push('/vehicule');
    } catch (error) {
      console.error('Error creating vehicle:', error);
      toast.error(error instanceof Error ? error.message : 'Nu s-a putut salva vehiculul.');
    }
  };

  const typeValue = form.watch('type');
  const selectedTireStockId = form.watch('tireStockId');

  // Get available tire stock list
  const tireStock = tireStockData?.stock ?? [];

  // Find selected tire to show available quantity
  const selectedTire = tireStock.find((tire) => tire.id === selectedTireStockId);

  useEffect(() => {
    if (typeValue !== 'TRUCK') {
      form.setValue('hasHeavyTonnageAuthorization', false);
      form.setValue('tachographCheckDate', '');
      form.setValue('copieConformaStartDate', '');
      form.clearErrors([
        'hasHeavyTonnageAuthorization',
        'tachographCheckDate',
        'copieConformaStartDate',
      ]);
    }
  }, [typeValue, form]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Descriere vehicul</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Tip</Label>
              <select
                id="type"
                className="flex h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                {...form.register('type')}
              >
                <option value="CAR">Masina</option>
                <option value="TRUCK">Camion</option>
                <option value="EQUIPMENT">Utilaje</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="make">Marca</Label>
              <Input id="make" placeholder="Ex: Volvo" {...form.register('make')} />
              <FieldError message={form.formState.errors.make?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input id="model" placeholder="Ex: FH16" {...form.register('model')} />
              <FieldError message={form.formState.errors.model?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">An fabricatie</Label>
              <Input id="year" type="number" {...form.register('year', { valueAsNumber: true })} />
              <FieldError message={form.formState.errors.year?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licensePlate">Numar inmatriculare</Label>
              <Input id="licensePlate" placeholder="B-123-ABC" {...form.register('licensePlate')} />
              <FieldError message={form.formState.errors.licensePlate?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vin">VIN</Label>
              <Input id="vin" placeholder="Seria de sasiu" {...form.register('vin')} />
              <FieldError message={form.formState.errors.vin?.message} />
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="currentOdometerKm">Kilometraj actual</Label>
              <Input
                id="currentOdometerKm"
                type="number"
                {...form.register('currentOdometerKm', { valueAsNumber: true })}
              />
              <FieldError message={form.formState.errors.currentOdometerKm?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextRevisionAtKm">Urmatoarea revizie la (km)</Label>
              <Input
                id="nextRevisionAtKm"
                type="number"
                {...form.register('nextRevisionAtKm')}
              />
              <FieldError message={form.formState.errors.nextRevisionAtKm?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextRevisionDate">Urmatoarea revizie la (data)</Label>
              <Input id="nextRevisionDate" type="date" {...form.register('nextRevisionDate')} />
              <FieldError message={form.formState.errors.nextRevisionDate?.message} />
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="insurancePolicyNumber">Asigurare - nr. polita</Label>
              <Input id="insurancePolicyNumber" {...form.register('insurancePolicyNumber')} />
              <FieldError message={form.formState.errors.insurancePolicyNumber?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insuranceStartDate">Valabila de la</Label>
              <Input id="insuranceStartDate" type="date" {...form.register('insuranceStartDate')} />
              <FieldError message={form.formState.errors.insuranceStartDate?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insuranceEndDate">Valabila pana la</Label>
              <Input id="insuranceEndDate" type="date" {...form.register('insuranceEndDate')} />
              <FieldError message={form.formState.errors.insuranceEndDate?.message} />
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tireStockId">Dimensiune anvelope (optional)</Label>
              <select
                id="tireStockId"
                className="flex h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                {...form.register('tireStockId')}
              >
                <option value="">-- Selecteaza dimensiune --</option>
                {tireStock.map((tire) => (
                  <option key={tire.id} value={tire.id}>
                    {tire.size} {tire.brand ? `- ${tire.brand}` : ''} (Disponibil: {tire.quantity})
                  </option>
                ))}
              </select>
              <FieldError message={form.formState.errors.tireStockId?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tireQuantity">Numar bucati anvelope</Label>
              <Input
                id="tireQuantity"
                type="number"
                min="0"
                max={selectedTire?.quantity ?? 999}
                disabled={!selectedTireStockId}
                {...form.register('tireQuantity', { valueAsNumber: true })}
              />
              {selectedTire && (
                <p className="text-xs text-muted-foreground">
                  Disponibil in stoc: {selectedTire.quantity} bucati
                </p>
              )}
              <FieldError message={form.formState.errors.tireQuantity?.message} />
            </div>
          </section>

          {typeValue === 'TRUCK' && (
            <section className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center justify-between rounded-2xl border border-border bg-muted px-4 py-3">
                <span className="text-sm font-medium">Autorizatie tonaj mare</span>
                <input
                  type="checkbox"
                  className="size-5 rounded border border-input accent-primary"
                  {...form.register('hasHeavyTonnageAuthorization')}
                />
              </label>
              <div className="space-y-2">
                <Label htmlFor="tachographCheckDate">Data verificare tahograf</Label>
                <Input id="tachographCheckDate" type="date" {...form.register('tachographCheckDate')} />
                <FieldError message={form.formState.errors.tachographCheckDate?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="copieConformaStartDate">Copie Conforma - Data start</Label>
                <Input id="copieConformaStartDate" type="date" {...form.register('copieConformaStartDate')} />
                <FieldError message={form.formState.errors.copieConformaStartDate?.message} />
              </div>
            </section>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Anuleaza
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Se salveaza...' : 'Salveaza'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}
