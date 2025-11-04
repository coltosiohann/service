
import {
  createServiceEvent,
  listServiceEvents,
} from '@/features/service-events/service';
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

    const events = await listServiceEvents(params.id, orgId);

    return jsonResponse({ events });
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

    enforceRateLimit(`service-event:${session.user.id}`, { windowMs: 60_000, max: 10 });

    const payload = await request.json();
    const defaultOrgId = await getDefaultOrgId();

    const event = await createServiceEvent(
      { ...payload, orgId: payload.orgId ?? defaultOrgId, vehicleId: params.id },
      session.user.id,
    );

    return jsonResponse({ event }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
