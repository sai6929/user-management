import { createBrowserRouter, RouterProvider } from 'react-router';
import { AppProviders } from '@/app/providers/AppProviders';
import { queryClient } from '@/app/queryClient';
import { routes } from '@/routes/routes';
import { store } from '@/store';

const router = createBrowserRouter(routes);

export const App = () => (
  <AppProviders store={store} queryClient={queryClient}>
    <RouterProvider router={router} />
  </AppProviders>
);
