"use client";

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { History, PlusIcon, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type OilStock = {
  id: string;
  oilType: string;
  brand: string;
  quantityLiters: number;
  location: string | null;
};

type OilMovement = {
  id: string;
  type: 'INTRARE' | 'IESIRE' | 'UTILIZARE';
  date: string;
  quantityLiters: number;
  vehicleId: string | null;
  odometerKm: number | null;
  notes: string | null;
  vehicleLicensePlate: string | null;
  vehicleName: string | null;
  createdAt: string;
};

type OilMovementWithStock = OilMovement & {
  stockId: string;
  oilType: string;
  brand: string;
};

const MOVEMENT_LABELS: Record<OilMovement['type'], { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  INTRARE: { label: 'Intrare stoc', variant: 'default' },
  IESIRE: { label: 'Iesire stoc', variant: 'secondary' },
  UTILIZARE: { label: 'Utilizare vehicul', variant: 'outline' },
};

async function fetchOilStock(): Promise<OilStock[]> {
  try {
    const response = await fetch('/api/oil/stock');
    if (!response.ok) {
      console.error('Failed to fetch oil stock');
      return [];
    }
    const result = await response.json();
    // API returns { data: { stock: [...] } }
    return (result.data?.stock || []) as OilStock[];
  } catch (error) {
    console.error('Error fetching oil stock:', error);
    return [];
  }
}

async function createOilStock(data: {
  oilType: string;
  brand: string;
  quantityLiters: number;
  location?: string;
}) {
  const response = await fetch('/api/oil/stock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create oil stock');
  }

  return response.json();
}

async function adjustOilStock(data: {
  stockId: string;
  type: 'INTRARE' | 'IESIRE';
  quantityLiters: number;
  date: string;
  notes?: string;
}) {
  const response = await fetch(`/api/oil/stock/${data.stockId}/adjust`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to adjust oil stock');
  }

  return response.json();
}

async function fetchOilMovements(stockId: string): Promise<OilMovement[]> {
  try {
    const response = await fetch(`/api/oil/stock/${stockId}/movements`);
    if (!response.ok) {
      console.error('Failed to fetch oil movements');
      return [];
    }
    const result = await response.json();
    return result.movements || [];
  } catch (error) {
    console.error('Error fetching oil movements:', error);
    return [];
  }
}

async function deleteOilStock(stockId: string) {
  const response = await fetch(`/api/oil/stock/${stockId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete oil stock');
  }

  return response.json();
}

async function fetchAllOilMovements(): Promise<OilMovementWithStock[]> {
  try {
    const response = await fetch('/api/oil/movements');
    if (!response.ok) {
      console.error('Failed to fetch all oil movements');
      return [];
    }
    const result = await response.json();
    return result.movements || [];
  } catch (error) {
    console.error('Error fetching all oil movements:', error);
    return [];
  }
}

function AddOilStockDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createOilStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oilStock'] });
      setOpen(false);
      toast.success('Ulei adaugat cu succes');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    mutation.mutate({
      oilType: formData.get('oilType') as string,
      brand: formData.get('brand') as string,
      quantityLiters: Number(formData.get('quantityLiters')),
      location: formData.get('location') as string,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Adauga ulei
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adauga ulei in stoc</DialogTitle>
          <DialogDescription>
            Completeaza detaliile uleiului pe care doresti sa-l adaugi.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="oilType">Tip ulei *</Label>
            <Input
              id="oilType"
              name="oilType"
              placeholder="Ex: 5W-30, 10W-40"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand">Marca *</Label>
            <Input
              id="brand"
              name="brand"
              placeholder="Ex: Castrol, Mobil, Shell"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantityLiters">Cantitate (litri) *</Label>
            <Input
              id="quantityLiters"
              name="quantityLiters"
              type="number"
              step="0.01"
              min="0"
              placeholder="0"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Locatie</Label>
            <Input
              id="location"
              name="location"
              placeholder="Ex: Depozit A, Raft 3"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Anuleaza
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Se adauga...' : 'Adauga'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AdjustStockDialog({ stock }: { stock: OilStock }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: adjustOilStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oilStock'] });
      setOpen(false);
      toast.success('Stoc actualizat cu succes');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    mutation.mutate({
      stockId: stock.id,
      type: formData.get('type') as 'INTRARE' | 'IESIRE',
      quantityLiters: Number(formData.get('quantityLiters')),
      date: new Date().toISOString(),
      notes: formData.get('notes') as string,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Ajusteaza
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajusteaza stoc</DialogTitle>
          <DialogDescription>
            {stock.oilType} - {stock.brand}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tip operatie *</Label>
            <select
              id="type"
              name="type"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
              required
            >
              <option value="INTRARE">Intrare (Adaugare)</option>
              <option value="IESIRE">Iesire (Scadere)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantityLiters">Cantitate (litri) *</Label>
            <Input
              id="quantityLiters"
              name="quantityLiters"
              type="number"
              step="0.01"
              min="0.01"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observatii</Label>
            <Input id="notes" name="notes" placeholder="Motiv ajustare..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Anuleaza
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Se actualizeaza...' : 'Actualizeaza'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function OilHistoryDialog({ stock }: { stock: OilStock }) {
  const [open, setOpen] = useState(false);

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['oilMovements', stock.id],
    queryFn: () => fetchOilMovements(stock.id),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <History className="mr-2 h-4 w-4" />
          Istoric
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Istoric miscari</DialogTitle>
          <DialogDescription>
            {stock.oilType} - {stock.brand}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">Se incarca...</div>
        ) : movements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nu exista miscari inregistrate.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Cantitate</TableHead>
                <TableHead>Vehicul</TableHead>
                <TableHead>Km</TableHead>
                <TableHead>Observatii</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>{format(new Date(movement.date), 'dd.MM.yyyy')}</TableCell>
                  <TableCell>
                    <Badge variant={MOVEMENT_LABELS[movement.type].variant}>
                      {MOVEMENT_LABELS[movement.type].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={movement.type === 'INTRARE' ? 'text-green-600' : 'text-red-600'}>
                      {movement.type === 'INTRARE' ? '+' : '-'}{movement.quantityLiters.toFixed(2)} L
                    </span>
                  </TableCell>
                  <TableCell>
                    {movement.vehicleLicensePlate ? (
                      <div>
                        <div className="font-medium">{movement.vehicleLicensePlate}</div>
                        {movement.vehicleName && (
                          <div className="text-xs text-muted-foreground">{movement.vehicleName}</div>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {movement.odometerKm ? `${movement.odometerKm.toLocaleString()} km` : '-'}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {movement.notes || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeleteOilButton({ stock }: { stock: OilStock }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    if (!confirm(`Sigur doriti sa stergeti ${stock.oilType} - ${stock.brand}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteOilStock(stock.id);
      queryClient.invalidateQueries({ queryKey: ['oilStock'] });
      toast.success('Ulei sters cu succes');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nu s-a putut sterge uleiul');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      <Trash2 className="h-4 w-4 text-red-600" />
    </Button>
  );
}

