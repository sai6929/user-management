import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import {
  AuthenticationError,
  AuthorizationError,
  QUERY_DEFAULTS,
  ValidationError,
  type Logger,
} from '@user-management/shared';

interface QueryClientOptions {
  readonly logger: Logger;
}

/** Client errors won't succeed on retry; only transient failures are retried. */
const isRetriable = (error: unknown): boolean =>
  !(
    error instanceof AuthenticationError ||
    error instanceof AuthorizationError ||
    error instanceof ValidationError
  );

/**
 * The single source of truth for server state. Server data lives here, never
 * in Redux. Call `queryClient.clear()` on logout so no cached data from one
 * user is visible to the next.
 */
export const createQueryClient = ({ logger }: QueryClientOptions): QueryClient =>
  new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        logger.warn('Query failed', { queryKey: query.queryKey, error });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        logger.warn('Mutation failed', { mutationKey: mutation.options.mutationKey, error });
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: QUERY_DEFAULTS.STALE_TIME_MS,
        gcTime: QUERY_DEFAULTS.GC_TIME_MS,
        retry: (failureCount, error) =>
          isRetriable(error) && failureCount < QUERY_DEFAULTS.MAX_RETRIES,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: {
        // Mutations are not idempotent by default; never retry them implicitly.
        retry: false,
      },
    },
  });
