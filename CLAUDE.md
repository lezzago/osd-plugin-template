# OSD Plugin Template -- Claude Code Instructions

> Single source of truth for any agent or developer starting from this template.
> Read this file before writing any code.

---

## 1. Initial Setup

### Prerequisites

- **Node.js 18+** (20 recommended; use `nvm` to manage versions)
- **Yarn 1.x** (OSD monorepo uses Yarn — all official plugins follow this convention)
- **Git** with DCO sign-off: `git commit -s`
- **Docker** (optional, for OSD plugin E2E and stack deployment)

### From Zero to Running

```bash
# 1. Clone the template
git clone <repo-url> my-plugin && cd my-plugin

# 2. Install root dependencies
yarn install

# 3. Run unit tests to verify setup
yarn test

# 4. Start standalone mode (fastest way to see the UI)
yarn build:standalone
yarn start:standalone
# Open http://localhost:3000 — you should see a Notes app with 3 seeded notes
```

Standalone mode uses `MOCK_MODE=true` by default, which seeds sample data. No Docker, no OpenSearch, no OSD required.

> **OSD-first development**: The plugin is designed to run inside OpenSearch Dashboards. Standalone mode is a convenience for rapid UI iteration — it is NOT a separate product. Always validate changes in OSD plugin mode before submitting PRs.

---

## 2. Quick Reference

```bash
# Testing
yarn test                          # Run all unit tests (Jest, 4 files, 80 tests)
yarn test:coverage                 # Unit tests with coverage enforcement
yarn e2e                           # Cypress E2E against standalone (MOCK_MODE)

# Linting
yarn lint                          # ESLint check
yarn lint:fix                      # ESLint auto-fix

# OSD Plugin (primary development target)
yarn build:plugin                  # Build OSD plugin zip (build/myPlugin.zip)
yarn build:osd                     # Build OSD client bundle only (webpack)
./scripts/sync-to-osd.sh           # Symlink plugin into OSD monorepo for local dev

# Standalone (convenience for rapid UI iteration)
yarn build:standalone              # Build standalone server + client bundle
yarn start:standalone              # Start standalone on :3000 (MOCK_MODE=true)
yarn dev:standalone                # Start standalone with ts-node (no build step)

# Stack Management
./scripts/setup-stack.sh           # Set up Docker stack (basic or observability)
```

---

## 3. Development Modes

Choose the right mode for your task. **OSD plugin mode is the primary target** — standalone is a convenience.

### OSD Plugin Mode (primary — full fidelity)

**When to use**: Always validate here before merging. Tests saved objects, OSD navigation, workspace features, production parity.

```bash
# Option A: Symlink into local OSD monorepo (live reload)
./scripts/sync-to-osd.sh ~/path/to/OpenSearch-Dashboards
cd ~/path/to/OpenSearch-Dashboards
yarn start --config config/opensearch_dashboards.dev.yml

# Option B: Build plugin zip for Docker OSD
yarn build:plugin
# Then install the zip into your OSD container or observability stack
```

- API paths: `/api/my_plugin/notes`, `/api/my_plugin/notes/{id}`
- Data persisted in OpenSearch via `SavedObjectNoteStore`
- Full OSD chrome, nav groups, workspace support
- Route validation via `@osd/config-schema`
- Live reload: server restarts on `server/` changes, webpack recompiles on `public/` changes
- Login (Docker stack): `admin` / `My_password_123!@#`

### Standalone Mode (convenience — fast iteration)

**When to use**: Rapid UI prototyping, handler logic development. Does NOT test saved objects, OSD navigation, or `@osd/config-schema` validation.

```bash
yarn start:standalone             # Build + serve on :3000
yarn dev:standalone               # ts-node hot reload (no client rebuild)
```

- Port **3000**, `MOCK_MODE=true` seeds 3 sample notes
- Express server with `InMemoryNoteStore` (data lost on restart)
- API paths: `/api/notes`, `/api/notes/:id`
- No authentication, no saved objects, no OSD chrome
- **Limitation**: Standalone does not exercise OSD-specific code paths (plugin lifecycle, saved object registration, config-schema validation, nav groups). Always verify in OSD plugin mode.

