#!/bin/bash
# Symlink this plugin into an OSD monorepo for local development.
# Usage: ./scripts/sync-to-osd.sh [path-to-osd]
#
# After running, start OSD with: cd <osd-path> && yarn start
set -e

PLUGIN_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OSD_DIR="${1:-$HOME/Documents/workspace/OpenSearch-Dashboards}"

if [ ! -d "$OSD_DIR/src/core" ]; then
  echo "ERROR: OSD directory not found at $OSD_DIR"
  echo "Usage: $0 /path/to/OpenSearch-Dashboards"
  exit 1
fi

PLUGINS_DIR="$OSD_DIR/plugins"
LINK_NAME="myPlugin"
LINK_PATH="$PLUGINS_DIR/$LINK_NAME"

if [ -L "$LINK_PATH" ]; then
  echo "Removing existing symlink: $LINK_PATH"
  rm "$LINK_PATH"
elif [ -d "$LINK_PATH" ]; then
  echo "ERROR: $LINK_PATH exists as a directory (not a symlink). Remove it manually."
  exit 1
fi

echo "Creating symlink: $LINK_PATH -> $PLUGIN_DIR"
ln -s "$PLUGIN_DIR" "$LINK_PATH"

echo ""
echo "Done! Plugin linked into OSD at: $LINK_PATH"
echo ""
echo "Next steps:"
echo "  cd $OSD_DIR"
echo "  yarn start --config config/opensearch_dashboards.dev.yml"
