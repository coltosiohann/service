import type { NextRequest } from 'next/server';

import { deleteDocument } from '@/features/documents/service';
import { auth } from '@/lib/auth';
import { errorResponse, successMessage } from '@/lib/api';
import { requireOrgRoleAtLeast } from '@/lib/auth/membership';

type Params = {
  params: { id: string };
};

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ message: 'Autentificare necesară.' }, { status: 401 });
    }

    const url = new URL(request.url);
    const orgId = url.searchParams.get('orgId') ?? '';

    await requireOrgRoleAtLeast(session.user.id, orgId, 'ADMIN');

    await deleteDocument(params.id, orgId);

    return successMessage('Document șters.');
  } catch (error) {
    return errorResponse(error);
  }
}