### Unit Tests

**When to use**: Business logic in `core/`, route handlers in `server/routes/`, component rendering.

```bash
yarn test                         # Run all 4 test files, 80 tests
yarn test --watch                 # Watch mode for TDD
yarn test:coverage                # With coverage thresholds enforced
```

---

## 4. Architecture Overview

### Dual-Mode Design

This template implements a **dual-mode architecture**: the same business logic and UI components run in two different host environments.

```
                    +------------------+
                    |    core/         |
                    | Types, Services  |
                    | Validators       |
                    | Store Interface  |
                    +--------+---------+
                             |
               +-------------+-------------+
               |                           |
    +----------v----------+     +----------v----------+
    |   server/ (OSD)     |     | standalone/ (Express)|
    | SavedObjectNoteStore|     | InMemoryNoteStore    |
    | OSD routes + IRouter|     | Express routes       |
    | Plugin lifecycle    |     | Static file serving  |
    +---------------------+     +----------------------+
               |                           |
    +----------v----------+     +----------v----------+
    |   public/ (shared)  |     | standalone/client.tsx|
    | React components    |<----| (imports public/     |
    | ApiClient           |     |  components)         |
    | OUI (EUI) widgets   |     |                      |
    +---------------------+     +----------------------+
```

### API Path Mapping

| Operation | OSD Plugin Path | Standalone Path |
|-----------|----------------|-----------------|
| List notes | `GET /api/my_plugin/notes` | `GET /api/notes` |
| Get note | `GET /api/my_plugin/notes/{id}` | `GET /api/notes/:id` |
| Create note | `POST /api/my_plugin/notes` | `POST /api/notes` |
| Update note | `PUT /api/my_plugin/notes/{id}` | `PUT /api/notes/:id` |
| Delete note | `DELETE /api/my_plugin/notes/{id}` | `DELETE /api/notes/:id` |

The `ApiClient` in `public/services/api_client.ts` detects the mode at runtime and uses the correct paths.

### Storage Abstraction

```
INoteStore (interface in core/types.ts)
  |
  +-- InMemoryNoteStore (core/note_store.ts)     -- standalone + MOCK_MODE
  |
  +-- SavedObjectNoteStore (server/note_saved_object_store.ts)  -- OSD plugin
```

### Directory Layout

```
my-plugin/
  common/              Shared constants (PLUGIN_ID, PLUGIN_NAME, API_BASE)
  core/                Framework-agnostic business logic
    types.ts             Data models + INoteStore interface
    note_store.ts        InMemoryNoteStore implementation
    note_service.ts      Business logic service (validation + store)
    validators.ts        Input validation functions
    mock_data.ts         Seed data for MOCK_MODE
    __tests__/           Unit tests for core logic
  server/              OSD plugin server
    plugin.ts            Plugin lifecycle (setup/start/stop)
    types.ts             OSD plugin type contracts
    note_saved_object_store.ts  SavedObject-backed INoteStore
    routes/
      index.ts           OSD route definitions (IRouter + @osd/config-schema)
      handlers.ts        Framework-agnostic handlers returning { status, body }
      __tests__/         Handler unit tests
  public/              OSD plugin UI
    plugin.ts            Plugin registration (app mount, nav groups)
    application.tsx      React mount/unmount entry point
    index.ts             Plugin class export
    types.ts             Plugin setup/start type contracts
    services/
      api_client.ts      Mode-aware API client (OSD HTTP vs fetch)
    components/
      app.tsx            Root React component (Router)
      home_page.tsx      Notes CRUD UI
      __tests__/         Component tests
    __mocks__/           OUI + OSD stubs for Jest
  standalone/          Express standalone server
    server.ts            Express app, imports same handlers from server/routes/
    client.tsx           Client-side entry point (renders public/components)
    package.json         Separate dependency manifest (express, OUI, etc.)
    webpack.config.js    Client bundle config
    tsconfig.*.json      Server + client TypeScript configs
  stubs/               OSD type stubs for out-of-tree compilation
    src/core/server/     Server-side OSD type declarations
    src/core/public/     Client-side OSD type declarations
    src/plugins/         Plugin dependency type stubs
    @osd/               OSD package type stubs (config-schema, i18n)
  cypress/             E2E test suite
    e2e/notes.cy.ts      Notes CRUD tests (5 tests)
    support/commands.ts  ensureLoaded() custom command
  scripts/build-plugin.js             Build OSD plugin zip
  webpack.osd.config.js  OSD client bundle webpack config
  jest.config.js       Jest multi-project config (server + components)
  opensearch_dashboards.json  OSD plugin manifest
```

