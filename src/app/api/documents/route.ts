import { listDocuments, uploadDocument } from '@/features/documents/service';
import { errorResponse, jsonResponse } from '@/lib/api';
import { auth } from '@/lib/auth';
import { getDefaultOrgId } from '@/lib/default-org';
import { enforceRateLimit } from '@/lib/rate-limit';

import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ message: 'Autentificare necesar��.' }, { status: 401 });
    }

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
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ message: 'Autentificare necesar��.' }, { status: 401 });
    }

    enforceRateLimit(`documents:${session.user.id}`, { windowMs: 60_000, max: 8 });

    const formData = await request.formData();
    const defaultOrgId = await getDefaultOrgId();
    const orgId = formData.get('orgId');

    if (typeof orgId !== 'string' || !orgId) {
      formData.set('orgId', defaultOrgId);
    }

    const document = await uploadDocument(formData, session.user.id);

    return jsonResponse({ document }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
