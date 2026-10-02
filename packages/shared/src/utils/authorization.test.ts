import { describe, expect, it } from 'vitest';
import type { AuthPrincipal } from '../types';
import { hasAllPermissions, hasAnyRole, hasPermission } from './authorization';

const principal: AuthPrincipal = {
  id: '1',
  roles: ['admin'],
  permissions: ['users:read', 'users:update'],
};

describe('authorization helpers', () => {
  it('deny everything without a principal', () => {
    expect(hasPermission(null, 'users:read')).toBe(false);
    expect(hasAnyRole(null, ['admin'])).toBe(false);
  });

  it('check roles and permissions', () => {
    expect(hasAnyRole(principal, ['viewer', 'admin'])).toBe(true);
    expect(hasAllPermissions(principal, ['users:read', 'users:update'])).toBe(true);
    expect(hasAllPermissions(principal, ['users:read', 'users:delete'])).toBe(false);
  });
});
