import type { NextRequest } from 'next/server';

import { listReminders, updateReminder } from '@/features/reminders/service';
import { auth } from '@/lib/auth';
import { errorResponse, jsonResponse } from '@/lib/api';
import { requireOrgMembership, requireOrgRoleAtLeast } from '@/lib/auth/membership';
import { enforceRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ message: 'Autentificare necesară.' }, { status: 401 });
    }

    const url = new URL(request.url);
    const query = {
      orgId: url.searchParams.get('orgId') ?? '',
      status: url.searchParams.get('status') || undefined,
      kind: url.searchParams.get('kind') || undefined,
      view: url.searchParams.get('view') || undefined,
    };

    await requireOrgMembership(session.user.id, query.orgId);

    const reminders = await listReminders(query);

    return jsonResponse({ reminders });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ message: 'Autentificare necesară.' }, { status: 401 });
    }

    enforceRateLimit(`reminders:${session.user.id}`, { windowMs: 60_000, max: 20 });

    const body = await request.json();

    await requireOrgRoleAtLeast(session.user.id, body.orgId, 'ADMIN');

    const reminder = await updateReminder(body.id, body);

    return jsonResponse({ reminder });
  } catch (error) {
    return errorResponse(error);
  }
}
