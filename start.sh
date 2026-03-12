#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Colours ──────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║       The Agency — Startup           ║"
echo "  ║   OpenClaw Configurator + Gateway    ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"

# ── Check prerequisites ──────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo -e "${RED}Error: docker is not installed.${NC}"
  exit 1
fi

if ! docker compose version &>/dev/null 2>&1; then
  echo -e "${RED}Error: docker compose is not available.${NC}"
  exit 1
fi

# ── Ensure .env exists ───────────────────────────────────
if [ ! -f .env ]; then
  echo -e "${YELLOW}No .env file found. Creating from .env.example...${NC}"
  cp .env.example .env
  echo -e "${YELLOW}Please edit .env with your API keys, then re-run this script.${NC}"
  exit 0
fi

# ── Deployments dir ──────────────────────────────────────
mkdir -p deployments

# ── Build & start ────────────────────────────────────────
echo -e "${GREEN}Building and starting services...${NC}"
docker compose up --build -d

echo ""
echo -e "${GREEN}Services started!${NC}"
echo ""
echo "  Configurator UI:     http://localhost:${CONFIGURATOR_PORT:-3000}"
echo "  OpenClaw Gateway:    ws://localhost:${OPENCLAW_PORT:-18789}"
echo "  OpenClaw Dashboard:  http://localhost:${OPENCLAW_PORT:-18789}/openclaw"
echo ""
echo "  Logs:  docker compose logs -f"
echo "  Stop:  docker compose down"
echo ""
