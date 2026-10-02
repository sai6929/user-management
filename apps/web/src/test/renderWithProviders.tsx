import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router';
import { createQueryClient } from '@user-management/api';
import { createLogger } from '@user-management/shared';
import { createAppStore } from '@user-management/store';
import { AppProviders } from '@/app/providers/AppProviders';

/** Renders routes with fresh, isolated store and query client instances. */
export const renderRoutes = (
  routes: RouteObject[],
  initialPath = '/',
): ReturnType<typeof render> => {
  const store = createAppStore({ devTools: false });
  const queryClient = createQueryClient({ logger: createLogger({ level: 'silent' }) });
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] });

  const ui: ReactElement = (
    <AppProviders store={store} queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  );
  return render(ui);
};
