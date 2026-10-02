import type { RouteObject } from 'react-router';
import { RootLayout } from '@/layouts/RootLayout';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import { ROUTES } from './paths';

/**
 * Route tree. Protected pages will be added as children of a pathless layout
 * route whose element is an auth guard, e.g.
 *
 *   { element: <RequireAuth permissions={['users:read']} />, children: [ ...protected ] }
 *
 * so no individual page needs to know about authentication.
 */
export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: ROUTES.HOME, element: <HomePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
