import type { NextRequest } from 'next/server';

import { getVehicleDetail } from '@/features/vehicles/detail';
import { softDeleteVehicle, updateVehicle } from '@/features/vehicles/service';
import { auth } from '@/lib/auth';
import { errorResponse, jsonResponse, successMessage } from '@/lib/api';
import { requireOrgMembership, requireOrgRoleAtLeast } from '@/lib/auth/membership';
import { enforceRateLimit } from '@/lib/rate-limit';

type Params = {
  params: { id: string };
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ message: 'Autentificare necesară.' }, { status: 401 });
    }

    const url = new URL(request.url);
    const orgId = url.searchParams.get('orgId') ?? '';

    await requireOrgMembership(session.user.id, orgId);

    const detail = await getVehicleDetail(orgId, params.id);

    return jsonResponse(detail);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ message: 'Autentificare necesară.' }, { status: 401 });
    }

    enforceRateLimit(`vehicle-update:${session.user.id}`, { windowMs: 60_000, max: 10 });

    const body = await request.json();

    await requireOrgRoleAtLeast(session.user.id, body.orgId, 'MECHANIC');

    const vehicle = await updateVehicle(params.id, body);

    return jsonResponse({ vehicle });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ message: 'Autentificare necesară.' }, { status: 401 });
    }

    const url = new URL(request.url);
    const orgId = url.searchParams.get('orgId') ?? '';

    await requireOrgRoleAtLeast(session.user.id, orgId, 'ADMIN');

    await softDeleteVehicle(params.id);

    return successMessage('Vehicul arhivat.');
  } catch (error) {
    return errorResponse(error);
  }
}
