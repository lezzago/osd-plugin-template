# Developer Guide

This guide covers everything you need to develop, test, build, and deploy the plugin.

## Prerequisites

- **Node.js** 18 or 20 (use `nvm` to switch versions)
- **npm** 9+ (comes with Node.js 18+)
- **Docker** and **Docker Compose** (for OSD plugin mode and stack deployment)
- **Git** with DCO sign-off configured (`git commit -s`)

Optional:
- **Cypress** (installed as devDependency, `npx cypress` works out of the box)
- **OpenSearch Dashboards monorepo** (only for OSD plugin development)

## Standalone Development (Fastest Path)

The standalone server is the fastest way to develop UI and API features. No Docker or OSD required.

```bash
# Install dependencies
yarn install

# Build standalone (server + client)
yarn build:standalone

# Start with mock data
yarn start:standalone
# => http://localhost:3000

# Or use dev mode (auto-restart on server changes)
yarn dev:standalone
```

The `MOCK_MODE=true` environment variable seeds sample notes on startup.

### Standalone Architecture

The standalone server (`standalone/server.ts`) uses Express and wires the same
framework-agnostic handlers from `server/routes/handlers.ts`. The React UI is built
with webpack (`standalone/webpack.config.js`) and served as static files.

API routes in standalone mode:
- `GET /api/notes` -- list all notes
- `GET /api/notes/:id` -- get a single note
- `POST /api/notes` -- create a note
- `PUT /api/notes/:id` -- update a note
- `DELETE /api/notes/:id` -- delete a note

## OSD Plugin Development

To run the plugin inside OpenSearch Dashboards from source:

### 1. Clone the OSD Monorepo

```bash
git clone https://github.com/opensearch-project/OpenSearch-Dashboards.git
cd OpenSearch-Dashboards
```

### 2. Link the Plugin

Place or symlink this repository into the OSD plugins directory:

```bash
ln -s /path/to/osd-plugin-template plugins/my-plugin
```

### 3. Bootstrap OSD

```bash
nvm use   # Use the Node version specified in .nvmrc
yarn osd bootstrap
```

### 4. Start OSD

```bash
# Basic: connects to localhost:9200 OpenSearch
yarn start

# With custom config (e.g., Docker observability stack)
yarn start --config config/opensearch_dashboards.dev.yml
```

OSD runs on **port 5601** by default. The plugin registers under the nav group
and is accessible from the sidebar.

API routes in OSD plugin mode:
- `GET /api/my_plugin/notes`
- `GET /api/my_plugin/notes/{id}`
- `POST /api/my_plugin/notes`
- `PUT /api/my_plugin/notes/{id}`
- `DELETE /api/my_plugin/notes/{id}`

### Hot Reload

- **Server changes** (`server/`, `core/`): OSD restarts the server automatically
- **Client changes** (`public/`): Webpack recompiles and the browser refreshes

## Docker Stack Setup

### Basic Stack (OpenSearch + OSD)

Create a `docker-compose.yml` with OpenSearch and OSD services, mounting the
plugin zip as a bind mount. After building the plugin:

```bash
# Build the plugin zip
yarn build:plugin
# => build/myPlugin.zip

# Start the Docker stack
docker compose up -d

# Verify OSD health
curl http://localhost:5601/api/status
```

### After Rebuilding

`build:plugin` runs `rm -rf build/` which invalidates Docker bind mounts.
Always restart the OSD container after a rebuild:

```bash
yarn build:plugin
docker compose restart opensearch-dashboards
```

## Testing

### Unit Tests (Jest)

```bash
# Run all tests
yarn test

# Run with coverage report
yarn test:coverage

# Run in watch mode during development
yarn test:watch

# Run a specific test file
npx jest core/__tests__/note_service.test.ts
```

Two Jest projects are configured in `jest.config.js`:
- **server** -- Node environment for `core/` and `server/` tests
- **components** -- jsdom environment for `public/` React component tests

Coverage thresholds (enforced in CI):
| Metric | Threshold |
|--------|-----------|
| Branches | 80% |
| Functions | 90% |
| Lines | 90% |
| Statements | 90% |

### Component Tests

React component tests use `@testing-library/react` with mocked OUI components.

OUI mocks are in `public/__mocks__/eui_mock.tsx`. When you add a new OUI component
to production code, check if a mock exists. Components with interaction handlers
(click, select, confirm) need explicit mocks beyond the Proxy auto-stub.

### E2E Tests (Cypress)

```bash
# Run against standalone server (builds, starts, runs, stops)
yarn e2e

# Open Cypress UI for interactive debugging
yarn cypress:open
```

Cypress specs live in `cypress/e2e/`. Use `data-test-subj` attributes for stable
element selectors:

```tsx
<EuiButton data-test-subj="createNoteButton">Create</EuiButton>
```

```js
cy.get('[data-test-subj="createNoteButton"]').click();
```

## Build and Deploy

### Build OSD Plugin Zip

```bash
yarn build:plugin
# => build/myPlugin.zip (installable OSD plugin)
```

The zip structure:
```
opensearch-dashboards/myPlugin/
  opensearch_dashboards.json
  package.json
  server/           # TypeScript source (OSD compiles)
  core/             # Shared business logic
  common/           # Shared constants
  public/           # TypeScript source
  build/public/     # Webpack client bundle
```

### Build Standalone Only

```bash
yarn build:standalone
# => standalone/dist/
```

### Linting

```bash
yarn lint          # Check for issues
yarn lint:fix      # Auto-fix what can be fixed
```

## Troubleshooting

### OSD bundle cache stale after rebuild

OSD caches bundles aggressively by build number. To force a refresh:

1. Bump the build number in `opensearch_dashboards.json` (use epoch-based value)
2. Rebuild: `yarn build:plugin`
3. Clear optimizer cache: `rm -rf <osd-root>/data/optimize`
4. Hard-refresh browser: `Ctrl+Shift+R`

### TypeScript errors about missing OSD types

The plugin uses stubs in `stubs/` for out-of-tree compilation. If you see errors
about missing types from `src/core/server` or `src/core/public`, check that
`tsconfig.json` paths and webpack aliases point to the correct stubs.

### Jest tests fail with "Cannot find module @opensearch-project/oui"

Ensure `moduleNameMapper` in `jest.config.js` maps OUI imports to the mock file:
```js
'^@opensearch-project/oui$': '<rootDir>/public/__mocks__/eui_mock.tsx'
```

### Docker "file not found" for plugin zip

`build:plugin` deletes and recreates `build/`. If a Docker volume mount points to
`build/myPlugin.zip`, the mount becomes stale. Restart the container:
```bash
docker compose restart opensearch-dashboards
```

### Standalone server crashes on import errors

The standalone server imports from `../core/` and `../server/routes/`. If paths
break, verify that `standalone/tsconfig.server.json` includes both `core/` and
`server/` in its compilation scope.

### Port already in use

Standalone defaults to port 3000. Override with:
```bash
PORT=4000 yarn start:standalone
```
