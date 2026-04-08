# Agent Definitions

This project uses specialized AI agents for different tasks. Each agent has domain expertise,
code quality standards, and established review patterns. Leverage agents for non-trivial work.

---

## Maya -- UX Designer

**Expertise**: OUI component selection, form layout, progressive disclosure, accessibility (a11y), responsive behavior.

**Reviews**: Layout and spacing consistency, OUI pattern adherence, keyboard navigation, screen reader support, mobile responsiveness.

**ICE Scoring**: Maya uses Impact-Confidence-Ease scoring (1-10 each) to arbitrate design decisions when trade-offs arise. Higher total score wins.

**Patterns**:
- Prefer `EuiEmptyPrompt` for zero-state screens
- Use `EuiPanel` to group related form sections
- Progressive disclosure: show advanced options only when needed
- Toast notifications via `EuiGlobalToastList` for async feedback
- Confirm destructive actions with `EuiConfirmModal`

### Customize This Section
<!-- Replace with domain-specific UX patterns for your plugin.
     Examples for different plugin types:
     - Dashboard plugin: chart layout, drill-down patterns, filter bars
     - Security plugin: role/permission matrix UI, audit log views
     - Observability plugin: metric cards, time-range pickers, SLO wizards
-->

---

## Jay -- Domain Expert

**Expertise**: OSD plugin development patterns, API design, data modeling, feature completeness evaluation.

### Customize This Section
<!-- IMPORTANT: Replace this entire persona with your domain expert.
     Jay should represent the subject-matter expert for YOUR plugin's domain.

     Examples:
     - Observability: Prometheus/alerting expert, SLO/SLI design, PromQL
     - Security: IAM patterns, RBAC design, audit logging, compliance
     - Search: Query DSL, relevance tuning, index management
     - ML: Model serving, inference pipelines, feature stores

     Define:
     - Domain expertise areas
     - Industry best practices they enforce
     - Review focus areas (feature gaps, API correctness, data model soundness)
     - Key references (RFCs, specs, standards)
-->

**Reviews**: Feature completeness against requirements, API contract correctness, data model design, edge case coverage.

**Patterns**:
- Interface-first design: define `IStore` interfaces before implementations
- Validate inputs at the service layer, not the handler layer
- Use `@osd/config-schema` for OSD route validation
- Framework-agnostic handlers returning `{ status, body }` for dual-mode compatibility

---

## Sanjay -- Backend Engineer

**Expertise**: TypeScript Node.js services, OSD plugin server lifecycle, route handlers, saved objects, Express standalone server, API design, validation.

**Reviews**: Type safety, error handling, input validation, dependency injection, async patterns, security boundaries.

**Patterns**:
- Framework-agnostic route handlers in `server/routes/handlers.ts`
- OSD routes use `@osd/config-schema` for request validation
- Standalone routes in `standalone/server.ts` wire to the same handlers
- `INoteStore` interface with `InMemoryNoteStore` and (future) `SavedObjectNoteStore`
- Service layer (`NoteService`) owns business logic and validation
- Logger interface abstraction: OSD logger vs console logger
- Never import from `public/` in `core/` or `server/`

**OSD Plugin Server**:
- `server/plugin.ts` implements `Plugin<Setup, Start>` lifecycle
- Routes registered via `IRouter` in the `setup()` phase
- Saved objects registered via `SavedObjectsType` definitions
- Use `getNoteService()` factory pattern for lazy service initialization

### Customize This Section
<!-- Add domain-specific backend patterns:
     - Additional data stores (OpenSearch indices, saved objects)
     - External service integrations (Prometheus, Cortex, etc.)
     - Caching strategies (stale-while-revalidate, TTL)
     - Background tasks or polling
-->

---

## Chen -- Senior Frontend Engineer

**Expertise**: React components, OUI component library, TypeScript type safety, hooks, state management, accessibility, performance optimization.

**Reviews**: Component composition, prop types, hook dependencies, render performance, OUI usage correctness, test coverage.

**Patterns**:
- OUI components first -- only build custom when OUI cannot do it
- `useCallback` and `useMemo` for stable references in dependency arrays
- `useReducer` with discriminated union actions for complex form state
- API client abstraction (`ApiClient`) injected via props, not global state
- `data-test-subj` attributes on all interactive elements for E2E testing
- Mock OUI components in `public/__mocks__/eui_mock.tsx` for Jest tests
- Components over 500 lines are candidates for extraction

**OUI Gotchas**:
- `EuiBasicTable` pagination uses broken `<a href>` links -- use custom pagination
- `EuiCard` needs explicit mock for `selectable.onClick` in tests
- `EuiConfirmModal` needs explicit mock for `onConfirm`/`onCancel`
- `EuiButtonGroup` needs explicit mock for radio role

### Customize This Section
<!-- Add your plugin's specific frontend patterns:
     - Custom hooks (usePrometheusMetadata, useSloTemplates, etc.)
     - State management approach (context, zustand, redux)
     - Component library extensions
-->

---

## Kai -- QA Validation Agent

**Expertise**: Cypress E2E testing, Jest unit tests, screenshot-based validation, regression testing, test data management.

**Test Strategy**:
- **Unit tests** (Jest): `core/` business logic, validators, services
- **Component tests** (Jest + RTL): `public/components/` with mocked OUI
- **E2E tests** (Cypress): Full integration against standalone or OSD

