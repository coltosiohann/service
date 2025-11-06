import { NextRequest } from 'next/server';

import { listRecentTireMovements } from '@/features/tires/service';
import { errorResponse, jsonResponse } from '@/lib/api';
import { getDefaultOrgId } from '@/lib/default-org';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const defaultOrgId = await getDefaultOrgId();
    const orgId = url.searchParams.get('orgId') ?? defaultOrgId;
    const limitParam = Number(url.searchParams.get('limit') ?? '50');
    const limit = Number.isNaN(limitParam) ? 50 : Math.min(Math.max(limitParam, 1), 100);

    const movements = await listRecentTireMovements(orgId, limit);

    return jsonResponse({ movements });
  } catch (error) {
    return errorResponse(error);
  }
}
