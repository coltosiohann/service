
import { adjustTireStock } from '@/features/tires/service';
import { errorResponse, jsonResponse } from '@/lib/api';
import { auth } from '@/lib/auth';
import { getDefaultOrgId } from '@/lib/default-org';

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
    const defaultOrgId = await getDefaultOrgId();
    const payload = {
      ...body,
      orgId: body.orgId ?? defaultOrgId,
      stockId: params.id,
    };

    const stock = await adjustTireStock(payload);

    return jsonResponse({ stock });
  } catch (error) {
    return errorResponse(error);
  }
}