### Component Sharing

The standalone client imports React components directly from `public/components/`. In the alert-manager project this is done via a symlink (`standalone/components -> ../public/components`). In this template, the standalone `client.tsx` and `webpack.config.js` reference `../public/components/` directly. Either approach works -- the key constraint is that `public/components/` must not import OSD-specific modules.

---

## 5. How to Add a New Feature

Step-by-step recipe using "Tasks" as an example (replace with your domain):

### Step 1: Define the data model

Edit `core/types.ts`:
```typescript
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface ITaskStore {
  getAll(): Promise<Task[]>;
  create(input: CreateTaskInput): Promise<Task>;
  // ... other CRUD methods
}
```

### Step 2: Create store with InMemory implementation

Create `core/task_store.ts` implementing `ITaskStore` with a `Map<string, Task>`.

### Step 3: Write business logic service

Create `core/task_service.ts` with validation, logging, and store delegation (follow `note_service.ts` pattern).

### Step 4: Add framework-agnostic handlers

Create `server/routes/task_handlers.ts` -- pure functions returning `{ status, body }`:
```typescript
export async function handleGetTasks(service: TaskService): Promise<HandlerResponse> {
  const tasks = await service.getAll();
  return { status: 200, body: tasks };
}
```

### Step 5: Wire OSD routes

In `server/routes/index.ts`, add routes using `IRouter` + `@osd/config-schema`:
```typescript
router.get({ path: '/api/my_plugin/tasks', validate: false }, async (ctx, req, res) => {
  const result = await handleGetTasks(getTaskService());
  return res.ok({ body: result.body });
});
```

### Step 6: Wire standalone routes

In `standalone/server.ts`, import the same handlers:
```typescript
app.get('/api/tasks', async (_req, res) => {
  const result = await handleGetTasks(taskService);
  res.status(result.status).json(result.body);
});
```

### Step 7: Add UI components

Create `public/components/tasks_page.tsx` using OUI components. Add the route in `app.tsx`.

### Step 8: Add API client methods

In `public/services/api_client.ts`, add paths and methods for both modes.

### Step 9: Write tests

- **Unit**: `core/__tests__/task_service.test.ts` and `server/routes/__tests__/task_handlers.test.ts`
- **Component**: `public/components/__tests__/tasks_page.test.tsx`
- **E2E**: `cypress/e2e/tasks.cy.ts`

### Step 10: Build and verify

```bash
yarn test && yarn build:standalone && yarn build:plugin
```

---

## 6. Testing

### Unit Tests (Jest)

Two projects defined in `jest.config.js`:

| Project | Environment | Roots | Test Pattern |
|---------|-------------|-------|-------------|
| `server` | node | `core/`, `server/` | `__tests__/**/*.test.ts` |
| `components` | jsdom | `public/` | `__tests__/**/*.test.tsx` |

**Coverage thresholds** (enforced by `yarn test:coverage`):
- Branches: 80%
- Functions: 90%
- Lines: 90%
- Statements: 90%

**OUI mock pattern**: All OUI/EUI components are mocked in `public/__mocks__/eui_mock.tsx`. The mock file provides:
- Simple stubs for layout components (`EuiPage`, `EuiSpacer`, etc.) that render a `<div>` with children
- Interactive mocks for components that need click handlers (`EuiButton`, `EuiButtonEmpty`)
- Rich mocks for complex components (`EuiBasicTable` renders actual rows, `EuiConfirmModal` exposes confirm/cancel buttons)

