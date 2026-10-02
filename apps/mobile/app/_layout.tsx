import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '@/providers/AppProviders';
import { queryClient } from '@/providers/queryClient';
import { store } from '@/store';

/**
 * Root navigator. Protected screens will live in an `(app)` route group wrapped
 * in `<Stack.Protected guard={isAuthenticated}>`, with public screens such as
 * sign-in in an `(auth)` group — no screen needs to check auth itself.
 */
export default function RootLayout() {
  return (
    <AppProviders store={store} queryClient={queryClient}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  );
}
