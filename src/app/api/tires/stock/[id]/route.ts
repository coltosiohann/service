
import { deleteTireStock } from '@/features/tires/service';
import { errorResponse, successMessage } from '@/lib/api';
import { getDefaultOrgId } from '@/lib/default-org';

import type { NextRequest } from 'next/server';

type Params = {
  params: { id: string };
};

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    // Authentication disabled

    const url = new URL(request.url);
    const orgId = url.searchParams.get('orgId') ?? (await getDefaultOrgId());

    await deleteTireStock(params.id, orgId);

    return successMessage('Anvelopa a fost stearsa.');
  } catch (error) {
    return errorResponse(error);
  }
}