**Adding new OUI component mocks**: When you use a new OUI component in production code:
1. Check if it already exists in `public/__mocks__/eui_mock.tsx`
2. If not, add an export matching the component name
3. Components needing interaction in tests (click handlers, selectable props, role attributes) require explicit mocks with the relevant props -- the simple `stub()` function is not enough
4. Components used only for layout can use the `stub('ComponentName')` pattern

**Other mocks**:
- `public/__mocks__/osd_core.ts` -- stubs OSD core public imports
- `public/__mocks__/osd_navigation.ts` -- stubs navigation plugin imports
- `public/__mocks__/style_mock.ts` -- empty mock for CSS/SCSS imports

### E2E Tests (Cypress)

**5 tests** in `cypress/e2e/notes.cy.ts` covering CRUD operations.

**Standalone mode** (default, fast, no Docker):
```bash
yarn e2e                       # Builds standalone, starts with MOCK_MODE, runs Cypress
```
- Port 3000, mock data seeded automatically, no auth
- Uses `start-server-and-test` to orchestrate build/start/test

**OSD mode** (full stack):
```bash
CYPRESS_MODE=osd CYPRESS_OSD_WORKSPACE_ID=<id> npx cypress run
```

**`ensureLoaded()` custom command** (`cypress/support/commands.ts`):
- Standalone: visits `/`
- OSD: visits `/w/{workspaceId}/app/myPlugin`
- Waits for "Notes" text to be visible (15s timeout)

---

## 7. Conventions

- **TypeScript strict**: No `any` types except at serialization boundaries (e.g., `toNote()` in saved object store)
- **OUI components first**: Use `@opensearch-project/oui` -- only build custom components when OUI cannot do it
- **OSD plugin patterns**: `public/` + `server/` directories, plugin lifecycle with `setup()`/`start()`/`stop()`
- **Request-scoped clients**: Route handlers MUST use `context.core.savedObjects.client` for the per-user/per-workspace scoped client. NEVER use `createInternalRepository()` for user-facing operations — it bypasses workspace isolation and user permissions
- **i18n required**: All user-facing strings must use `i18n.translate()` from `@osd/i18n` for localization support. This is mandatory for opensearch-project repos. Example: `i18n.translate('myPlugin.notes.title', { defaultMessage: 'Notes' })`
- **Saved object migrations**: When changing saved object schemas between versions, add migration functions to the `migrations` field in `core.savedObjects.registerType()`. Never change mappings without a corresponding migration
- **Error handling in routes**: All route handlers must wrap service calls in try/catch and return `response.customError()` for unexpected errors. Never let exceptions bubble to OSD's generic error handler
- **License headers**: Every source file (`.ts`, `.tsx`, `.js`, `.scss`) must have the Apache 2.0 SPDX header. Run `yarn license:check` to verify
- **Test naming**: `__tests__/<module>.test.ts(x)` co-located with source files
- **Component limit**: Files over 500 lines are candidates for extraction into smaller components
- **Git commits**: Always use `git commit -s` (DCO sign-off required). Never omit the `-s` flag
- **Interface-first design**: Define interfaces (`INoteStore`, `Logger`) before implementations. Use the interface in services so implementations are swappable
- **Hook extraction**: Complex form state should use `useReducer` with discriminated union actions, not multiple `useState` calls. Simple forms (like the notes form) are fine with `useState`
- **Graceful degradation**: Optional enrichment APIs (metadata, autocomplete) should be best-effort. Never block primary workflows on optional features
- **Route handler style**: Framework-agnostic functions returning `{ status, body }` (see `server/routes/handlers.ts`). OSD routes map status codes to response helpers (`response.ok`, `response.notFound`, `response.badRequest`). Standalone routes use `res.status(result.status).json(result.body)`
- **Shared constants**: Plugin ID, name, and API base path live in `common/index.ts` and are imported by both server and public code
- **configPath**: Declare `configPath` in `opensearch_dashboards.json` to support `opensearch_dashboards.yml` configuration. Even if your plugin has no config today, declaring the path reserves it

---

## 8. Key Gotchas

### OUI / EUI Gotchas

