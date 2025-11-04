import type { NextRequest } from 'next/server';

import { createOdometerLog, listOdometerLogs } from '@/features/odometer/service';
import { auth } from '@/lib/auth';
import { errorResponse, jsonResponse } from '@/lib/api';
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

    const logs = await listOdometerLogs(params.id, orgId);

    return jsonResponse({ logs });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ message: 'Autentificare necesară.' }, { status: 401 });
    }

    enforceRateLimit(`odometer:${session.user.id}`, { windowMs: 60_000, max: 20 });

    const payload = await request.json();

    await requireOrgRoleAtLeast(session.user.id, payload.orgId, 'MECHANIC');

    const log = await createOdometerLog({
      ...payload,
      vehicleId: params.id,
    });

    return jsonResponse({ log }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
