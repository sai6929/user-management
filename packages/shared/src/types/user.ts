import type { PageParams, SortParams } from './api';

/**
 * Branded id so a user id can't be confused with any other string.
 * The User entity itself is intentionally not modelled yet.
 */
export type UserId = string & { readonly __brand: 'UserId' };

export const toUserId = (value: string): UserId => value as UserId;

/** Filters accepted by a future "list users" endpoint. Extend as the API is defined. */
export interface UserListParams extends PageParams, SortParams {
  readonly search?: string;
}
