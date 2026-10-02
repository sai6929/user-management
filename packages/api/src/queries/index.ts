/**
 * Query option factories built with `queryOptions()` from TanStack Query,
 * combining a key from ../queryKeys with an endpoint from ../endpoints:
 *
 *   export const userDetailQuery = (http: AxiosInstance, id: UserId) =>
 *     queryOptions({ queryKey: userKeys.detail(id), queryFn: () => usersEndpoints(http).get(id) });
 *
 * Apps consume them with `useQuery(userDetailQuery(apiClient, id))`.
 */
export {};
