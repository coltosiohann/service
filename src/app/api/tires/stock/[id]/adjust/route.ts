
import { adjustTireStock } from '@/features/tires/service';
import { errorResponse, jsonResponse } from '@/lib/api';
import { auth } from '@/lib/auth';
import { requireOrgRoleAtLeast } from '@/lib/auth/membership';

import type { NextRequest } from 'next/server';

type Params = {
  params: { id: string };
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ message: 'Autentificare necesar��.' }, { status: 401 });
    }

    const body = await request.json();
    const payload = {
      ...body,
      stockId: params.id,
    };

    await requireOrgRoleAtLeast(session.user.id, payload.orgId, 'ADMIN');

    const stock = await adjustTireStock(payload);

    return jsonResponse({ stock });
  } catch (error) {
    return errorResponse(error);
  }
}
