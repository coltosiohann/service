
import { deleteServiceEvent, updateServiceEvent } from '@/features/service-events/service';
import { errorResponse, jsonResponse } from '@/lib/api';
import { getDefaultOrgId } from '@/lib/default-org';

import type { NextRequest } from 'next/server';

type Params = {
  params: { id: string };
};

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    // Authentication disabled
    const payload = await request.json();
    const defaultOrgId = await getDefaultOrgId();

    const event = await updateServiceEvent(params.id, {
      ...payload,
      orgId: payload.orgId ?? defaultOrgId,
    });

    return jsonResponse({ event });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    // Authentication disabled

    const event = await deleteServiceEvent(params.id);

    return jsonResponse({ event });
  } catch (error) {
    return errorResponse(error);
  }
}
