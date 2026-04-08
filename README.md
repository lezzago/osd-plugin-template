# OSD Plugin Template

A production-ready template for building OpenSearch Dashboards plugins with a **dual-mode architecture**: the same codebase runs as both a standalone Express application and an OSD plugin.

## Key Features

- **Working Notes example** -- CRUD application with table, forms, and toast notifications using OUI
- **Dual-mode architecture** -- develop standalone (fast iteration) or inside OSD (full integration)
- **Interface-first design** -- `INoteStore` abstraction with in-memory and saved-object implementations
- **Framework-agnostic handlers** -- route logic shared between Express and OSD router
- **Agent-driven development** -- 6 AI agents with defined expertise (see [AGENTS.md](AGENTS.md))
- **Full test setup** -- Jest (unit + component) with coverage thresholds, Cypress E2E ready
- **OSD build pipeline** -- `yarn build:plugin` produces installable plugin zip with proper bundle wrapping
- **CI/CD workflows** -- GitHub Actions for test, build, and E2E

## Quick Start

```bash
# 1. Install dependencies
yarn install

# 2. Build and start standalone server (with mock data)
yarn build:standalone
yarn start:standalone

# 3. Open http://localhost:3000
```

The standalone server starts in `MOCK_MODE` with seeded sample notes. No Docker or OSD required.

## Architecture

```
osd-plugin-template/
|
|-- core/                   # Backend-agnostic business logic
|   |-- types.ts            #   INoteStore interface, Note type, Logger
|   |-- note_store.ts       #   InMemoryNoteStore implementation
|   |-- note_service.ts     #   NoteService (validation + store)
|   |-- validators.ts       #   Input validation functions
|   +-- mock_data.ts        #   Seed data for MOCK_MODE
|
|-- server/                 # OSD plugin server
|   |-- plugin.ts           #   Plugin lifecycle (setup/start/stop)
|   +-- routes/
|       |-- index.ts        #   OSD route definitions (@osd/config-schema)
|       +-- handlers.ts     #   Framework-agnostic handlers
|
|-- public/                 # Shared React UI
|   |-- plugin.ts           #   OSD plugin class (app registration)
|   |-- components/
|   |   |-- app.tsx         #   Root app with routing
|   |   +-- home_page.tsx   #   Notes CRUD page (table + forms)
|   +-- services/
|       +-- api_client.ts   #   HTTP client abstraction
|
|-- standalone/             # Express standalone server
|   |-- server.ts           #   Express app wiring handlers
|   |-- client.tsx          #   Standalone React entry point
|   +-- webpack.config.js   #   Client bundle config
|
|-- common/                 # Shared constants (PLUGIN_ID, API_BASE)
|-- stubs/                  # OSD type stubs for out-of-tree compilation
|-- cypress/                # E2E test specs and support
+-- scripts/build-plugin.js  # Produces build/myPlugin.zip
```

## Customization

This template is designed to be forked and extended. Key customization points:

1. **Rename the plugin**: Update `PLUGIN_ID` in `common/index.ts`, `opensearch_dashboards.json`, and `webpack.osd.config.js`
2. **Replace the data model**: Swap `Note`/`INoteStore` in `core/types.ts` with your domain types
3. **Add routes**: Follow the handler pattern in `server/routes/handlers.ts`
4. **Build UI**: Add components in `public/components/` using OUI
5. **Configure agents**: Customize the `### Customize This Section` blocks in [AGENTS.md](AGENTS.md)

See the [CLAUDE.md](CLAUDE.md) customization section for a complete walkthrough.

## Development Modes

| Mode | Command | Port | Use Case |
|------|---------|------|----------|
| Standalone | `yarn start:standalone` | 3000 | Fast UI iteration, no OSD needed |
| Standalone dev | `yarn dev:standalone` | 3000 | Auto-restart on server changes |
| OSD plugin | `yarn start` (from OSD root) | 5601 | Full integration with OSD |

## Documentation

| Document | Description |
|----------|-------------|
| [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) | Setup, testing, build, and troubleshooting |
| [CONTRIBUTING.md](CONTRIBUTING.md) | PR process, code style, DCO requirement |
| [AGENTS.md](AGENTS.md) | AI agent definitions and collaboration patterns |
| [CLAUDE.md](CLAUDE.md) | Claude Code instructions and project conventions |
| [SECURITY.md](SECURITY.md) | Vulnerability reporting policy |

## License

Apache License 2.0 -- see [LICENSE](LICENSE).
