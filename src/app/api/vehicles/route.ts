
import { listVehicles } from '@/features/vehicles/queries';
import { createVehicle } from '@/features/vehicles/service';
import { vehicleQuerySchema } from '@/features/vehicles/validators';
import { errorResponse, jsonResponse } from '@/lib/api';
import { auth } from '@/lib/auth';
import { requireOrgMembership, requireOrgRoleAtLeast } from '@/lib/auth/membership';

import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ message: 'Autentificare necesară.' }, { status: 401 });
    }

    const url = new URL(request.url);
    const truckTonaj = url.searchParams.get('truck.tonajMare');
    const truckTahograf = url.searchParams.get('truck.tahograf');

    const rawQuery = {
      orgId: url.searchParams.get('orgId') ?? '',
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

    await requireOrgMembership(session.user.id, query.orgId);

    const vehicles = await listVehicles(query);

    return jsonResponse({ vehicles });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ message: 'Autentificare necesară.' }, { status: 401 });
    }

    const body = await request.json();
    await requireOrgRoleAtLeast(session.user.id, body.orgId, 'ADMIN');

    const vehicle = await createVehicle(body);

    return jsonResponse({ vehicle }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
