#!/bin/bash
# Set up a local development stack for the OSD plugin.
# Two modes:
#   1. Basic: OpenSearch + OSD via Docker compose (minimal)
#   2. Observability: Full observability stack (Prometheus, Grafana, etc.)
set -e

echo "=== OSD Plugin Development Stack Setup ==="
echo ""
echo "Choose a stack mode:"
echo "  1) Basic (OpenSearch + OSD only)"
echo "  2) Observability (full stack with Prometheus, Grafana, etc.)"
echo ""
read -p "Enter choice [1]: " STACK_MODE
STACK_MODE=${STACK_MODE:-1}

PLUGIN_DIR="$(cd "$(dirname "$0")/.." && pwd)"
STACK_DIR="${OBSERVABILITY_STACK_DIR:-}"

if [ "$STACK_MODE" = "2" ]; then
  echo ""
  echo "=== Observability Stack ==="

  if [ -z "$STACK_DIR" ]; then
    # Search common locations
    for candidate in \
      "$HOME/Documents/workspace/observability-stack" \
      "$HOME/observability-stack" \
      "../observability-stack"; do
      if [ -d "$candidate/docker-compose.yml" ] || [ -d "$candidate/docker-compose.yaml" ]; then
        STACK_DIR="$(cd "$candidate" && pwd)"
        break
      fi
    done
  fi

  if [ -z "$STACK_DIR" ]; then
    echo "Observability stack not found. Clone it?"
    REPO="${OBS_STACK_REPO:-https://github.com/lezzago/observability-stack.git}"
    BRANCH="${OBS_STACK_BRANCH:-main}"
    read -p "Clone $REPO (branch: $BRANCH)? [Y/n]: " DO_CLONE
    if [ "${DO_CLONE:-Y}" != "n" ] && [ "${DO_CLONE:-Y}" != "N" ]; then
      STACK_DIR="$HOME/Documents/workspace/observability-stack"
      git clone -b "$BRANCH" "$REPO" "$STACK_DIR"
    else
      echo "Aborted. Set OBSERVABILITY_STACK_DIR and re-run."
      exit 1
    fi
  fi

  echo "Using stack at: $STACK_DIR"
  echo ""

  # Build plugin zip
  echo "Building plugin..."
  cd "$PLUGIN_DIR"
  npm run build:plugin

  # Start stack
  cd "$STACK_DIR"
  docker compose down -v 2>/dev/null || true
  docker compose up -d

  echo ""
  echo "Stack starting! OSD will be available at http://localhost:5601"
  echo "Login: admin / My_password_123!@#"
else
  echo ""
  echo "=== Basic Stack (OpenSearch + OSD) ==="
  echo ""

  COMPOSE_FILE="$PLUGIN_DIR/docker-compose.yml"
  if [ ! -f "$COMPOSE_FILE" ]; then
    echo "Creating basic docker-compose.yml..."
    cat > "$COMPOSE_FILE" << 'COMPOSE_EOF'
version: '3'
services:
  opensearch:
    image: opensearchproject/opensearch:2.17.0
    environment:
      - discovery.type=single-node
      - DISABLE_SECURITY_PLUGIN=true
    ports:
      - "9200:9200"
    volumes:
      - opensearch-data:/usr/share/opensearch/data

  opensearch-dashboards:
    image: opensearchproject/opensearch-dashboards:2.17.0
    ports:
      - "5601:5601"
    environment:
      - OPENSEARCH_HOSTS=["http://opensearch:9200"]
      - DISABLE_SECURITY_DASHBOARDS_PLUGIN=true
    depends_on:
      - opensearch

volumes:
  opensearch-data:
COMPOSE_EOF
  fi

  docker compose -f "$COMPOSE_FILE" up -d
  echo ""
  echo "Basic stack starting! OSD at http://localhost:5601"
fi
