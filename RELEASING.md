# Releasing

This document describes the release process for this plugin.

## Release Workflow

1. **Create a release branch**: `git checkout -b release/X.Y.Z`
2. **Update version**: Bump `version` in `package.json` and `opensearch_dashboards.json`
3. **Update release notes**: Add `release-notes/opensearch-dashboards-my-plugin.release-notes-X.Y.Z.md`
4. **Build the plugin**: `yarn build:plugin`
5. **Test**: Run `yarn test` and `yarn e2e` to verify
6. **Tag**: `git tag vX.Y.Z`
7. **Create GitHub release**: Upload `build/myPlugin.zip` as a release asset

## Version Compatibility

This plugin targets a specific OpenSearch Dashboards version, declared in `opensearch_dashboards.json`:

| Plugin Version | OSD Version |
|---------------|-------------|
| 1.0.0 | 3.6.0 |

## Build Artifacts

The build produces `build/myPlugin.zip` with the structure:
```
opensearch-dashboards/myPlugin/
  opensearch_dashboards.json
  package.json
  server/
  core/
  common/
  public/
  build/public/myPlugin.plugin.js
```
