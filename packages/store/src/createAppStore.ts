import { combineSlices, configureStore } from '@reduxjs/toolkit';
import { appSlice } from './slices/appSlice';
import { authSlice } from './slices/authSlice';

export const rootReducer = combineSlices(authSlice, appSlice);

export type RootState = ReturnType<typeof rootReducer>;

export interface CreateAppStoreOptions {
  /** Disable in production so state (including identity data) isn't inspectable. */
  readonly devTools: boolean;
  readonly preloadedState?: Partial<RootState>;
}

/** Each app creates its own store instance from the same reducers. */
export const createAppStore = ({ devTools, preloadedState }: CreateAppStoreOptions) =>
  configureStore({
    reducer: rootReducer,
    devTools,
    ...(preloadedState ? { preloadedState } : {}),
  });

export type AppStore = ReturnType<typeof createAppStore>;
export type AppDispatch = AppStore['dispatch'];