- **EuiBasicTable pagination** uses `<a href>` links that cause full page reloads -- if you need pagination, build a custom pagination component
- **EuiCard**, **EuiConfirmModal**, and **EuiButtonGroup** need **explicit mocks** in `public/__mocks__/eui_mock.tsx` for Jest tests. The Proxy auto-stub pattern does not handle `selectable.onClick`, `onConfirm/onCancel`, or radio role attributes
- OUI is aliased as both `@elastic/eui` and `@opensearch-project/oui` in the webpack config externals -- use `@opensearch-project/oui` in your imports

### Build & Bundle Gotchas

- **OSD caches bundles aggressively** by build number -- when deploying to OSD, bump the build number to an epoch-based unique value (not just +1) to force cache invalidation
- **webpack mode must be `'none'`** in `webpack.osd.config.js` -- production mode tree-shakes OSD shared dependency references, breaking the plugin at runtime
- **`scripts/build-plugin.js` does `rm -rf build/`** which invalidates Docker bind mounts -- restart the container after rebuilding the plugin zip
- The OSD bundle is wrapped in `__osdBundles__.define(...)` by a custom webpack plugin -- do not change the wrapper format without understanding OSD's plugin loader

### TypeScript Gotchas

- **`tsconfig.json` extends `../../tsconfig.json`** (OSD monorepo root) when running inside OSD. For out-of-tree compilation, `tsconfig.osd.json` and `tsconfig.test.json` are self-contained with path mappings to `stubs/`
- The `stubs/` directory provides OSD type declarations for `src/core/server`, `src/core/public`, `@osd/config-schema`, and `@osd/i18n` -- these allow the plugin to compile without the full OSD monorepo

### Dependency Management Gotchas

- **OSD provides React, ReactDOM, react-router-dom, OUI, moment, lodash, jQuery at runtime** -- these must NOT be in `dependencies`. They belong in `devDependencies` (for compilation and testing only). The root `package.json` has **no `dependencies`** section — this is intentional and matches the official plugin pattern
- **Pin versions to match OSD** -- check `OpenSearch-Dashboards/package.json` for the exact versions OSD uses. Currently (OSD 3.6.0): `react: ^18.2.0`, `react-router-dom: ^5.3.0`, `@opensearch-project/oui: 1.22.1`. Using newer versions will cause runtime mismatches
- **Node version must match OSD** -- `.node-version` is pinned to the version OSD uses (currently `22.22.0`). Do not bump independently
- **Only add plugin-specific dependencies** to the root `package.json` (e.g., `formik`, `react-redux`). If OSD already provides it, use OSD's version
- **Standalone has its own `package.json`** with the same versions as real `dependencies` since it bundles everything itself (Express + React + OUI). These must still match OSD's versions for parity

### Architecture Gotchas

- **`core/` must not import from `public/`** -- mock data lives in `core/mock_data.ts`, not in UI components. The dependency direction is always: `public/` -> `core/` and `server/` -> `core/`
- **OSD HTTP client double-encodes `?` in URL paths** -- never embed query strings in the URL path. Use the `{ query: {} }` option: `this.http.get(path, { query: { search } })`
- **Standalone and OSD use different storage** -- InMemoryNoteStore data is lost on server restart. SavedObjectNoteStore persists to OpenSearch. Design accordingly

---

## 9. Agent-Driven Development

This template supports the same agent-driven development workflow as the alert-manager project. If you create an `AGENTS.md` file, the following agent roles are recommended:

| Agent | Role | When to Use |
|-------|------|-------------|
| **Jay** | Domain Expert | Domain-specific design, data model review, industry best practices |
| **Sanjay** | Backend Engineer | TypeScript services, route handlers, store implementations, API design |
| **Chen** | Senior Frontend Engineer | React components, OUI usage, TypeScript types, hooks, accessibility |
| **Maya** | UX Designer | Form layout, user flows, progressive disclosure, accessibility |
| **Kai** | QA Validation Agent | Cypress E2E, Jest unit tests, screenshot validation, regression testing |
| **Rio** | Build & Deploy | Plugin build, Docker deploy, cache-busting, health checks |

### Proven Patterns

