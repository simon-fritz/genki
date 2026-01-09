#!/bin/sh
set -e

if [ ! -f node_modules/sql.js/package.json ]; then
  echo "sql.js dependency missing; installing frontend dependencies..."
  npm ci
fi

exec "$@"