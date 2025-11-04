
import { deleteTireStock } from '@/features/tires/service';
import { errorResponse, successMessage } from '@/lib/api';
import { auth } from '@/lib/auth';
import { requireOrgRoleAtLeast } from '@/lib/auth/membership';

import type { NextRequest } from 'next/server';

type Params = {
  params: { id: string };
};

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ message: 'Autentificare necesar��.' }, { status: 401 });
    }

    const url = new URL(request.url);
    const orgId = url.searchParams.get('orgId') ?? '';

    await requireOrgRoleAtLeast(session.user.id, orgId, 'ADMIN');

    await deleteTireStock(params.id, orgId);

    return successMessage('Anvelopa a fost stearsa.');
  } catch (error) {
    return errorResponse(error);
  }
}
