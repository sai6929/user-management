import { useEffect } from 'react';
import { useRouteError } from 'react-router';
import { getUserMessage } from '@user-management/shared';
import { logger } from '@/services/logger';

/** Shows a safe, generic message; technical details go to the logger only. */
export const RouteErrorBoundary = () => {
  const error = useRouteError();

  useEffect(() => {
    logger.error('Unhandled route error', { error });
  }, [error]);

  return (
    <main className="page" role="alert">
      <h1>Something went wrong</h1>
      <p>{getUserMessage(error)}</p>
    </main>
  );
};
