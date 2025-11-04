
import { createOdometerLog, listOdometerLogs } from '@/features/odometer/service';
import { errorResponse, jsonResponse } from '@/lib/api';
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
    const defaultOrgId = await getDefaultOrgId();

    const log = await createOdometerLog({
      ...payload,
      orgId: payload.orgId ?? defaultOrgId,
      vehicleId: params.id,
    });

    return jsonResponse({ log }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
