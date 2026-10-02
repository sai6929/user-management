/**
 * Mutation option factories (POST/PUT/PATCH/DELETE). Each one is responsible
 * for invalidating the affected query keys on success, e.g.
 *
 *   onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.lists() })
 */
export {};
