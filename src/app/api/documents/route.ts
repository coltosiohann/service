import type { NextRequest } from 'next/server';

import { deleteDocument, listDocuments, uploadDocument } from '@/features/documents/service';
import { auth } from '@/lib/auth';
import { errorResponse, jsonResponse, successMessage } from '@/lib/api';
import { requireOrgMembership, requireOrgRoleAtLeast } from '@/lib/auth/membership';
import { enforceRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ message: 'Autentificare necesară.' }, { status: 401 });
    }

    const url = new URL(request.url);
    const orgId = url.searchParams.get('orgId') ?? '';
    const vehicleId = url.searchParams.get('vehicleId') ?? '';

    await requireOrgMembership(session.user.id, orgId);

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
      return Response.json({ message: 'Autentificare necesară.' }, { status: 401 });
    }

    enforceRateLimit(`documents:${session.user.id}`, { windowMs: 60_000, max: 8 });

    const formData = await request.formData();
    const orgId = formData.get('orgId');

    if (typeof orgId !== 'string') {
      throw new Error('Organizație lipsă.');
    }

    await requireOrgRoleAtLeast(session.user.id, orgId, 'MECHANIC');

    const document = await uploadDocument(formData, session.user.id);

    return jsonResponse({ document }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
