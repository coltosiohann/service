import { deleteOilStock, getOilStock, updateOilStock } from '@/features/oil/service';
import { errorResponse, jsonResponse, successMessage } from '@/lib/api';
import { getDefaultOrgId } from '@/lib/default-org';

import type { NextRequest } from 'next/server';

type Params = {
  params: { id: string };
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    // Authentication disabled

    const url = new URL(request.url);
    const orgId = url.searchParams.get('orgId') ?? (await getDefaultOrgId());

    const stock = await getOilStock(params.id, orgId);

    return jsonResponse({ stock });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    // Authentication disabled

    const body = await request.json();
    const url = new URL(request.url);
    const orgId = url.searchParams.get('orgId') ?? (await getDefaultOrgId());

    const stock = await updateOilStock(params.id, orgId, body);

    return jsonResponse({ stock });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    // Authentication disabled

    const url = new URL(request.url);
    const orgId = url.searchParams.get('orgId') ?? (await getDefaultOrgId());

    await deleteOilStock(params.id, orgId);

    return successMessage('Uleiul a fost sters.');
  } catch (error) {
    return errorResponse(error);
  }
}
