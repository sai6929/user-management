import type { ReactNode } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { Provider as ReduxProvider } from 'react-redux';
import type { AppStore } from '@user-management/store';

interface AppProvidersProps {
  readonly store: AppStore;
  readonly queryClient: QueryClient;
  readonly children: ReactNode;
}

/** Composition root for global providers. Instances are injected so tests can supply their own. */
export const AppProviders = ({ store, queryClient, children }: AppProvidersProps) => (
  <ReduxProvider store={store}>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </ReduxProvider>
);
