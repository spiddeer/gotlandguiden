#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="${BASE_DIR}/data"
BACKUP_DIR="${BASE_DIR}/backups"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/gutafinn-data-${TIMESTAMP}.tar.gz"
PARTIAL_FILE="${BACKUP_FILE}.partial"
SNAPSHOT_NAME=".places-backup-${TIMESTAMP}.db"
SNAPSHOT_FILE="${DATA_DIR}/${SNAPSHOT_NAME}"

mkdir -p "${BACKUP_DIR}"

if [[ ! -d "${DATA_DIR}" ]]; then
  echo "Data directory not found: ${DATA_DIR}" >&2
  exit 1
fi

cleanup() {
  rm -f "${SNAPSHOT_FILE}" "${PARTIAL_FILE}"
}
trap cleanup EXIT

docker exec \
  -e DB_PATH=/data/places.db \
  -e BACKUP_PATH="/data/${SNAPSHOT_NAME}" \
  gutafinn_api node backup.js

tar -czf "${PARTIAL_FILE}" \
  --transform="s|^${SNAPSHOT_NAME}$|places.db|" \
  -C "${DATA_DIR}" "${SNAPSHOT_NAME}"
mv "${PARTIAL_FILE}" "${BACKUP_FILE}"

echo "Backup created: ${BACKUP_FILE}"
