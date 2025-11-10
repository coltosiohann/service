import { adjustOilStock } from '@/features/oil/service';
import { errorResponse, jsonResponse } from '@/lib/api';
import { getDefaultOrgId } from '@/lib/default-org';

import type { NextRequest } from 'next/server';

type Params = {
  params: { id: string };
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    // Authentication disabled

    const body = await request.json();
    const defaultOrgId = await getDefaultOrgId();
    const payload = {
      ...body,
      orgId: body.orgId ?? defaultOrgId,
      stockId: params.id,
    };

    const stock = await adjustOilStock(payload);

    return jsonResponse({ stock });
  } catch (error) {
    return errorResponse(error);
  }
}
