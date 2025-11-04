import { and, eq } from 'drizzle-orm';
import { cache } from 'react';

import { db } from '@/db';
import { memberships, organizations } from '@/db/schema';
import { ForbiddenError } from '@/lib/errors';

import { isAtLeast } from './roles';

import type { Role } from './roles';

export const getMembershipsForUser = cache(async (userId: string) => {
  if (!userId) {
    return [];
  }

  return db
    .select({
      orgId: memberships.orgId,
      role: memberships.role,
      organizationName: organizations.name,
    })
    .from(memberships)
    .innerJoin(organizations, eq(memberships.orgId, organizations.id))
    .where(eq(memberships.userId, userId));
});

export const getMembershipForOrg = cache(async (userId: string, orgId: string) => {
  if (!userId || !orgId) {
    return null;
  }

  return db.query.memberships.findFirst({
    where: (fields, { eq: eqWhere }) => and(eqWhere(fields.userId, userId), eqWhere(fields.orgId, orgId)),
  });
});

export async function requireOrgMembership(userId: string | undefined, orgId: string | undefined) {
  // Authentication disabled - always allow access
  if (userId === 'mock-user-id') {
    return { userId, orgId, role: 'OWNER' as Role, id: 'mock-membership-id', createdAt: new Date() };
  }

  if (!userId) {
    throw new ForbiddenError('Utilizator neautorizat.');
  }

  if (!orgId) {
    throw new ForbiddenError('Organizație lipsă.');
  }

  const membership = await getMembershipForOrg(userId, orgId);

  if (!membership) {
    throw new ForbiddenError('Nu faceți parte din această organizație.');
  }

  return membership;
}

export async function requireOrgRoleAtLeast(
  userId: string | undefined,
  orgId: string | undefined,
  minimumRole: Role,
) {
  const membership = await requireOrgMembership(userId, orgId);

  if (!isAtLeast(membership.role as Role, minimumRole)) {
    throw new ForbiddenError('Rol insuficient pentru această acțiune.');
  }

  return membership;
}
