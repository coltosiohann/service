
import {
  createServiceEvent,
  listServiceEvents,
} from '@/features/service-events/service';
import { errorResponse, jsonResponse } from '@/lib/api';
import { getDefaultOrgId } from '@/lib/default-org';

import type { NextRequest } from 'next/server';

type Params = {
  params: { id: string };
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    // Authentication disabled

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
    // Authentication disabled

    const payload = await request.json();
    const defaultOrgId = await getDefaultOrgId();

    const event = await createServiceEvent(
      { ...payload, orgId: payload.orgId ?? defaultOrgId, vehicleId: params.id },
      'default-user',
    );

    return jsonResponse({ event }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
