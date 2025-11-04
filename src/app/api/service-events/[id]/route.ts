
import { deleteServiceEvent, updateServiceEvent } from '@/features/service-events/service';
import { errorResponse, jsonResponse } from '@/lib/api';
import { auth } from '@/lib/auth';
import { getDefaultOrgId } from '@/lib/default-org';
import { enforceRateLimit } from '@/lib/rate-limit';

import type { NextRequest } from 'next/server';

type Params = {
  params: { id: string };
};

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ message: 'Autentificare necesară.' }, { status: 401 });
    }

    enforceRateLimit(`service-event-edit:${session.user.id}`, { windowMs: 60_000, max: 15 });

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
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ message: 'Autentificare necesară.' }, { status: 401 });
    }

    const event = await deleteServiceEvent(params.id);

    return jsonResponse({ event });
  } catch (error) {
    return errorResponse(error);
  }
}