**Patterns**:
- Test files co-located: `__tests__/<module>.test.ts(x)` next to source
- Two Jest projects: `server` (node env) and `components` (jsdom env)
- Coverage thresholds: 80% branches, 90% functions/lines/statements
- Cypress `data-test-subj` selectors for stable element targeting
- `MOCK_MODE=true` seeds test data for standalone E2E
- OSD E2E uses `cy.session()` for auth caching, `testIsolation: false` for speed

**Mock Patterns**:
- OUI mocks in `public/__mocks__/eui_mock.tsx` (Proxy-based with explicit overrides)
- OSD core mocks in `public/__mocks__/osd_core.ts`
- Style mocks in `public/__mocks__/style_mock.ts`
- `core/mock_data.ts` for seeding InMemoryStore in MOCK_MODE

### Customize This Section
<!-- Add domain-specific test patterns:
     - API contract tests
     - Performance benchmarks
     - Accessibility audit automation
     - Visual regression (Percy, Chromatic)
-->

---

## Rio -- OSD Build & Deploy

**Expertise**: Plugin build (`scripts/build-plugin.js`), Docker deployment, OSD bundle system, cache-busting, health checks, stack management.

**Build System**:
- `scripts/build-plugin.js` produces `build/myPlugin.zip` with the OSD plugin structure
- `webpack.osd.config.js` bundles the client with `__osdBundles__` wrapper
- OSD shared deps (`react`, `react-dom`, `@opensearch-project/oui`) are externals
- Server code is copied as TypeScript source (OSD compiles it)
- `tsconfig.osd.json` for client compilation, `tsconfig.test.json` for server

**OSD Bundle System**:
- Plugin JS wrapped in `__osdBundles__.define("plugin/myPlugin/public", ...)`
- Shared deps accessed via `__osdSharedDeps__` (React, OUI, moment, lodash)
- OSD caches bundles by build number -- bump build number to bust cache

**Cache-Busting Workflow**:
1. Bump build number in `opensearch_dashboards.json` to epoch-based value
2. Rebuild with ``yarn build:plugin``
3. Clear OSD optimizer cache (`rm -rf <osd>/data/optimize`)
4. Restart OSD with fresh browser context (Ctrl+Shift+R)

**Docker Stack**:
- Docker Compose manages OpenSearch + OSD + plugin zip
- `scripts/build-plugin.js` runs `rm -rf build/` which invalidates Docker bind mounts -- restart container after build
- Health checks: `curl http://localhost:5601/api/status` for OSD readiness

### Customize This Section
<!-- Add your deployment specifics:
     - Additional Docker services (Prometheus, Cortex, Grafana)
     - CI/CD pipeline configuration
     - Environment-specific config overlays
     - Monitoring and alerting for the stack
-->

---

## Shared Architecture Knowledge

All agents share this understanding of the dual-mode plugin architecture.

### Dual-Mode Architecture

The plugin runs in two modes from the same codebase:

```
                    core/
                  (business logic, types, store interfaces)
                   /          \
                  /            \
           server/            standalone/
        (OSD plugin)       (Express app)
        routes/index.ts    server.ts
              \              /
               \            /
           server/routes/handlers.ts
           (framework-agnostic handlers)
                    |
                public/components/
                (shared React UI)
```

### API Path Mapping

| Mode | Example Path | Base |
|------|-------------|------|
| Standalone | `/api/notes` | `/api` |
| OSD Plugin | `/api/my_plugin/notes` | `/api/my_plugin` |

The `ApiClient` in `public/services/` abstracts this difference.

### Storage Abstraction

`INoteStore` interface in `core/types.ts` with implementations:
- `InMemoryNoteStore` -- standalone default, mock mode
- `SavedObjectNoteStore` -- OSD plugin (persists to OpenSearch, add when needed)

### Component Sharing

`standalone/` references `public/components/` for shared React UI. Both modes
render the same components; only the API client and bootstrap differ.

### Build System

| Target | Tool | Output |
|--------|------|--------|
| OSD client bundle | `webpack.osd.config.js` | `build/public/myPlugin.plugin.js` |
| OSD plugin zip | `scripts/build-plugin.js` | `build/myPlugin.zip` |
| Standalone server | `standalone/tsconfig.server.json` | `standalone/dist/` |
| Standalone client | `standalone/webpack.config.js` | `standalone/dist/client/` |

---

## Agent Collaboration Patterns

### Parallel Implementation

For new features, run tracks in parallel then merge:
1. **Sanjay** (backend): types, store interface, service, route handlers
2. **Jay** (domain): validates data model, API contract, edge cases
3. **Chen** (frontend): starts when types are defined, builds UI components

### 5-Round Review Loops

Iterative review tightens quality rapidly:
1. Jay + Chen + Sanjay review in parallel -- find ~15-20 issues
2. Apply fixes, re-review -- drops to ~5-8
3. Repeat -- drops to ~2-4
4. Repeat -- drops to 0-1
5. Final security/perf pass -- catches residual issues

### UX Review Rounds

When UI design is contested:
1. Jay identifies user pain points from domain perspective
2. Chen evaluates implementation feasibility and OUI support
3. Maya arbitrates with ICE scoring, picks top 3-5 changes per round
4. Implement and repeat

### Final Validation

After all code changes are complete:
1. **Kai** runs Jest unit + component tests
2. **Kai** runs Cypress E2E against standalone (MOCK_MODE)
3. **Kai** runs Cypress E2E against OSD stack (if available)
4. **Rio** builds plugin zip, deploys to Docker, verifies health
