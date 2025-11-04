
import { getVehicleDetail } from '@/features/vehicles/detail';
import { softDeleteVehicle, updateVehicle } from '@/features/vehicles/service';
import { errorResponse, jsonResponse, successMessage } from '@/lib/api';
import { auth } from '@/lib/auth';
import { getDefaultOrgId } from '@/lib/default-org';
import { enforceRateLimit } from '@/lib/rate-limit';

import type { NextRequest } from 'next/server';

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
    const orgId = url.searchParams.get('orgId') ?? (await getDefaultOrgId());

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
    const defaultOrgId = await getDefaultOrgId();

    const vehicle = await updateVehicle(params.id, {
      ...body,
      orgId: body.orgId ?? defaultOrgId,
    });

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

    await softDeleteVehicle(params.id);

    return successMessage('Vehicul arhivat.');
  } catch (error) {
    return errorResponse(error);
  }
}
