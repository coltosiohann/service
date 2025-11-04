"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  insuranceProvider: z.string().min(1, 'Asiguratorul este obligatoriu.'),
  insurancePolicyNumber: z.string().min(1, 'Numarul politei este obligatoriu.'),
  insuranceEndDate: z.string().optional(),
  hasHeavyTonnageAuthorization: z.union([z.literal('on'), z.boolean()]).optional(),
  tachographCheckDate: z.string().optional(),
  copieConformaStartDate: z.string().optional(),
  tireUsageReason: z
    .string()
    .max(200, 'Motivul poate avea cel mult 200 de caractere.')
    .optional(),
  tiresUsage: z
    .array(
      z.object({
        stockId: z.string().uuid('Selectati anvelopa.'),
        quantity: z.coerce.number().int().min(1, 'Cantitate minima 1.'),
        reason: z
          .string()
          .max(200, 'Motivul poate avea cel mult 200 de caractere.')
          .optional(),
      }),
    )
    .optional(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;
type VehicleFormInput = z.input<typeof vehicleSchema>;

type VehicleUpdatePayload = {
  type: 'CAR' | 'TRUCK' | 'EQUIPMENT';
  make: string;
  model: string;
  year: number;
  vin?: string;
  licensePlate: string;
  currentOdometerKm: number;
  nextRevisionDate: Date | null;
  nextRevisionAtKm: number | null;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceEndDate: Date | null;
  hasHeavyTonnageAuthorization?: boolean;
  tachographCheckDate: Date | null;
  copieConformaStartDate: Date | null;
  copieConformaExpiryDate: Date | null;
  tiresUsage?: Array<{ stockId: string; quantity: number; reason?: string }>;
  tireUsageReason?: string;
};

type VehicleEditFormProps = {
  vehicle: {
    id: string;
    type: 'CAR' | 'TRUCK' | 'EQUIPMENT';
    make: string;
    model: string;
    year: number;
    vin: string | null;
    licensePlate: string;
    currentOdometerKm: string | number;
    nextRevisionDate: Date | null;
    nextRevisionAtKm: string | number | null;
    insuranceProvider: string | null;
    insurancePolicyNumber: string | null;
    insuranceEndDate: Date | null;
    hasHeavyTonnageAuthorization: boolean | null;
    tachographCheckDate: Date | null;
    copieConformaStartDate: Date | null;
    copieConformaExpiryDate: Date | null;
  };
};

export function VehicleEditForm({ vehicle }: VehicleEditFormProps) {
  const router = useRouter();

  const form = useForm<VehicleFormInput, unknown, VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      type: vehicle.type,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      vin: vehicle.vin || '',
      licensePlate: vehicle.licensePlate,
      currentOdometerKm: typeof vehicle.currentOdometerKm === 'string'
        ? parseFloat(vehicle.currentOdometerKm)
        : vehicle.currentOdometerKm,
      nextRevisionDate: vehicle.nextRevisionDate
        ? new Date(vehicle.nextRevisionDate).toISOString().split('T')[0]
        : '',
      nextRevisionAtKm: vehicle.nextRevisionAtKm ? String(vehicle.nextRevisionAtKm) : '',
      insuranceProvider: vehicle.insuranceProvider || '',
      insurancePolicyNumber: vehicle.insurancePolicyNumber || '',
      insuranceEndDate: vehicle.insuranceEndDate
        ? new Date(vehicle.insuranceEndDate).toISOString().split('T')[0]
        : '',
      hasHeavyTonnageAuthorization: vehicle.hasHeavyTonnageAuthorization || false,
      tachographCheckDate: vehicle.tachographCheckDate
        ? new Date(vehicle.tachographCheckDate).toISOString().split('T')[0]
        : '',
      copieConformaStartDate: vehicle.copieConformaStartDate
        ? new Date(vehicle.copieConformaStartDate).toISOString().split('T')[0]
        : '',
      tireUsageReason: '',
      tiresUsage: [],
    },
  });

  const { fields: tireFields, append: appendTire, remove: removeTire } = useFieldArray({
    control: form.control,
    name: 'tiresUsage',
  });

  const mutation = useApiMutation<{ vehicle: { id: string } }, Record<string, unknown>>(
    `/api/vehicles/${vehicle.id}`,
    'PATCH'
  );

  const typeValue = form.watch('type');

  const { data: stockData } = useApiQuery<{ stock: { id: string; size: string; brand: string | null; quantity: number }[] }>(
    '/api/tires/stock',
    {},
    { enabled: typeValue === 'TRUCK', key: ['tire-stock', typeValue] },
  );

  useEffect(() => {
    if (typeValue !== 'TRUCK') {
      form.setValue('tiresUsage', []);
      form.setValue('tireUsageReason', '');
      form.clearErrors(['tiresUsage', 'tireUsageReason']);
    }
  }, [typeValue, form]);

  const stockOptions = stockData?.stock ?? [];

  const onSubmit = async (values: VehicleFormValues) => {
    const payload: VehicleUpdatePayload = {
      type: values.type,
      make: values.make,
      model: values.model,
      year: values.year,
      vin: values.vin ? values.vin.toUpperCase() : undefined,
      licensePlate: values.licensePlate.toUpperCase(),
      currentOdometerKm: values.currentOdometerKm,
      nextRevisionDate: values.nextRevisionDate ? new Date(values.nextRevisionDate) : null,
      nextRevisionAtKm: values.nextRevisionAtKm ? Number(values.nextRevisionAtKm) : null,
      insuranceProvider: values.insuranceProvider,
      insurancePolicyNumber: values.insurancePolicyNumber,
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
      copieConformaExpiryDate:
        values.type === 'TRUCK' && values.copieConformaStartDate
          ? new Date(new Date(values.copieConformaStartDate).getFullYear() + 1, new Date(values.copieConformaStartDate).getMonth(), new Date(values.copieConformaStartDate).getDate())
          : null,
    };

    const tireConsumptions =
      values.type === 'TRUCK' && Array.isArray(values.tiresUsage)
        ? values.tiresUsage
            .filter((item) => item.stockId && Number(item.quantity) > 0)
            .map((item) => ({
              stockId: item.stockId,
              quantity: Number(item.quantity),
              reason: item.reason ? item.reason.trim() || undefined : undefined,
            }))
        : [];

    if (tireConsumptions.length > 0) {
      payload.tiresUsage = tireConsumptions;
      if (values.tireUsageReason) {
        payload.tireUsageReason = values.tireUsageReason.trim() || undefined;
      }
    }

    try {
      await mutation.mutateAsync(payload);
      toast.success('Vehiculul a fost actualizat.');
      router.push(`/vehicule/${vehicle.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nu s-a putut actualiza vehiculul.');
    }
  };

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
              <Label htmlFor="insuranceProvider">Asigurare - furnizor</Label>
              <Input id="insuranceProvider" {...form.register('insuranceProvider')} />
              <FieldError message={form.formState.errors.insuranceProvider?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insurancePolicyNumber">Asigurare - nr. polita</Label>
              <Input id="insurancePolicyNumber" {...form.register('insurancePolicyNumber')} />
              <FieldError message={form.formState.errors.insurancePolicyNumber?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insuranceEndDate">Valabila pana la</Label>
              <Input id="insuranceEndDate" type="date" {...form.register('insuranceEndDate')} />
              <FieldError message={form.formState.errors.insuranceEndDate?.message} />
            </div>
          </section>

          {typeValue === 'TRUCK' && (
            <>
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

              <section className="space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold">Consum anvelope</p>
                    <p className="text-xs text-muted-foreground">
                      Selectati anvelopele montate la aceasta revizie. Stocul va fi actualizat automat.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      appendTire({
                        stockId: stockOptions[0]?.id ?? '',
                        quantity: 1,
                        reason: '',
                      })
                    }
                    disabled={stockOptions.length === 0}
                  >
                    Adauga anvelopa
                  </Button>
                </div>

                {stockOptions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-muted p-4 text-sm text-muted-foreground">
                    Nu exista stoc disponibil. Accesati pagina &quot;Stoc anvelope&quot; pentru a adauga anvelope.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tireFields.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Nu ati adaugat niciun consum de anvelope pentru aceasta revizie.
                      </p>
                    )}
                    {tireFields.map((field, index) => (
                      <div key={field.id} className="space-y-3 rounded-2xl border border-border p-4">
                        <div className="grid gap-3 md:grid-cols-[2fr,1fr,auto]">
                          <Controller
                            control={form.control}
                            name={`tiresUsage.${index}.stockId`}
                            render={({ field: controllerField }) => (
                              <Select
                                value={controllerField.value}
                                onValueChange={controllerField.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selectati anvelopa" />
                                </SelectTrigger>
                                <SelectContent>
                                  {stockOptions.map((option) => (
                                    <SelectItem key={option.id} value={option.id}>
                                      {option.size}
                                      {option.brand ? ` - ${option.brand}` : ''} - Stoc: {option.quantity}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                          <Input type="number" min={1} {...form.register(`tiresUsage.${index}.quantity`)} />
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => removeTire(index)}
                            className="justify-self-start md:justify-self-end"
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                        <FieldError message={form.formState.errors.tiresUsage?.[index]?.stockId?.message} />
                        <FieldError message={form.formState.errors.tiresUsage?.[index]?.quantity?.message} />
                        <Input
                          placeholder="Motiv (optional)"
                          {...form.register(`tiresUsage.${index}.reason`)}
                        />
                        <FieldError message={form.formState.errors.tiresUsage?.[index]?.reason?.message} />
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="tireUsageReason">Motiv revizie (optional)</Label>
                  <Input
                    id="tireUsageReason"
                    placeholder="Ex: Revizie completa cu inlocuire anvelope fata"
                    disabled={stockOptions.length === 0}
                    {...form.register('tireUsageReason')}
                  />
                  <FieldError message={form.formState.errors.tireUsageReason?.message} />
                </div>
              </section>
            </>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Anuleaza
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Se actualizeaza...' : 'Actualizeaza'}
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


