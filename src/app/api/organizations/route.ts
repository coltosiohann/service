import { eq } from 'drizzle-orm';

import { db, memberships, organizations } from '@/db';
import { errorResponse, jsonResponse } from '@/lib/api';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return Response.json({ message: 'Autentificare necesară.' }, { status: 401 });
    }

    const rows = await db
      .select({
        orgId: organizations.id,
        name: organizations.name,
        role: memberships.role,
      })
      .from(memberships)
      .innerJoin(organizations, eq(memberships.orgId, organizations.id))
      .where(eq(memberships.userId, session.user.id));

    return jsonResponse({ organizations: rows });
  } catch (error) {
    return errorResponse(error);
  }
}
