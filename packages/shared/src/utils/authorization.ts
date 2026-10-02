import type { AuthPrincipal, Permission, Role } from '../types';

/**
 * Pure RBAC/permission helpers for showing or hiding UI.
 * They improve UX only — the backend remains the authority on access control.
 */

export const hasRole = (principal: AuthPrincipal | null, role: Role): boolean =>
  principal?.roles.includes(role) ?? false;

export const hasAnyRole = (principal: AuthPrincipal | null, roles: readonly Role[]): boolean =>
  roles.some((role) => hasRole(principal, role));

export const hasPermission = (principal: AuthPrincipal | null, permission: Permission): boolean =>
  principal?.permissions.includes(permission) ?? false;

export const hasAllPermissions = (
  principal: AuthPrincipal | null,
  permissions: readonly Permission[],
): boolean => permissions.every((permission) => hasPermission(principal, permission));
