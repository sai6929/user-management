/** Generic list/pagination contracts for future endpoints. */

export type SortDirection = 'asc' | 'desc';

export interface PageParams {
  readonly page?: number;
  readonly pageSize?: number;
}

export interface SortParams<TField extends string = string> {
  readonly sortBy?: TField;
  readonly sortDirection?: SortDirection;
}

export interface PaginatedResponse<TItem> {
  readonly items: readonly TItem[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
}
