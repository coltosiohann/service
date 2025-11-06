import { listDocuments } from '@/features/documents/service';
import { listOdometerLogs } from '@/features/odometer/service';
import { listReminders } from '@/features/reminders/service';
import { listServiceEvents } from '@/features/service-events/service';
import { listVehicleTireMovements, getMountedTires } from '@/features/tires/service';
import { ensureVehicleAccess, toNumber } from '@/features/vehicles/service';
import { computeCopieConformaStatus, computeInsuranceStatus, computeTachographStatus } from '@/features/vehicles/status';

export async function getVehicleDetail(orgId: string, vehicleId: string) {
  const vehicle = await ensureVehicleAccess(orgId, vehicleId);

  const [events, logs, docs, reminders, tireMovements, mountedTires] = await Promise.all([
    listServiceEvents(vehicleId, orgId),
    listOdometerLogs(vehicleId, orgId),
    listDocuments(vehicleId, orgId),
    listReminders({ orgId, vehicleId }),
    listVehicleTireMovements(vehicleId, orgId),
    getMountedTires(vehicleId, orgId),
  ]);

  const insuranceStatus = computeInsuranceStatus(vehicle.insuranceEndDate ?? null);
  const tachographStatus =
    vehicle.type === 'TRUCK' ? computeTachographStatus(vehicle.tachographCheckDate ?? null) : null;
  const copieConformaStatus =
    vehicle.type === 'TRUCK' ? computeCopieConformaStatus(vehicle.copieConformaExpiryDate ?? null) : null;

  return {
    vehicle: {
      ...vehicle,
      currentOdometerKm: toNumber(vehicle.currentOdometerKm ?? 0),
      nextRevisionAtKm:
        vehicle.nextRevisionAtKm != null ? toNumber(vehicle.nextRevisionAtKm) : null,
      insuranceStatus,
      tachographStatus,
      copieConformaStatus,
    },
    serviceEvents: events,
    odometerLogs: logs,
    documents: docs,
    reminders,
    tireMovements,
    mountedTires,
  };
}
