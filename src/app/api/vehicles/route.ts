
import { listVehicles } from '@/features/vehicles/queries';
import { createVehicle } from '@/features/vehicles/service';
import { vehicleQuerySchema } from '@/features/vehicles/validators';
import { errorResponse, jsonResponse } from '@/lib/api';
import { getDefaultOrgId } from '@/lib/default-org';

import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Authentication disabled

    const url = new URL(request.url);
    const truckTonaj = url.searchParams.get('truck.tonajMare');
    const truckTahograf = url.searchParams.get('truck.tahograf');

    const defaultOrgId = await getDefaultOrgId();

    const rawQuery = {
      orgId: url.searchParams.get('orgId') ?? defaultOrgId,
      type: url.searchParams.get('type') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
      insurance: url.searchParams.get('insurance') ?? undefined,
      search: url.searchParams.get('search') ?? undefined,
      truck:
        truckTonaj || truckTahograf
          ? {
              tonajMare: truckTonaj ?? undefined,
              tahograf: truckTahograf ?? undefined,
            }
          : undefined,
    };

    const query = vehicleQuerySchema.parse(rawQuery);

    const vehicles = await listVehicles(query);

    return jsonResponse({ vehicles });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication disabled

    const body = await request.json();
    console.log('Received vehicle creation request:', JSON.stringify(body, null, 2));

    const defaultOrgId = await getDefaultOrgId();
    console.log('Default org ID:', defaultOrgId);

    const vehicle = await createVehicle({
      ...body,
      orgId: body.orgId ?? defaultOrgId,
    });

    console.log('Vehicle created successfully:', vehicle.id);
    return jsonResponse({ vehicle }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/vehicles:', error);

    // Log validation details if available
    if (error && typeof error === 'object' && 'details' in error) {
      console.error('Validation errors:', JSON.stringify(error.details, null, 2));
    }

    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...(error && typeof error === 'object' ? error : {}),
    });
    return errorResponse(error);
  }
}
