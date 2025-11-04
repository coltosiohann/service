/**
 * Mock authentication and authorization when auth is disabled.
 * Provides fake session and bypasses all permission checks.
 */

import { getDefaultOrg } from '@/lib/default-org';

/**
 * Mock session for when authentication is disabled
 */
export async function mockAuth() {
  const org = await getDefaultOrg();

  return {
    user: {
      id: 'mock-user-id',
      name: 'Utilizator',
      email: 'user@example.com',
      image: null,
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  };
}

/**
 * Mock organization membership check - always succeeds
 */
export async function mockRequireOrgMembership(userId: string, orgId: string) {
  // Authentication disabled - always allow access
  return;
}

/**
 * Mock role check - always succeeds
 */
export async function mockRequireOrgRoleAtLeast(userId: string, orgId: string, role: string) {
  // Authentication disabled - always allow access with OWNER permissions
  return;
}
