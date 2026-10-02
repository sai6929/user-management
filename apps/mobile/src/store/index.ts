import { createAppStore } from '@user-management/store';
import { env } from '@/config/env';

export const store = createAppStore({ devTools: !env.isProduction });

export type { AppDispatch, RootState } from '@user-management/store';
