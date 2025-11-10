import { createOilStock, listOilStock } from '@/features/oil/service';
import { errorResponse, jsonResponse } from '@/lib/api';
import { getDefaultOrgId } from '@/lib/default-org';

import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Authentication disabled

    const url = new URL(request.url);
    const orgId = url.searchParams.get('orgId') ?? (await getDefaultOrgId());

    const stock = await listOilStock(orgId);

    return jsonResponse({ stock });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication disabled

    const body = await request.json();
    const defaultOrgId = await getDefaultOrgId();

    const stock = await createOilStock({
      ...body,
      orgId: body.orgId ?? defaultOrgId,
    });

    return jsonResponse({ stock }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
