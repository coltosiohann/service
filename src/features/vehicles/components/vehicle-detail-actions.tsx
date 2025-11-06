"use client";

import { Wrench, CircleDot } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { InterventionForm } from '@/features/service-events/components/intervention-form';
import { TireChangeForm } from '@/features/tires/components/tire-change-form';

interface VehicleDetailActionsProps {
  vehicleId: string;
}

export function VehicleDetailActions({ vehicleId }: VehicleDetailActionsProps) {
  const [interventionOpen, setInterventionOpen] = useState(false);
  const [tireChangeOpen, setTireChangeOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <div className="flex gap-2">
        <Button onClick={() => setInterventionOpen(true)}>
          <Wrench className="mr-2 size-4" />
          Adaugă intervenție
        </Button>
        <Button variant="outline" onClick={() => setTireChangeOpen(true)}>
          <CircleDot className="mr-2 size-4" />
          Schimb cauciucuri
        </Button>
      </div>

      <InterventionForm
        vehicleId={vehicleId}
        open={interventionOpen}
        onOpenChange={setInterventionOpen}
        onSuccess={handleSuccess}
      />

      <TireChangeForm
        vehicleId={vehicleId}
        open={tireChangeOpen}
        onOpenChange={setTireChangeOpen}
        onSuccess={handleSuccess}
      />
    </>
  );
}
