import { db, organizations } from '@/db';

/**
 * Get the default organization when authentication is disabled.
 * Returns the first organization by creation date.
 * Creates a default organization if none exists.
 */
export async function getDefaultOrg() {
  let defaultOrg = await db.query.organizations.findFirst({
    orderBy: (orgs, { asc }) => [asc(orgs.createdAt)],
  });

  // Create default organization if none exists
  if (!defaultOrg) {
    const [newOrg] = await db
      .insert(organizations)
      .values({
        name: 'FleetCare Local',
      })
      .returning();
    defaultOrg = newOrg;
  }

  return defaultOrg;
}
