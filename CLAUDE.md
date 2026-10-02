# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

pnpm monorepo for a User Management system: a React web app (`apps/web`, Vite) and a React Native app (`apps/mobile`, Expo Router), sharing three internal packages. Only the base architecture exists; there is no login, CRUD, endpoints or business logic yet, and both apps render one placeholder screen. README.md is the detailed reference, including step-by-step recipes for adding auth and user features ("Extending the foundation").

## Commands

Use **pnpm** (v10, Node ≥ 22.22.1), not npm. `pnpm-lock.yaml` is the lockfile of record; `package-lock.json` is a stray artifact. Run from the repo root:

- `pnpm dev:web` (http://localhost:5173) / `pnpm dev:mobile` (Expo)
- `pnpm build:web`: typecheck plus Vite build
- `pnpm typecheck`: runs `tsc --noEmit` in every workspace
- `pnpm lint`: ESLint with `--max-warnings=0`; `pnpm lint:fix`
- `pnpm format` / `pnpm format:check`
- `pnpm test`: Vitest across all projects
- `pnpm verify`: typecheck, lint, format:check and test (the CI gate)

Single project: `pnpm exec vitest run --project <shared|api|store|web|mobile>`
Single file / test name: `pnpm exec vitest run packages/api/src/client/axiosClient.test.ts -t "refresh"`

Tests live next to the code they cover as `*.test.ts(x)`. `web` runs in jsdom (use `src/test/renderWithProviders.tsx`); everything else runs in node. API tests use an in-memory Axios adapter, so there is no network or mock server. React Native views can't render under Vitest, so mobile tests cover logic only.

Husky pre-commit runs lint-staged (ESLint and Prettier on staged files).

## Architecture

```
apps/web, apps/mobile  →  packages/store, packages/api  →  packages/shared
```

Dependencies point inward only. `shared` must stay free of React, DOM, Node and React Native. Packages are consumed **as TypeScript source** (`exports: "./src/index.ts"`), so they have no build step; Vite and Metro compile them. Import them as `@user-management/{shared,api,store}`. Inside an app, `@/` maps to that app's `src`.

### State ownership (core rule)

- Server data (users, roles…) goes in **TanStack Query** only and is never copied into Redux.
- Redux (`packages/store`: `authSlice`, `appSlice`) holds client state only: session status, principal (id/roles/permissions), expiry, app/UI flags. Each app creates its own store instance and typed hooks in `apps/*/src/store`.
- **Tokens never go in Redux.** The access token is held in memory by the platform `services/tokenStore.ts`. The refresh token lives in an httpOnly cookie on web and in SecureStore on mobile. A store test enforces this.

### API layer (`packages/api`)

- `createApiClient()` is platform-agnostic through dependency inversion. Each app's `services/apiClient.ts` injects an `AuthAdapter` (get/refresh token, `onSessionExpired`), an id generator and a logger. Use `getApiClient()`; it is created lazily and throws if no API URL is configured.
- On 401 the response interceptor does a **single-flight refresh**: concurrent 401s share one refresh, then the requests are replayed. The refresh endpoint must use bare Axios, not this client.
- Every failure is normalized to an `AppError` subclass from `shared/errors` (`ValidationError` for 400/422, `AuthenticationError`, `AuthorizationError`, `NetworkError`, `ApiError`). The UI may show only `userMessage`; `message` is for logs.
- `createQueryClient` doesn't retry auth, permission or validation errors, retries transient failures up to twice, and never retries mutations.
- New feature flow: zod schemas/types in `shared`, then `api/src/endpoints/*.ts`, then `queries/` (`queryOptions` factories that use `queryKeys`, e.g. `userKeys`), then `mutations/` (invalidate keys on success), then UI in `apps/*/src/features/<feature>`.

### Env config

`shared/config/clientEnv.ts` (`parseClientEnv`) validates env once at startup. Web reads `VITE_*` in `apps/web/src/config/env.ts`; mobile reads `EXPO_PUBLIC_*` in `apps/mobile/src/config/env.ts`, and must use static `process.env.EXPO_PUBLIC_X` access so Expo can inline the values. Staging/production require an `https://` API URL and reject `debug` logging. All these values are public and get bundled. See `.env.example`.

### Routing

- Web: routes go in `apps/web/src/routes/routes.tsx`, paths in `paths.ts`. Protected pages will be children of a pathless layout route that acts as the auth guard.
- Mobile: `apps/mobile/app/` is reserved for Expo Router file routes. Composition code goes in `src/providers` (the web equivalent is `src/app`). Protected screens will go inside `<Stack.Protected guard={…}>`.
- Pages and screens never check auth themselves. Use `hasPermission` / `hasAnyRole` from `shared`.

## Lint guardrails (these fail the build)

ESLint uses `typescript-eslint` strict type-checked rules and requires `consistent-type-imports`. It bans `any` (use `unknown` and narrow), `console` (use the redacting logger in `services/logger.ts`), `dangerouslySetInnerHTML`, `localStorage`/`sessionStorage`, importing AsyncStorage (use expo-secure-store), and `eval`-style code. Prefix intentionally unused vars with `_`.

## Version pins

React is pinned to exactly `19.2.3` in both apps because Expo SDK 57 requires it, and a single React avoids duplicate-React bugs. That pin keeps web on React Router 7. TypeScript stays at `~6.0` because `typescript-eslint` doesn't support newer versions. pnpm uses `nodeLinker: hoisted` (for Metro) and `autoInstallPeers: false`, so peer dependencies must be declared explicitly.