export default function OilStockPage() {
  const { data: stock = [], isLoading } = useQuery({
    queryKey: ['oilStock'],
    queryFn: fetchOilStock,
  });

  const { data: allMovements = [], isLoading: isLoadingMovements } = useQuery({
    queryKey: ['allOilMovements'],
    queryFn: fetchAllOilMovements,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stoc Ulei</h1>
          <p className="text-muted-foreground">
            Gestioneaza stocul de ulei pentru vehicule
          </p>
        </div>
        <AddOilStockDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ulei disponibil</CardTitle>
          <CardDescription>
            Lista cu toate tipurile de ulei din stoc
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Se incarca...</div>
          ) : stock.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tip ulei</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Cantitate (litri)</TableHead>
                  <TableHead>Locatie</TableHead>
                  <TableHead className="text-right">Actiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.oilType}</TableCell>
                    <TableCell>{item.brand}</TableCell>
                    <TableCell>
                      <span
                        className={
                          item.quantityLiters < 10
                            ? 'text-red-600 font-semibold'
                            : item.quantityLiters < 30
                              ? 'text-orange-600'
                              : ''
                        }
                      >
                        {item.quantityLiters.toFixed(2)} L
                      </span>
                    </TableCell>
                    <TableCell>{item.location || '-'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <AdjustStockDialog stock={item} />
                      <OilHistoryDialog stock={item} />
                      <DeleteOilButton stock={item} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nu exista ulei in stoc. Adauga primul tip de ulei.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Istoric miscari ulei</CardTitle>
          <CardDescription>
            Toate miscarile de ulei din ultima perioada
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingMovements ? (
            <div className="text-center py-8">Se incarca...</div>
          ) : allMovements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nu exista miscari inregistrate.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tip ulei</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Cantitate</TableHead>
                  <TableHead>Vehicul</TableHead>
                  <TableHead>Km</TableHead>
                  <TableHead>Observatii</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>{format(new Date(movement.date), 'dd.MM.yyyy')}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{movement.oilType}</div>
                        <div className="text-xs text-muted-foreground">{movement.brand}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={MOVEMENT_LABELS[movement.type].variant}>
                        {MOVEMENT_LABELS[movement.type].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={movement.type === 'INTRARE' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {movement.type === 'INTRARE' ? '+' : '-'}{movement.quantityLiters.toFixed(2)} L
                      </span>
                    </TableCell>
                    <TableCell>
                      {movement.vehicleLicensePlate ? (
                        <div>
                          <div className="font-medium">{movement.vehicleLicensePlate}</div>
                          {movement.vehicleName && (
                            <div className="text-xs text-muted-foreground">{movement.vehicleName}</div>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {movement.odometerKm ? `${movement.odometerKm.toLocaleString()} km` : '-'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {movement.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
