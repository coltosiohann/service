
import { listReminders, updateReminder } from '@/features/reminders/service';
import { errorResponse, jsonResponse } from '@/lib/api';
import { auth } from '@/lib/auth';
import { getDefaultOrgId } from '@/lib/default-org';
import { enforceRateLimit } from '@/lib/rate-limit';

import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ message: 'Autentificare necesară.' }, { status: 401 });
    }

    const url = new URL(request.url);
    const defaultOrgId = await getDefaultOrgId();
    const query = {
      orgId: url.searchParams.get('orgId') ?? defaultOrgId,
      status: url.searchParams.get('status') || undefined,
      kind: url.searchParams.get('kind') || undefined,
      view: url.searchParams.get('view') || undefined,
    };

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
    const defaultOrgId = await getDefaultOrgId();

    const reminder = await updateReminder(body.id, {
      ...body,
      orgId: body.orgId ?? defaultOrgId,
    });

    return jsonResponse({ reminder });
  } catch (error) {
    return errorResponse(error);
  }
}
