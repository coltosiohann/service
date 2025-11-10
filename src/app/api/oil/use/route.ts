import { recordOilUsage } from '@/features/oil/service';
import { errorResponse, successMessage } from '@/lib/api';
import { getDefaultOrgId } from '@/lib/default-org';

import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Authentication disabled

    const body = await request.json();
    const defaultOrgId = await getDefaultOrgId();

    await recordOilUsage({
      ...body,
      orgId: body.orgId ?? defaultOrgId,
    });

    return successMessage('Utilizarea uleiului a fost inregistrata.');
  } catch (error) {
    return errorResponse(error);
  }
}
