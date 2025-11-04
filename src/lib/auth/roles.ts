export const ROLES = ['OWNER', 'ADMIN', 'MECHANIC', 'VIEWER'] as const;

export type Role = (typeof ROLES)[number];

const ROLE_PRIORITY: Record<Role, number> = {
  OWNER: 4,
  ADMIN: 3,
  MECHANIC: 2,
  VIEWER: 1,
};

export function isAtLeast(role: Role, target: Role): boolean {
  return ROLE_PRIORITY[role] >= ROLE_PRIORITY[target];
}

export function canManageOrganization(role: Role): boolean {
  return isAtLeast(role, 'ADMIN');
}

export function canManageVehicles(role: Role): boolean {
  return isAtLeast(role, 'ADMIN');
}

export function canEditVehicle(role: Role): boolean {
  return isAtLeast(role, 'MECHANIC');
}

export function canViewVehicle(role: Role): boolean {
  return ROLE_PRIORITY[role] >= ROLE_PRIORITY['VIEWER'];
}

export function canUploadDocuments(role: Role): boolean {
  return isAtLeast(role, 'MECHANIC');
}

export function canManageReminders(role: Role): boolean {
  return isAtLeast(role, 'ADMIN');
}
