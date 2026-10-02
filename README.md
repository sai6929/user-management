# User Management

A secure, scalable foundation for a User Management system with a **React web app** and a **React Native (Expo) mobile app**, sharing types, validation, API infrastructure and client state in a pnpm monorepo.

> **Status:** base architecture only. No login, registration, dashboard, user CRUD, endpoints or business logic exist yet. Both apps render a single placeholder screen: _"User Management Application"_.

---

## 1. Project overview

The repository provides the plumbing every feature will need, so feature work can focus on business logic:

- A centralized, typed **API client** (Axios) with tracing headers, auth/CSRF hooks, single-flight token refresh, and error normalization.
- A centralized **TanStack Query** client with safe retry rules and typed query keys.
- A **Redux Toolkit** store holding only client state: session status, identity/permissions, app state.
- A shared **error model**, a **redacting logger**, **zod validation** helpers and **validated environment config**.
- Strict TypeScript, ESLint security rules, Prettier, Husky + lint-staged, Vitest + React Testing Library.

## 2. Technology stack

| Concern            | Web                                                         | Mobile                                     |
| ------------------ | ----------------------------------------------------------- | ------------------------------------------ |
| UI                 | React 19 + Vite 8                                           | React Native 0.86 + Expo SDK 57            |
| Routing            | React Router 7                                              | Expo Router                                |
| Client state       | Redux Toolkit + React Redux                                 | Redux Toolkit + React Redux                |
| Server state       | TanStack Query 5                                            | TanStack Query 5                           |
| HTTP               | Axios                                                       | Axios                                      |
| Validation         | zod 4                                                       | zod 4                                      |
| Secure token store | In-memory + httpOnly cookie                                 | expo-secure-store (Keychain/Keystore)      |
| Testing            | Vitest + React Testing Library                              | Vitest (logic); see [Testing](#10-testing) |
| Language / quality | TypeScript 6 (strict), ESLint, Prettier, Husky, lint-staged |                                            |
| Package manager    | pnpm 10 workspaces                                          |                                            |

> **Why TypeScript 6, not 7?** `typescript-eslint` currently supports TypeScript `<6.1`. React is pinned to **19.2.3** in both apps because Expo SDK 57 requires that exact version, and one React version across the workspace avoids duplicate-React bugs. React Router 8 needs React ≥ 19.2.7, so web uses React Router 7.

## 3. Architecture

```
            ┌──────────────┐        ┌────────────────┐
            │  apps/web    │        │  apps/mobile   │   platform code: UI, routing,
            │  (Vite)      │        │  (Expo)        │   token storage, env mapping
            └──────┬───────┘        └───────┬────────┘
                   │  both depend on        │
     ┌─────────────┼────────────────────────┼─────────────┐
     ▼             ▼                        ▼             ▼
┌──────────┐  ┌──────────────────┐  ┌────────────────────────┐
│  store   │  │       api        │  │        shared          │
│ RTK      │  │ Axios client,    │  │ types, constants,      │
│ slices   │  │ QueryClient,     │  │ errors, logger, zod    │
│          │  │ query keys       │  │ validation, env schema │
└────┬─────┘  └────────┬─────────┘  └────────────────────────┘
     └─────────────────┴──────────────▶ (depends on shared)
```

Dependencies only point **inward** (apps → packages → shared). `shared` has no dependency on React, the DOM, Node or React Native.

### State ownership — the most important rule

| Data                                                                       | Lives in                                               |
| -------------------------------------------------------------------------- | ------------------------------------------------------ |
| Anything fetched from the server (users, roles lists…)                     | **TanStack Query**                                     |
| Session status, signed-in principal (id/roles/permissions), session expiry | **Redux** `auth`                                       |
| App/UI state (bootstrapped, future: theme, modals…)                        | **Redux** `app`                                        |
| Access token                                                               | Memory only (platform `tokenStore`)                    |
| Refresh token                                                              | Web: httpOnly cookie (server-set). Mobile: SecureStore |

Server data is **never copied into Redux**. Tokens are **never in Redux** (devtools, persistence and logging would expose them).

### Key architectural decisions

**Internal packages consumed as TypeScript source.** Packages export `./src/index.ts` directly; Vite and Metro compile them. No build step, instant feedback, one type graph.

**`packages/store` (addition to the suggested layout).** The auth/app slices are identical on web and mobile. Putting them in one package prevents two copies of the session state machine from drifting. Each app still owns its own store instance and typed hooks (`apps/*/src/store`).

**`packages/api` stays platform-independent through dependency inversion.** `createApiClient()` receives an `AuthAdapter` (get/refresh token, session-expired callback), an id generator and a logger. Web supplies `crypto.randomUUID` and an in-memory token store; mobile supplies `expo-crypto` and SecureStore. The future auth feature only implements the adapter; nothing in `packages/api` changes.

**Single-flight token refresh in the response interceptor.** On a 401, the client refreshes once (concurrent 401s share the same refresh), replays the request, and calls `onSessionExpired` if refresh fails. The refresh call itself must use a bare Axios call, not this client.

**Every error becomes an `AppError`.** `normalizeApiError` maps HTTP failures to `ValidationError` (400/422), `AuthenticationError` (401), `AuthorizationError` (403), `NetworkError` (no response) or `ApiError`. Each error has a developer `message` (logs only) and a generic `userMessage` (the only text shown in the UI), so backend internals never reach users.

**Query retries are error-aware.** Auth, permission and validation errors aren't retried. Transient failures are retried up to twice. Mutations are never retried implicitly.

**Env config is validated once at startup** with a shared zod schema (`parseClientEnv`). Staging/production builds fail fast unless the API URL is `https://` and debug logging is off.

**Routes are structured for guards.** Web: protected pages will be children of a pathless layout route whose element is an auth guard. Mobile: protected screens will go in a route group wrapped in `<Stack.Protected guard={…}>`. Pages and screens never check auth themselves.

**Mobile is a separate `src/providers` folder.** The mobile `app/` directory is reserved for Expo Router file-based routes, so mobile composition code lives in `src/providers` (web uses `src/app`).

## 4. Folder structure

```text
user-management/
├── apps/
│   ├── web/                         # React + Vite
│   │   ├── index.html
│   │   ├── vite.config.ts           # alias @ → src, preview security headers
│   │   ├── vitest.config.ts
│   │   └── src/
│   │       ├── app/                 # composition root: providers, queryClient
│   │       ├── components/          # shared presentational components
│   │       ├── config/env.ts        # validated VITE_* config
│   │       ├── features/            # feature modules (auth, users…) — future
│   │       ├── hooks/
│   │       ├── layouts/RootLayout.tsx
│   │       ├── pages/               # HomePage (placeholder), NotFoundPage
│   │       ├── routes/              # route tree, paths, error boundary
│   │       ├── services/            # apiClient, tokenStore, logger
│   │       ├── store/               # store instance + typed hooks
│   │       ├── test/                # test setup + render helpers
│   │       ├── types/
│   │       ├── utils/
│   │       ├── App.tsx
│   │       └── main.tsx
│   └── mobile/                      # React Native + Expo
│       ├── app.json
│       ├── app/                     # Expo Router routes: _layout.tsx, index.tsx
│       ├── vitest.config.mts
│       └── src/
│           ├── components/  features/  hooks/  types/  utils/
│           ├── config/env.ts        # validated EXPO_PUBLIC_* config
│           ├── providers/           # AppProviders, queryClient
│           ├── services/            # apiClient, tokenStore (SecureStore), logger
│           └── store/               # store instance + typed hooks
├── packages/
│   ├── shared/src/                  # platform-independent, no React/DOM/RN
│   │   ├── config/                  # client env schema
│   │   ├── constants/               # app name, HTTP header names, defaults
│   │   ├── errors/                  # AppError hierarchy
│   │   ├── logging/                 # logger + redaction
│   │   ├── types/                   # auth, api, user id types
│   │   ├── utils/                   # RBAC/permission helpers
│   │   └── validation/              # zod primitives + parseOrThrow
│   ├── api/src/
│   │   ├── client/                  # axiosClient, interceptors, apiError, types
│   │   ├── endpoints/               # (empty) typed endpoint functions
│   │   ├── queries/                 # (empty) queryOptions factories
│   │   ├── mutations/               # (empty) mutation factories
│   │   ├── queryKeys/               # userKeys.all / list() / detail(id)
│   │   └── queryClient/             # createQueryClient
│   └── store/src/                   # authSlice, appSlice, createAppStore
├── .husky/pre-commit                # runs lint-staged
├── .env.example                     # all public env vars (no secrets)
├── eslint.config.js
├── prettier.config.js
├── pnpm-workspace.yaml              # workspaces + pnpm settings
├── tsconfig.json                    # strict base config
└── vitest.config.ts                 # runs all test projects
```

## 5. Installation

Requirements: **Node.js ≥ 22.22.1** (or 24.x) and **pnpm 10**.

```bash
npm install -g pnpm@10      # or: corepack enable
pnpm install
```

`pnpm install` also installs the Git hooks (Husky). The workspace uses a hoisted `node_modules` layout (best for Metro) and `autoInstallPeers: false`, so every peer dependency is explicit and no unexpected native module gets autolinked into the mobile app.

## 6. Development commands

Run these from the repository root.

| Command              | Description                                         |
| -------------------- | --------------------------------------------------- |
| `pnpm dev:web`       | Start the web dev server (http://localhost:5173)    |
| `pnpm dev:mobile`    | Start the Expo dev server                           |
| `pnpm build:web`     | Type-check and build the web app to `apps/web/dist` |
| `pnpm typecheck`     | Type-check every app and package                    |
| `pnpm lint`          | ESLint, zero warnings allowed                       |
| `pnpm lint:fix`      | ESLint with auto-fix                                |
| `pnpm format`        | Format everything with Prettier                     |
| `pnpm format:check`  | Check formatting                                    |
| `pnpm test`          | Run all tests once                                  |
| `pnpm test:watch`    | Run tests in watch mode                             |
| `pnpm test:coverage` | Run tests with coverage                             |
| `pnpm verify`        | typecheck + lint + format:check + test (CI gate)    |

## 7. Environment setup

All variables are documented in [`.env.example`](.env.example). Copy the relevant section into:

- `apps/web/.env.local` (read by Vite, `VITE_*` variables)
- `apps/mobile/.env.local` (read by Expo, `EXPO_PUBLIC_*` variables)

| Variable (web / mobile)                              | Required           | Notes                                                                                                     |
| ---------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------- |
| `VITE_APP_ENV` / `EXPO_PUBLIC_APP_ENV`               | No                 | `development`, `test`, `staging` or `production`. Defaults to development in dev and production in builds |
| `VITE_API_BASE_URL` / `EXPO_PUBLIC_API_BASE_URL`     | Staging/production | Must be `https://` outside development                                                                    |
| `VITE_API_TIMEOUT_MS` / `EXPO_PUBLIC_API_TIMEOUT_MS` | No                 | Default 15000, max 120000                                                                                 |
| `VITE_LOG_LEVEL` / `EXPO_PUBLIC_LOG_LEVEL`           | No                 | `debug` is rejected in staging/production                                                                 |

**Security notes:**

- These values are **public**: they are compiled into the JS bundle or app binary. Never put secrets in them.
- `.env` and `.env.*` are git-ignored; only `.env.example` is tracked.
- A production build without a valid `https://` API URL stops at startup with a `ConfigurationError`. This is intentional: it fails fast instead of running misconfigured.
- In development the API URL is optional so the shell runs before a backend exists. The API client is created lazily and throws if you call it with no URL configured.

## 8. Web development

```bash
pnpm dev:web            # http://localhost:5173
pnpm build:web          # production build
pnpm --filter @user-management/web preview   # serve the build with security headers
```

- Use the `@/` import alias for `apps/web/src`.
- New routes go in `src/routes/routes.tsx`. Paths go in `src/routes/paths.ts`.
- Get the HTTP client with `getApiClient()` from `src/services/apiClient.ts`.
- `vite preview` sends a strict Content-Security-Policy and other security headers. **Your production host (CDN or reverse proxy) must send equivalent headers.** Vite does not serve production traffic.

## 9. Mobile development

```bash
pnpm dev:mobile         # then press a (Android), i (iOS) or scan the QR code with Expo Go
pnpm --filter @user-management/mobile android
pnpm --filter @user-management/mobile ios     # macOS only
pnpm --filter @user-management/mobile doctor  # Expo dependency health check
```

- Routes live in `apps/mobile/app/` (Expo Router, file-based). Everything else lives in `apps/mobile/src/`, imported via `@/`.
- Read `EXPO_PUBLIC_*` variables only as `process.env.EXPO_PUBLIC_X` (static access) inside `src/config/env.ts`. Expo can't inline them otherwise.
- Credentials go in `src/services/tokenStore.ts` (SecureStore, `WHEN_UNLOCKED_THIS_DEVICE_ONLY`). Never use AsyncStorage for credentials; ESLint blocks importing it.
- `app.json` sets `android.allowBackup: false`, so app data isn't included in device backups.
- Change `ios.bundleIdentifier` / `android.package` (currently `com.example.usermanagement`) before the first store build.

## 10. Testing

```bash
pnpm test                # all projects
pnpm test:watch
pnpm test:coverage
pnpm exec vitest run --project web     # a single project: shared | api | store | web | mobile
```

Tests sit next to the code they cover (`*.test.ts(x)`). The root `vitest.config.ts` runs five projects:

| Project  | Environment | Covers                                                          |
| -------- | ----------- | --------------------------------------------------------------- |
| `shared` | node        | log redaction, error model, env validation, permission helpers  |
| `api`    | node        | headers, CSRF, error mapping, single-flight refresh, query keys |
| `store`  | node        | session lifecycle and the "no tokens in Redux" rule             |
| `web`    | jsdom       | routes rendered with React Testing Library                      |
| `mobile` | node        | SecureStore token storage (mocked) and store setup              |

API tests use an in-memory Axios adapter, so no network or fake server is involved. `apps/web/src/test/renderWithProviders.tsx` renders routes with a fresh store and query client for every test.

**Mobile component tests:** React Native views can't render under Vitest/Node. When you need screen tests, add `jest-expo` and `@testing-library/react-native` for those files only. Keep Vitest for logic.

## 11. Linting

`pnpm lint` runs ESLint 10 with `typescript-eslint` **strict type-checked** rules, React Hooks rules, and these security guardrails:

| Rule                                                         | Why                                                      |
| ------------------------------------------------------------ | -------------------------------------------------------- |
| `@typescript-eslint/no-explicit-any`                         | Use `unknown` and narrow the type instead                |
| `no-console`                                                 | Use the logger, which redacts sensitive data             |
| `dangerouslySetInnerHTML` banned                             | Blocks XSS through raw HTML                              |
| `localStorage` / `sessionStorage` banned                     | Prevents tokens/PII from landing in XSS-readable storage |
| AsyncStorage import banned                                   | It's unencrypted. Use SecureStore                        |
| `no-eval`, `no-implied-eval`, `no-new-func`, `no-script-url` | Blocks code-injection vectors                            |

The Husky **pre-commit** hook runs `lint-staged`, which runs ESLint (`--max-warnings=0`) and Prettier on staged files only.

## 12. Formatting

Prettier settings are in `prettier.config.js`: single quotes, semicolons, trailing commas, 100-character lines, LF line endings.

```bash
pnpm format         # write
pnpm format:check   # verify (used by pnpm verify / CI)
```

---

## Extending the foundation

**Adding authentication:**

1. Define zod schemas for the token/session responses in `packages/shared`.
2. Add `packages/api/src/endpoints/auth.ts`. Make the refresh call with a bare Axios request.
3. In each app's `services/apiClient.ts`, supply `refreshAccessToken`. Supply `onSessionExpired` too, and have it dispatch `sessionExpired()`, call `queryClient.clear()` and clear the token store. On web, add `csrf`.
4. Dispatch `sessionStarted({ principal, expiresAt })` after login and `sessionEnded()` on logout.
5. Add a `RequireAuth` layout route (web) and `Stack.Protected` group (mobile) that read `selectIsAuthenticated` and use `hasPermission`/`hasAnyRole` from `@user-management/shared`.

**Adding a user feature:**

1. Define schemas and types in `packages/shared`.
2. Add endpoints in `packages/api/src/endpoints/users.ts`.
3. Add `queryOptions` factories in `queries/` that use `userKeys`.
4. Add mutations in `mutations/` that invalidate `userKeys` on success.
5. Build the UI in `apps/*/src/features/users`.