1. **Parallel implementation tracks**: Backend (Sanjay) + Domain (Jay) run in parallel, then Frontend (Chen) starts when both complete
2. **5-round review loops**: Jay+Chen+Sanjay review -> fix -> repeat. Issues drop from ~18 to ~3 to ~5 to 0
3. **Collaborative UX review**: Jay+Chen+Maya discuss -> Maya arbitrates with ICE scores -> apply top 3-5 fixes per round
4. **Kai final validation**: After all code changes, have Kai verify every feature via Cypress against the running app

---

## 10. Customizing This Template

Follow these steps to rename the plugin and replace the example Notes feature with your domain:

### Step 1: Replace plugin identifiers

| Find | Replace with | Files |
|------|-------------|-------|
| `myPlugin` | `yourPluginId` | `opensearch_dashboards.json`, `webpack.osd.config.js`, `scripts/build-plugin.js`, `scripts/sync-to-osd.sh`, `cypress/support/commands.ts` |
| `my_plugin` | `your_plugin` | `common/index.ts` (API_BASE), `server/routes/index.ts`, `public/services/api_client.ts` |
| `MyPlugin` | `YourPlugin` | `server/plugin.ts` (class name), `public/plugin.ts` (class name) |
| `My Plugin` | `Your Plugin` | `common/index.ts` (PLUGIN_NAME) |
| `my-osd-plugin` | `your-osd-plugin` | `package.json`, `standalone/package.json` |

### Step 2: Replace the Notes domain

1. Rename `core/types.ts` interfaces: `Note` -> `YourEntity`, `INoteStore` -> `IYourEntityStore`
2. Rename `core/note_store.ts` -> `core/your_entity_store.ts` (and class name)
3. Rename `core/note_service.ts` -> `core/your_entity_service.ts`
4. Update validators in `core/validators.ts` for your fields
5. Update mock data in `core/mock_data.ts`
6. Update handlers in `server/routes/handlers.ts`
7. Update OSD routes in `server/routes/index.ts`
8. Update standalone routes in `standalone/server.ts`
9. Rename `server/note_saved_object_store.ts` and update the saved object type name and mappings in `server/plugin.ts`
10. Update UI components in `public/components/`
11. Update API client in `public/services/api_client.ts`
12. Update all tests and Cypress specs

### Step 3: Update documentation

- Update this `CLAUDE.md` to reflect your domain (replace all Notes references)
- Update `package.json` description
- Update `opensearch_dashboards.json` version and OSD version compatibility

---

## 11. Local OSD Development (Optional)

For full-fidelity testing inside the OSD monorepo:

### Symlink into OSD

```bash
# Link the plugin
./scripts/sync-to-osd.sh ~/Documents/workspace/OpenSearch-Dashboards

# Start OSD (requires Node 22 for the monorepo)
nvm use 22
cd ~/Documents/workspace/OpenSearch-Dashboards
yarn start --config config/opensearch_dashboards.dev.yml
```

- Local OSD typically runs on **port 5601** (or 5602 if Docker OSD is on 5601)
- Login: `admin` / `My_password_123!@#` (if security plugin is enabled)
- **Live reload**: server restarts on `server/` changes, webpack recompiles on `public/` changes

### Docker Stack Setup

```bash
# Interactive setup (basic OpenSearch+OSD or full observability stack)
./scripts/setup-stack.sh

# Non-interactive (set env vars)
OBSERVABILITY_STACK_DIR=/path/to/stack ./scripts/setup-stack.sh
```

The basic stack provides OpenSearch + OSD via Docker Compose (security disabled). The observability stack adds Prometheus, Grafana, and other monitoring tools.

---

## 12. CI Workflows

Create these GitHub Actions workflows in `.github/workflows/`:

| Workflow | Purpose | Trigger |
|----------|---------|---------|
| `test-and-build.yml` | Unit tests + coverage + standalone build | Push, PR |
| `cypress-e2e.yml` | Cypress E2E against standalone (MOCK_MODE) | Push, PR |
| `publish.yml` | Package OSD plugin zip as release artifact | Tag push |

### Recommended `test-and-build.yml` structure

```yaml
name: Test and Build
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: yarn test:coverage
      - run: yarn build:standalone
      - run: yarn build:plugin
```
