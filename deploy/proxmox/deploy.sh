#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${BASE_DIR}/../.." && pwd)"
COMPOSE_FILE="${BASE_DIR}/docker-compose.yml"

if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
else
  COMPOSE_CMD=(docker compose)
fi

cd "${PROJECT_ROOT}"

echo "[deploy] Fetching latest changes from git..."
git pull --ff-only

echo "[deploy] Building and starting services..."
"${COMPOSE_CMD[@]}" -f "${COMPOSE_FILE}" up -d --build

echo "[deploy] Done. Current service status:"
"${COMPOSE_CMD[@]}" -f "${COMPOSE_FILE}" ps
