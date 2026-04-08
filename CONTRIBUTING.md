# Contributing

Thank you for your interest in contributing to this project. This document explains the
process and expectations for contributions.

## Developer Certificate of Origin (DCO)

All commits **must** be signed off with the DCO. This certifies that you wrote the code
or have the right to submit it under the project's open-source license.

```bash
# Every commit must use the -s flag
git commit -s -m "Add feature X"

# The sign-off line looks like:
# Signed-off-by: Your Name <your.email@example.com>
```

Configure your Git identity:
```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

Commits without a DCO sign-off will be rejected by CI.

## Pull Request Process

1. **Fork** the repository and create a feature branch from `main`
2. **Implement** your changes following the code style below
3. **Test** your changes -- all existing tests must pass, new code needs tests
4. **Sign off** every commit with `git commit -s`
5. **Open a PR** against `main` with a clear description of the change
6. **Address review feedback** -- maintainers may request changes
7. **Merge** -- a maintainer will merge once approved and CI passes

### PR Title Format

Use a concise, descriptive title:
- `Add saved object store for notes`
- `Fix pagination in notes table`
- `Update OUI dependency to 1.13.0`

## Code Style

- **TypeScript strict** -- no `any` types except at serialization boundaries
- **Prettier** for formatting (check with `yarn lint`)
- **ESLint** for code quality (fix with `yarn lint:fix`)
- **OUI components first** -- use `@opensearch-project/oui` before building custom UI
- **File size limit** -- files over 500 lines are candidates for extraction
- **Test naming** -- `__tests__/<module>.test.ts(x)` co-located with source
- **Interface-first** -- define interfaces before implementations

## Testing Requirements

All PRs must satisfy:

| Requirement | Detail |
|-------------|--------|
| Unit tests pass | `yarn test` exits cleanly |
| Coverage thresholds met | 80% branches, 90% functions/lines/statements |
| E2E tests pass | `yarn e2e` for standalone mode |
| Linting passes | `yarn lint` reports no errors |

### Writing Tests

- **Core logic**: Add tests in `core/__tests__/`
- **Server routes**: Add tests in `server/__tests__/` or `server/routes/__tests__/`
- **React components**: Add tests in `public/components/__tests__/`
- **E2E flows**: Add Cypress specs in `cypress/e2e/`

## Agent-Driven Code Review

This project uses AI agent review loops (see [AGENTS.md](AGENTS.md)). When reviewing
or being reviewed:

1. **Sanjay** reviews backend code (types, handlers, validation, error handling)
2. **Chen** reviews frontend code (components, hooks, OUI usage, accessibility)
3. **Jay** reviews domain correctness (data model, API contracts, feature gaps)
4. **Maya** reviews UX (layout, flow, progressive disclosure, a11y)
5. **Kai** validates via test execution (unit, component, E2E)

Multiple review rounds are expected. Issues typically drop from ~15 to ~3 across
3-5 rounds.

## Reporting Bugs

Open a GitHub issue with:

1. **Summary** -- one-line description of the bug
2. **Steps to reproduce** -- exact steps to trigger the issue
3. **Expected behavior** -- what should happen
4. **Actual behavior** -- what actually happens
5. **Environment** -- Node version, OS, browser, OSD version (if applicable)
6. **Screenshots** -- if the bug is visual

## Questions?

Open a discussion on GitHub or reach out to the maintainers listed in the repository.
