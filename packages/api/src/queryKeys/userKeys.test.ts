import { describe, expect, it } from 'vitest';
import { toUserId } from '@user-management/shared';
import { userKeys } from './userKeys';

describe('userKeys', () => {
  it('builds hierarchical keys so broader keys invalidate narrower ones', () => {
    expect(userKeys.all).toEqual(['users']);
    expect(userKeys.list({ page: 2 })).toEqual(['users', 'list', { page: 2 }]);
    expect(userKeys.detail(toUserId('42'))).toEqual(['users', 'detail', '42']);
    expect(userKeys.list().slice(0, 1)).toEqual(userKeys.all);
  });
});
