#!/usr/bin/env bash
#
# Verifies the restyled Terms of Sale wording against the original template, then
# renders sample invoices to /tmp/invoice-preview for visual review.
#
# The PDF layout modules are browser code, so they are bundled with the esbuild
# that ships with Vite rather than requiring a separate TypeScript runner.
#
# Usage: ./scripts/preview.sh
set -euo pipefail

cd "$(dirname "$0")/.."

BUILD_DIR="$(mktemp -d)"
trap 'rm -rf "$BUILD_DIR"' EXIT

run() {
  local entry="$1"
  local out="$BUILD_DIR/$(basename "$entry" .ts).mjs"
  ./node_modules/.bin/esbuild "$entry" --bundle --platform=node --format=esm \
    --outfile="$out" --log-level=warning
  node "$out"
}

run scripts/verify-terms.ts
echo
run scripts/preview-invoice.ts
