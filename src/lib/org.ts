import { cookies } from 'next/headers';

import { getMembershipsForUser } from '@/lib/auth/membership';

export async function resolveActiveOrg(userId: string) {
  const memberships = await getMembershipsForUser(userId);
  if (!memberships.length) {
    return { orgId: null, memberships: [] };
  }

  const cookieStore = cookies();
  const storedOrg = cookieStore.get('fleetcare_org')?.value ?? null;
  const orgIds = memberships.map((item) => item.orgId);
  const orgId = storedOrg && orgIds.includes(storedOrg) ? storedOrg : orgIds[0];

  return { orgId, memberships };
}
