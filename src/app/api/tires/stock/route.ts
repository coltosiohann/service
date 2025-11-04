
import { createTireStock, listTireStock } from '@/features/tires/service';
import { errorResponse, jsonResponse } from '@/lib/api';
import { auth } from '@/lib/auth';
import { getDefaultOrgId } from '@/lib/default-org';

import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ message: 'Autentificare necesar��.' }, { status: 401 });
    }

    const url = new URL(request.url);
    const orgId = url.searchParams.get('orgId') ?? (await getDefaultOrgId());

    const stock = await listTireStock(orgId);

    return jsonResponse({ stock });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ message: 'Autentificare necesar��.' }, { status: 401 });
    }

    const body = await request.json();
    const defaultOrgId = await getDefaultOrgId();

    const stock = await createTireStock({
      ...body,
      orgId: body.orgId ?? defaultOrgId,
    });

    return jsonResponse({ stock }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
