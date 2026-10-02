import { createSlice } from '@reduxjs/toolkit';

/** Application-level client state (not server data). */
export interface AppState {
  /** True once startup work (e.g. restoring a session) has finished. */
  readonly isBootstrapped: boolean;
}

const initialState: AppState = {
  isBootstrapped: false,
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    appBootstrapped: (state) => {
      state.isBootstrapped = true;
    },
  },
  selectors: {
    selectIsBootstrapped: (state) => state.isBootstrapped,
  },
});

export const { appBootstrapped } = appSlice.actions;
export const { selectIsBootstrapped } = appSlice.selectors;
