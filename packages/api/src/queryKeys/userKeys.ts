import type { UserId, UserListParams } from '@user-management/shared';

/**
 * Hierarchical, strongly typed query keys for the users domain.
 * Invalidating `userKeys.all` refreshes every user query; `userKeys.lists()`
 * refreshes only lists, etc.
 */
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: UserListParams = {}) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (userId: UserId) => [...userKeys.details(), userId] as const,
};
