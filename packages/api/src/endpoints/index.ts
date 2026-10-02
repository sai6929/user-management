/**
 * Endpoint functions: thin, typed wrappers around the Axios client that
 * validate responses with zod schemas from @user-management/shared.
 *
 * Convention (one file per domain):
 *   export const usersEndpoints = (http: AxiosInstance) => ({
 *     list: async (params: UserListParams) => parseOrThrow(schema, (await http.get(...)).data),
 *   });
 *
 * No endpoints exist yet — they will be added once the backend contract is defined.
 */
export {};
