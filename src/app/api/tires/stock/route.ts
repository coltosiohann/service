import type { NextRequest } from 'next/server';

import { createTireStock, listTireStock } from '@/features/tires/service';
import { auth } from '@/lib/auth';
import { errorResponse, jsonResponse } from '@/lib/api';
import { requireOrgMembership, requireOrgRoleAtLeast } from '@/lib/auth/membership';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ message: 'Autentificare necesar��.' }, { status: 401 });
    }

    const url = new URL(request.url);
    const orgId = url.searchParams.get('orgId') ?? '';

    await requireOrgMembership(session.user.id, orgId);

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

    await requireOrgRoleAtLeast(session.user.id, body.orgId, 'ADMIN');

    const stock = await createTireStock(body);

    return jsonResponse({ stock }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
