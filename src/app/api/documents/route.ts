import { listDocuments, uploadDocument } from '@/features/documents/service';
import { errorResponse, jsonResponse } from '@/lib/api';
import { getDefaultOrgId } from '@/lib/default-org';

import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Authentication disabled

    const url = new URL(request.url);
    const orgId = url.searchParams.get('orgId') ?? (await getDefaultOrgId());
    const vehicleId = url.searchParams.get('vehicleId') ?? '';

    const docs = await listDocuments(vehicleId, orgId);

    return jsonResponse({ documents: docs });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication disabled

    const formData = await request.formData();
    const defaultOrgId = await getDefaultOrgId();
    const orgId = formData.get('orgId');

    if (typeof orgId !== 'string' || !orgId) {
      formData.set('orgId', defaultOrgId);
    }

    const document = await uploadDocument(formData, 'default-user');

    return jsonResponse({ document }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
