import { NextRequest } from 'next/server';

import { deleteTireMovement } from '@/features/tires/service';
import { errorResponse, jsonResponse } from '@/lib/api';
import { getDefaultOrgId } from '@/lib/default-org';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const defaultOrgId = await getDefaultOrgId();
    const orgId = url.searchParams.get('orgId') ?? defaultOrgId;

    const deleted = await deleteTireMovement(id, orgId);

    return jsonResponse({ deleted });
  } catch (error) {
    return errorResponse(error);
  }
}
