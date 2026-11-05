#!/bin/sh
# SSH tunnels for production access (vaunt pattern).
# Usage: ./tunnel.sh [--db] [--api] [--all]
set -eu
MODE="${1---all}"
if [ "$MODE" = "--db" ] || [ "$MODE" = "--all" ]; then
  echo "DB tunnel :5433 -> hermes-db:5432 (Ctrl+C to stop)"
fi
if [ "$MODE" = "--api" ] || [ "$MODE" = "--all" ]; then
  echo "API tunnel :8002 -> hermes:8001 (Ctrl+C to stop)"
fi
echo "Configure ~/.ssh/config hosts hermes / hermes-db first."
