
import { consumeTires } from '@/features/tires/service';
import { errorResponse, jsonResponse } from '@/lib/api';
import { getDefaultOrgId } from '@/lib/default-org';

import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Authentication disabled

    const body = await request.json();
    const defaultOrgId = await getDefaultOrgId();

    await consumeTires({
      ...body,
      orgId: body.orgId ?? defaultOrgId,
    });

    return jsonResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
