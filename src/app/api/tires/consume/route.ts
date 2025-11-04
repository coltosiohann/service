import type { NextRequest } from 'next/server';

import { consumeTires } from '@/features/tires/service';
import { auth } from '@/lib/auth';
import { errorResponse, jsonResponse } from '@/lib/api';
import { requireOrgRoleAtLeast } from '@/lib/auth/membership';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ message: 'Autentificare necesar��.' }, { status: 401 });
    }

    const body = await request.json();

    await requireOrgRoleAtLeast(session.user.id, body.orgId, 'MECHANIC');

    await consumeTires(body);

    return jsonResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
